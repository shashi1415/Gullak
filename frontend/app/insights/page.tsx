"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Users, Send, PlusCircle, Youtube, Instagram } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function CommunityPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [creating, setCreating] = useState(false);

  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<any[]>([]);

  const [groqInfluencers, setGroqInfluencers] = useState<any[]>([]);
  const msgsRef = useRef<HTMLDivElement | null>(null);

  // Listen to auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserEmail(u?.email ?? null);
    });
    return () => unsub();
  }, []);

  // Fetch channels in realtime
  useEffect(() => {
    const q = query(collection(db, "channels"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setChannels(arr);
    });
    return () => unsub();
  }, []);

  // Fetch messages for selected channel
  useEffect(() => {
    if (!selectedChannel) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, "channels", selectedChannel.id, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setMessages(arr);
      setTimeout(
        () =>
          msgsRef.current?.scrollTo({
            top: msgsRef.current.scrollHeight,
            behavior: "smooth",
          }),
        50
      );
    });
    return () => unsub();
  }, [selectedChannel]);

  // Load AI history
  useEffect(() => {
    const q = query(collection(db, "aiReplies"), orderBy("createdAt", "desc"), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setAiHistory(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  // Fetch Groq influencers
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/groq-influencers");
        const data = await res.json();
        if (data.influencers) setGroqInfluencers(data.influencers);
      } catch (err) {
        console.error("Error fetching Groq influencers:", err);
      }
    })();
  }, []);

  // Create new channel
  const createChannel = async () => {
    if (!newChannelName.trim()) return;
    setCreating(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "channels"), {
        name: newChannelName.trim(),
        owner: user?.email ?? "Anonymous",
        createdAt: serverTimestamp(),
      });
      setNewChannelName("");
      setShowCreateChannel(false);
    } catch (err) {
      console.error("Create channel error:", err);
      alert("Could not create channel. See console.");
    } finally {
      setCreating(false);
    }
  };

  // Send channel message
  const sendMessage = async () => {
    if (!selectedChannel || !newMessage.trim()) return;
    try {
      await addDoc(collection(db, "channels", selectedChannel.id, "messages"), {
        text: newMessage.trim(),
        user: userEmail ?? "Anonymous",
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  // AI interaction
  const callAi = async (queryText: string) => {
    setAiLoading(true);
    try {
      const user = auth.currentUser;
      const payload = { userId: user?.uid ?? null, query: queryText };
      const res = await fetch("http://127.0.0.1:5000/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`AI error: ${res.status} ${txt}`);
      }
      const json = await res.json();
      const advice = json.advice ?? json.message ?? "No response from AI.";

      await addDoc(collection(db, "aiReplies"), {
        userId: user?.uid ?? null,
        userEmail: user?.email ?? "Anonymous",
        query: queryText,
        advice,
        createdAt: serverTimestamp(),
      });

      setAiHistory((prev) =>
        [{ id: `local-${Date.now()}`, query: queryText, advice, createdAt: new Date() }, ...prev].slice(0, 20)
      );
      return advice;
    } catch (err) {
      console.error("callAi error:", err);
      throw err;
    } finally {
      setAiLoading(false);
    }
  };

  const sendAiQuestion = async () => {
    if (!aiInput.trim()) return;
    try {
      const question = aiInput.trim();
      setAiHistory((prev) => [{ id: `q-${Date.now()}`, query: question, advice: "Thinking..." }, ...prev]);
      setAiInput("");
      const advice = await callAi(question);
      setAiHistory((prev) => {
        const p = [...prev];
        const idx = p.findIndex((x) => x.advice === "Thinking...");
        if (idx !== -1) p[idx] = { ...p[idx], advice };
        return p;
      });
    } catch {
      alert("AI request failed. See console.");
    }
  };

  const askAiAboutChannel = async () => {
    if (!selectedChannel) return alert("Select a channel first.");
    const sample = messages.slice(-8).map((m) => `${m.user}: ${m.text}`).join("\n");
    const question = `Summarize recent discussion in "${selectedChannel.name}" and give 3 short tips for the users:\n\n${sample}`;
    setAiInput(question);
    await sendAiQuestion();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-center mb-6">
          💬 Finance Community Hub
        </motion.h1>

        {/* Featured experts / Groq influencers */}
        <Card className="mb-8 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Users className="text-primary" /> Featured Experts</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            {groqInfluencers.length > 0 ? groqInfluencers.map((expert, i) => (
              <a key={i} href={expert.link} target="_blank" rel="noreferrer" className="p-4 border rounded-xl hover:bg-muted transition-all">
                <div className="flex items-center gap-3">
                  {expert.platform === "YouTube" ? <Youtube className="text-red-500" /> : <Instagram className="text-pink-500" />}
                  <div>
                    <p className="font-semibold">{expert.name}</p>
                    <p className="text-sm text-muted-foreground">{expert.topic}</p>
                  </div>
                </div>
              </a>
            )) : <div className="text-muted-foreground">Loading influencers...</div>}
          </CardContent>
        </Card>

        {/* Channels + Chat + AI Assistant */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Channels */}
          <Card className="h-[600px] overflow-y-auto">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Your Channels</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowCreateChannel(true)}>
                <PlusCircle className="w-4 h-4 mr-1" /> New
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {channels.length === 0 && <div className="text-muted-foreground">No channels yet — create one.</div>}
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch)}
                  className={`p-3 rounded-lg cursor-pointer select-none ${selectedChannel?.id === ch.id ? "bg-primary text-white" : "bg-muted/50 hover:bg-muted"}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{ch.name}</p>
                      <p className="text-xs text-muted-foreground">{ch.owner === userEmail ? "👑 You" : ch.owner}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{ch.createdAt?.toDate ? new Date(ch.createdAt.toDate()).toLocaleDateString() : ""}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat + AI */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {/* Chat */}
            <Card className="h-[360px] flex flex-col">
              <CardHeader>
                <CardTitle> {selectedChannel ? `# ${selectedChannel.name}` : "Select a channel"} </CardTitle>
              </CardHeader>
              <CardContent ref={msgsRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 rounded-lg">
                {!selectedChannel && <div className="text-muted-foreground text-center py-12">Select a channel to view messages.</div>}
                {selectedChannel && messages.length === 0 && <div className="text-muted-foreground text-center py-12">No messages yet — be the first to say hi 👋</div>}
                {selectedChannel && messages.map((msg) => {
                  const isMe = msg.user === userEmail;
                  return (
                    <div key={msg.id ?? `${msg.user}-${msg.createdAt?.seconds ?? Math.random()}`} className={`p-3 rounded-lg max-w-[80%] ${isMe ? "ml-auto bg-primary text-white" : "bg-white border"}`}>
                      <div className="text-sm">{msg.text}</div>
                      <div className="text-xs opacity-60 mt-1">{msg.user}{msg.createdAt?.toDate ? ` • ${new Date(msg.createdAt.toDate()).toLocaleTimeString()}` : ""}</div>
                    </div>
                  );
                })}
              </CardContent>
              <div className="flex gap-2 p-4 border-t">
                <Input placeholder={selectedChannel ? "Type a message..." : "Select a channel first"} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={!selectedChannel} onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }} />
                <Button onClick={sendMessage} disabled={!selectedChannel || !newMessage.trim()}><Send className="w-4 h-4" /></Button>
                <Button variant="outline" onClick={askAiAboutChannel} disabled={!selectedChannel || messages.length === 0}>AI: Summarize</Button>
              </div>
            </Card>

            {/* AI Assistant */}
            <Card className="h-[260px] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <CardTitle>🤖 AI Assistant</CardTitle>
                  <div className="text-xs text-muted-foreground">Powered by /ai-advice</div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {aiHistory.length === 0 && <div className="text-muted-foreground">Ask the AI about investing, budgeting, or channel discussions.</div>}
                {aiHistory.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-white border">
                    <div className="text-sm font-medium mb-1">Q: {item.query}</div>
                    <div className="text-sm text-muted-foreground">A: {item.advice}</div>
                    <div className="text-xs opacity-60 mt-1">{item.userEmail ? item.userEmail : ""}</div>
                  </div>
                ))}
              </CardContent>
              <div className="flex gap-2 p-4 border-t">
                <Input placeholder="Ask AI: e.g. 'Best allocation for medium risk?'" value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendAiQuestion(); }} />
                <Button onClick={sendAiQuestion} disabled={aiLoading || !aiInput.trim()}>
                  {aiLoading ? "Thinking..." : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Create channel modal */}
        {showCreateChannel && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-6 w-[90%] max-w-md">
              <CardTitle className="mb-4">Create New Channel</CardTitle>
              <Input placeholder="Enter channel name" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} />
              <div className="flex justify-end mt-4 gap-2">
                <Button variant="outline" onClick={() => setShowCreateChannel(false)}>Cancel</Button>
                <Button onClick={createChannel} disabled={creating}>{creating ? "Creating..." : "Create"}</Button>
              </div>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
