"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

type ChatRole = "user" | "assistant";
type ChatMessage = { id: string; role: ChatRole; content: string };

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Track Firebase user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // Mock welcome messages for guest users
  useEffect(() => {
    if (!user && messages.length === 0) {
      setMessages([
        { id: "welcome1", role: "assistant", content: "👋 Hi there! I’m Gullak AI." },
        {
          id: "welcome2",
          role: "assistant",
          content: "Ask me about saving, investing, or tracking your expenses 💰",
        },
      ]);
    }
  }, [user]);

  const quickPrompts = [
    "How can I save ₹10,000 this month?",
    "Suggest investment options for beginners",
    "Track my grocery expenses",
    "What's my spending pattern?",
  ];

  // Send message to backend
  async function sendMessage(text: string) {
    if (!text.trim()) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const userMsg: ChatMessage = { id, role: "user", content: text.trim() };
    const assistantId = `${id}-assistant`;
    const placeholderAssistant: ChatMessage = { id: assistantId, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, placeholderAssistant]);
    setInput("");
    setIsLoading(true);

    try {
      const payload = {
        messages: [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: text.trim() },
        ],
        user: user ? { name: user.email.split("@")[0], email: user.email } : null,
      };

      const res = await fetch("https://gullak-orvf.onrender.com/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !res.body) throw new Error("Failed to connect to AI");

      const data = await res.json();
const assistantText = data.advice || "No advice received.";
setMessages((prev) =>
  prev.map((m) => (m.id === assistantId ? { ...m, content: assistantText } : m))
);

    } catch (err) {
      console.error("Streaming error:", (err as Error).message);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "⚠️ Something went wrong. Please try again later." }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Bot className="h-12 w-12 text-primary" />
            <Sparkles className="h-6 w-6 text-secondary" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            {user ? `Welcome ${user.email.split("@")[0]} 👋` : "Chat with Gullak AI"}
          </h1>
          <p className="text-muted-foreground">
            {user
              ? "Let's talk about your money goals and smart investments."
              : "Login to get personalized finance insights — or start chatting as guest!"}
          </p>
        </motion.div>

        <Card className="mb-6">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="text-lg">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={scrollRef} className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p
  className="text-sm whitespace-pre-wrap leading-relaxed"
  dangerouslySetInnerHTML={{
    __html: message.content
      .replace(/\n/g, "<br/>") // line breaks visible
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // bold text
      .replace(/(:[a-z_]+:)/g, "") // remove literal emoji tags if any
  }}
/>

                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-secondary">
                        {user ? user.email[0].toUpperCase() : "G"}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce" />
                      <div
                        className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask Gullak AI anything about your money..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
