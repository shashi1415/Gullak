import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET() {
  try {
    // ✅ Use a valid model from ListModels
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

    // ✅ Use the v1beta generateContent format
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = result.response.text();

    // Parse JSON safely
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = [{ name: "Error", platform: "Unknown", topic: text }];
    }

    return NextResponse.json({ influencers: data });
  } catch (error: any) {
    console.error("[GoogleGenerativeAI Error]:", error);
    return NextResponse.json(
      { influencers: [], error: error.message },
      { status: 500 }
    );
  }
}
