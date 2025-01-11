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

const getNewConvId = () => {
  return Math.random().toString(36).substring(7);
}

app.post('/api/getNextResponse', async (req, res) => {
    try {

        let {message, convId} = req.body;

        if(!convId){
          convId = getNewConvId();
        }

        const completion = await getResult(message, convId);

        res.status(200).json({completion, convId});

    } catch (error) {

        console.error(error);
    res.status(500).json({ error: "An error occurred" });
        
    }

}); 



app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});