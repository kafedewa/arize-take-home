var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import OpenAI from "openai";
import fs from "fs";
const useOpenAI = () => __awaiter(void 0, void 0, void 0, function* () {
    const openai = new OpenAI();
    const assistant = yield openai.beta.assistants.create({
        name: "Bill Assistant",
        instructions: "You are an expert on congressional bills. Use you knowledge base to answer questions about the provided bill.",
        model: "gpt-4o",
        tools: [{ type: "file_search", "file_search": { "max_num_results": 5 } }],
    });
    const fileStreams = ["./src/assets/BILLS-118hr10545eh.pdf"].map((path) => fs.createReadStream(path));
    // Create a vector store including our two files.
    let vectorStore = yield openai.beta.vectorStores.create({
        name: "Bill",
    });
    yield openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, { files: fileStreams });
    yield openai.beta.assistants.update(assistant.id, {
        tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } },
    });
    const thread = yield openai.beta.threads.create();
    const getResult = (userMessage) => __awaiter(void 0, void 0, void 0, function* () {
        const threadMessages = yield openai.beta.threads.messages.create(thread.id, { role: "user", content: userMessage });
        const run = yield openai.beta.threads.runs.createAndPoll(thread.id, {
            assistant_id: assistant.id,
        });
        const messages = yield openai.beta.threads.messages.list(thread.id, {
            run_id: run.id,
        });
        console.log(messages);
        const message = messages.data.pop();
        if (message.content[0].type === "text") {
            const { text } = message.content[0];
            const { annotations } = text;
            const citations = [];
            let index = 0;
            for (let annotation of annotations) {
                text.value = text.value.replace(annotation.text, "[" + index + "]");
                if ('file_citation' in annotation) {
                    const citedFile = yield openai.files.retrieve(annotation.file_citation.file_id);
                    citations.push("[" + index + "]" + citedFile.filename);
                }
                index++;
            }
            console.log(text.value);
            console.log(citations.join("\n"));
            return text.value;
        }
    });
    return { getResult };
});
export default useOpenAI;
