import { streamText } from "ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("[v0] /api/chat POST received");

  const { messages, user } = await req.json(); // 👈 optional user info from frontend

  console.log("[v0] /api/chat messages length:", messages?.length);

  const result = streamText({
    model: "openai/gpt-4o-mini",
    system: `
      You are Gullak AI, a friendly Indian personal finance assistant.
      Help users with:
      - Budgeting & savings (₹)
      - Investments (SIPs, mutual funds)
      - Debt management
      - Financial education & advice
      - Motivational money habits

      If user is not logged in (mock user), respond with general finance tips.
      If user is logged in (like ${user?.name || "Guest"}), personalize response with their name.
      Keep replies short, warm, and easy to understand.
    `,
    messages,
  });

  return result.toDataStreamResponse();
}
