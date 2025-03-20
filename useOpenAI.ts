import OpenAI from "openai";
import fs from "fs";


const useOpenAI = async () => {
    const openai = new OpenAI();

    async function createFile(filePath: string) {
        let result;
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
          // Download the file content from the URL
          const res = await fetch(filePath);
          const buffer = await res.arrayBuffer();
          const urlParts = filePath.split("/");
          const fileName = urlParts[urlParts.length - 1];
          const file = new File([buffer], fileName);
          result = await openai.files.create({
            file: file,
            purpose: "assistants",
          });
        } else {
          // Handle local file path
          const fileContent = fs.createReadStream(filePath);
          result = await openai.files.create({
            file: fileContent,
            purpose: "assistants",
          });
        }
        return result.id;
      }
      
      // Replace with your own file path or URL
      const fileId = await createFile(
        "./src/assets/BILLS-118hr10545eh.pdf"
      );
      

      const vectorStore = await openai.vectorStores.create({
        name: "BILLS-118hr10545eh",
     });

        await openai.vectorStores.files.create(
            vectorStore.id,
            {
                file_id: fileId,
            }
        );

    const getResult = async (userMessage: string) => {
        
       const response = await openai.responses.create({
            model: "gpt-4o-mini",
            input: userMessage,
            tools: [{
                type: "file_search",
                vector_store_ids: [vectorStore.id],
            }],
        });

        return response.output_text;

    }

    return { getResult }
}

export default useOpenAI