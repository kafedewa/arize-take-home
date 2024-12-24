import express from 'express'
import dotenv from 'dotenv'
import OpenAI from "openai";
import path from 'path'
import useLangChain from './useLangChain.js';

dotenv.config();


const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const __dirname = path.resolve();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.use(express.static(path.join(__dirname, "/dist")))

app.get("*", (req,res) =>{
  const __dirname = path.resolve();
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
})

const {getResult} = await useLangChain();

app.post('/api/getNextResponse', async (req, res) => {
    try {

        const {message, messages} = req.body;

        let formattedMessages = [
            {
                "role": "system",
                "content": [
                  {
                    "type": "text",
                    "text": "\"You are a helpful assistant."
                  }
                ]
              }
        ];

        if(messages.length > 0){
            formattedMessages = formattedMessages.concat(messages.map((r) => ({
                role: r.role,
                content: [{"type": "text", "text": r.message}]
            })));
        }

        formattedMessages = formattedMessages.concat([{
          role: "user",
          content: [{"type": "text", "text": message}]
        }]);

        console.log(formattedMessages);

        /*const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: formattedMessages,
            response_format: {
                "type": "text"
            },
        });*/

        const completion = await getResult(message);

        res.status(200).json(completion);

    } catch (error) {

        console.error(error);
    res.status(500).json({ error: "An error occurred" });
        
    }

}); 



app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});