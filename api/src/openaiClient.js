import dotenv from "dotenv";
import OpenAI from "openai";
import { OpenAIEmbeddings } from "@langchain/openai";

dotenv.config();

const useMockEmbeddings = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith("mock");

let client;
let lcEmbeddings;
if (!useMockEmbeddings) {
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  lcEmbeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
}

export async function embed(text) {
  if (!text) return [];
  if (useMockEmbeddings) {
    const hash = Array.from(text).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
    const vec = [];
    for (let i = 0; i < 1536; i++) {
      vec.push(Math.sin(hash + i));
    }
    return vec;
  }
  if (lcEmbeddings) {
    return await lcEmbeddings.embedQuery(text);
  }
  const resp = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return resp.data[0].embedding;
}
export default client;
