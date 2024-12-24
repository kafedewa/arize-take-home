var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { pull } from "langchain/hub";
import { Annotation, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { AIMessage, HumanMessage, SystemMessage, ToolMessage, } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { toolsCondition } from "@langchain/langgraph/prebuilt";
import { isAIMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
const prettyPrint = (message) => {
    var _a, _b;
    let txt = `[${message._getType()}]: ${message.content}`;
    if ((isAIMessage(message) && ((_a = message.tool_calls) === null || _a === void 0 ? void 0 : _a.length)) || 0 > 0) {
        const tool_calls = (_b = message === null || message === void 0 ? void 0 : message.tool_calls) === null || _b === void 0 ? void 0 : _b.map((tc) => `- ${tc.name}(${JSON.stringify(tc.args)})`).join("\n");
        txt += ` \nTools: \n${tool_calls}`;
    }
    console.log(txt);
};
const useLangChain = () => __awaiter(void 0, void 0, void 0, function* () {
    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
        openAIApiKey: process.env.OPENAI_API_KEY
    });
    const vectorStore = new MemoryVectorStore(embeddings);
    const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0,
        openAIApiKey: process.env.OPENAI_API_KEY
    });
    // Load and chunk contents of blog
    const pTagSelector = "pre";
    const cheerioLoader = new CheerioWebBaseLoader("https://www.congress.gov/bill/118th-congress/house-bill/10545/text/eh?format=txt", 
    //"https://lilianweng.github.io/posts/2023-06-23-agent/",
    {
        selector: pTagSelector
    });
    //const docs = await cheerioLoader.load();
    const billPath = "./src/assets/BILLS-118hr10545eh.pdf";
    const loader = new PDFLoader(billPath);
    const docs = yield loader.load();
    console.log(docs);
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000, chunkOverlap: 200
    });
    const allSplits = yield splitter.splitDocuments(docs);
    // Index chunks
    yield vectorStore.addDocuments(allSplits);
    // Define prompt for question-answering
    const promptTemplate = yield pull("rlm/rag-prompt");
    // Define state for application
    const InputStateAnnotation = Annotation.Root({
        question: (Annotation),
    });
    const StateAnnotation = Annotation.Root({
        question: (Annotation),
        context: (Annotation),
        answer: (Annotation),
    });
    // Define application steps
    const retrieveSchema = z.object({ query: z.string() });
    const retrieve = tool((_a) => __awaiter(void 0, [_a], void 0, function* ({ query }) {
        const retrievedDocs = yield vectorStore.similaritySearch(query, 2);
        const serialized = retrievedDocs
            .map((doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`)
            .join("\n");
        return [serialized, retrievedDocs];
    }), {
        name: "retrieve",
        description: "Retrieve information related to a query.",
        schema: retrieveSchema,
        responseFormat: "content_and_artifact",
    });
    // Step 1: Generate an AIMessage that may include a tool-call to be sent.
    function queryOrRespond(state) {
        return __awaiter(this, void 0, void 0, function* () {
            const llmWithTools = llm.bindTools([retrieve]);
            const response = yield llmWithTools.invoke(state.messages);
            // MessagesState appends messages to state instead of overwriting
            return { messages: [response] };
        });
    }
    // Step 2: Execute the retrieval.
    const tools = new ToolNode([retrieve]);
    // Step 3: Generate a response using the retrieved content.
    function generate(state) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get generated ToolMessages
            let recentToolMessages = [];
            for (let i = state["messages"].length - 1; i >= 0; i--) {
                let message = state["messages"][i];
                if (message instanceof ToolMessage) {
                    recentToolMessages.push(message);
                }
                else {
                    break;
                }
            }
            let toolMessages = recentToolMessages.reverse();
            // Format into prompt
            const docsContent = toolMessages.map((doc) => doc.content).join("\n");
            const systemMessageContent = "You are an assistant for question-answering tasks. " +
                "Use the following pieces of retrieved context to answer " +
                "the question. If you don't know the answer, say that you " +
                "don't know. Use three sentences maximum and keep the " +
                "answer concise." +
                "\n\n" +
                `${docsContent}`;
            const conversationMessages = state.messages.filter((message) => message instanceof HumanMessage ||
                message instanceof SystemMessage ||
                (message instanceof AIMessage && message.tool_calls.length == 0));
            const prompt = [
                new SystemMessage(systemMessageContent),
                ...conversationMessages,
            ];
            // Run
            const response = yield llm.invoke(prompt);
            return { messages: [response] };
        });
    }
    const graphBuilder = new StateGraph(MessagesAnnotation)
        .addNode("queryOrRespond", queryOrRespond)
        .addNode("tools", tools)
        .addNode("generate", generate)
        .addEdge("__start__", "queryOrRespond")
        .addConditionalEdges("queryOrRespond", toolsCondition, {
        __end__: "__end__",
        tools: "tools",
    })
        .addEdge("tools", "generate")
        .addEdge("generate", "__end__");
    const graph = graphBuilder.compile();
    const checkpointer = new MemorySaver();
    const graphWithMemory = graphBuilder.compile({ checkpointer });
    // Specify an ID for the thread
    const threadConfig = {
        configurable: { thread_id: "abc123" },
        streamMode: "values",
    };
    const getResult = (message) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        var _d;
        let inputs1 = { messages: [{ role: "user", content: message }] };
        try {
            for (var _e = true, _f = __asyncValues(yield graphWithMemory.stream(inputs1, threadConfig)), _g; _g = yield _f.next(), _a = _g.done, !_a; _e = true) {
                _c = _g.value;
                _e = false;
                const step = _c;
                const lastMessage = step.messages[step.messages.length - 1];
                prettyPrint(lastMessage);
                console.log("-----\n");
                if (isAIMessage(lastMessage) && ((_d = lastMessage.tool_calls) === null || _d === void 0 ? void 0 : _d.length) === 0) {
                    return lastMessage.content;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_e && !_a && (_b = _f.return)) yield _b.call(_f);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
    return { getResult };
});
export default useLangChain;
