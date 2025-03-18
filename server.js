import './instrumentation.js';

import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import useOpenAI from './useOpenAI.js';

dotenv.config();

const __dirname = path.resolve();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.use(express.static(path.join(__dirname, "/dist")))

app.get("*", (req,res) =>{
  const __dirname = path.resolve();
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
})

const {getResult} = await useOpenAI();

app.post('/api/getNextResponse', async (req, res) => {
    try {

        const {message, messages} = req.body;

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