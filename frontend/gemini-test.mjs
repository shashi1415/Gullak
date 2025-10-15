import { GoogleGenerativeAI } from "@google/generative-ai";

async function testGemini() {
  const genAI = new GoogleGenerativeAI("AIzaSyDyG3Hab_k2bCsKmrj4yHcHZlElA08cPaA");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent("Hello from Gemini!");
  console.log(result.response.text());
}

testGemini().catch(console.error);
