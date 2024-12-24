import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { Annotation, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { toolsCondition } from "@langchain/langgraph/prebuilt";
import { BaseMessage, isAIMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const prettyPrint = (message: BaseMessage) => {
  let txt = `[${message._getType()}]: ${message.content}`;
  if ((isAIMessage(message) && message.tool_calls?.length) || 0 > 0) {
    const tool_calls = (message as AIMessage)?.tool_calls
      ?.map((tc) => `- ${tc.name}(${JSON.stringify(tc.args)})`)
      .join("\n");
    txt += ` \nTools: \n${tool_calls}`;
  }
  console.log(txt);
};


const useLangChain = async () => {
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
  const cheerioLoader = new CheerioWebBaseLoader(
    "https://www.congress.gov/bill/118th-congress/house-bill/10545/text/eh?format=txt",
    //"https://lilianweng.github.io/posts/2023-06-23-agent/",
    {
      selector: pTagSelector
    }
  );

  //const docs = await cheerioLoader.load();

  

  const billPath = "./src/assets/BILLS-118hr10545eh.pdf";

  const loader = new PDFLoader(billPath);

  const docs = await loader.load();

  console.log(docs);


  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, chunkOverlap: 200
  });
  const allSplits = await splitter.splitDocuments(docs);

  // Index chunks
  await vectorStore.addDocuments(allSplits);

  // Define prompt for question-answering
  const promptTemplate = await pull<ChatPromptTemplate>("rlm/rag-prompt");

  // Define state for application
  const InputStateAnnotation = Annotation.Root({
    question: Annotation<string>,
  });

  const StateAnnotation = Annotation.Root({
    question: Annotation<string>,
    context: Annotation<Document[]>,
    answer: Annotation<string>,
  });

  // Define application steps
  const retrieveSchema = z.object({ query: z.string() });

  const retrieve = tool(
    async ({ query }) => {
      const retrievedDocs = await vectorStore.similaritySearch(query, 2);
      const serialized = retrievedDocs
        .map(
          (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`
        )
        .join("\n");
      return [serialized, retrievedDocs];
    },
    {
      name: "retrieve",
      description: "Retrieve information related to a query.",
      schema: retrieveSchema,
      responseFormat: "content_and_artifact",
    }
  );

  // Step 1: Generate an AIMessage that may include a tool-call to be sent.
  async function queryOrRespond(state: typeof MessagesAnnotation.State) {
    const llmWithTools = llm.bindTools([retrieve]);
    const response = await llmWithTools.invoke(state.messages);
    // MessagesState appends messages to state instead of overwriting
    return { messages: [response] };
  }

  // Step 2: Execute the retrieval.
  const tools = new ToolNode([retrieve]);

  // Step 3: Generate a response using the retrieved content.
  async function generate(state: typeof MessagesAnnotation.State) {
    // Get generated ToolMessages
    let recentToolMessages = [];
    for (let i = state["messages"].length - 1; i >= 0; i--) {
      let message = state["messages"][i];
      if (message instanceof ToolMessage) {
        recentToolMessages.push(message);
      } else {
        break;
      }
    }
    let toolMessages = recentToolMessages.reverse();

    // Format into prompt
    const docsContent = toolMessages.map((doc) => doc.content).join("\n");
    const systemMessageContent =
      "You are an assistant for question-answering tasks. " +
      "Use the following pieces of retrieved context to answer " +
      "the question. If you don't know the answer, say that you " +
      "don't know. Use three sentences maximum and keep the " +
      "answer concise." +
      "\n\n" +
      `${docsContent}`;

    const conversationMessages = state.messages.filter(
      (message) =>
        message instanceof HumanMessage ||
        message instanceof SystemMessage ||
        (message instanceof AIMessage && message.tool_calls.length == 0)
    );
    const prompt = [
      new SystemMessage(systemMessageContent),
      ...conversationMessages,
    ];

    // Run
    const response = await llm.invoke(prompt);
    return { messages: [response] };
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
    streamMode: "values" as const,
  };


  const getResult = async (message: string) => {
    let inputs1 = { messages: [{ role: "user", content: message }] };

    for await (const step of await graphWithMemory.stream(inputs1, threadConfig)) {
      const lastMessage = step.messages[step.messages.length - 1];
      prettyPrint(lastMessage);
      console.log("-----\n");

      if (isAIMessage(lastMessage) && lastMessage.tool_calls?.length === 0) {
        return lastMessage.content;
      }
    }
  }

  return { getResult }
}

export default useLangChain