// app/api/gemini/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  try {
    // ✅ Use new initialization syntax with v1 forced
console.log("Gemini Key Loaded:", !!process.env.GEMINI_API_KEY);
    const genAI = new GoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY!,
      apiVersion: "v1",
    });

    // ✅ Use correct model name (no "-latest")
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


    const prompt = `
      You are a finance community assistant.
      Suggest 3 trending Instagram and YouTube finance influencers with their handles and one quick unique tip each.
      Make sure results change slightly every time.
      Format response as JSON like:
      [
        {"name": "Creator Name", "platform": "YouTube", "topic": "Topic", "link": "https://..."},
        {"name": "Creator Name", "platform": "Instagram", "topic": "Topic", "link": "https://..."}
      ]
    `;

    // ✅ Use correct SDK call for v1
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const text = result.response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = [{ name: "Error parsing", platform: "Unknown", topic: text }];
    }

    return NextResponse.json({ influencers: data });
  } catch (error: any) {
    console.error("[GoogleGenerativeAI Error]:", error);
    return NextResponse.json({ influencers: [], error: error.message }, { status: 500 });
  }
}
