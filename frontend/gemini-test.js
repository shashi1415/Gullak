import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyDyG3Hab_k2bCsKmrj4yHcHZlElA08cPaA");

async function listModels() {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1/models?key=AIzaSyDyG3Hab_k2bCsKmrj4yHcHZlElA08cPaA"
  );
  const data = await response.json();
  console.log("Available models:");
  data.models.forEach((m) => console.log("-", m.name));
}

listModels();
