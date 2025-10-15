"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db, auth } from "@/lib/firebase";
import Navbar from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

type Investment = {
  id: string;
  name: string;
  type: string;
  invested: number;
  current: number;
  risk?: "Low" | "Medium" | "High";
  createdAt?: any;
  isDemo?: boolean;
};

type Message = { role: "user" | "ai"; content: string };

export default function InvestmentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [type, setType] = useState("Mutual Fund");
  const [invested, setInvested] = useState<number | "">("");
  const [current, setCurrent] = useState<number | "">("");
  const [risk, setRisk] = useState<"Low" | "Medium" | "High">("Low");
  const [adding, setAdding] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatEnabled, setChatEnabled] = useState(false); // Only enable after analysis

  const [demoAdded, setDemoAdded] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setInvestments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchInvestments = async () => {
      try {
        const q = query(collection(db, "investments"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        const arr: Investment[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Investment, "id">),
        }));
        setInvestments(arr);
      } catch (err) {
        console.error("Error fetching investments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestments();
  }, [user]);

  const totals = useMemo(() => {
    const valid = investments.filter((i) => !i.isDemo);
    const totalInvested = valid.reduce((s, i) => s + (i.invested || 0), 0);
    const totalCurrent = valid.reduce((s, i) => s + (i.current || 0), 0);
    return { totalInvested, totalCurrent };
  }, [investments]);

  const handleAdd = async () => {
    if (!user) return alert("Please login to add investments.");
    if (!name || !invested || !current) return alert("Please fill all fields.");

    setAdding(true);
    try {
      const payload = {
        userId: user.uid,
        name,
        type,
        invested: Number(invested),
        current: Number(current),
        risk,
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "investments"), payload);
      setInvestments((prev) => [
        ...prev.filter((i) => !i.isDemo),
        { id: ref.id, name, type, invested: Number(invested), current: Number(current), risk },
      ]);
      setDemoAdded(false);
      setName("");
      setType("Mutual Fund");
      setInvested("");
      setCurrent("");
      setRisk("Low");
    } catch (err) {
      console.error("Add investment error:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateAmounts = async (id: string, newInvested: number, newCurrent: number) => {
    try {
      const ref = doc(db, "investments", id);
      await updateDoc(ref, { invested: newInvested, current: newCurrent });
      setInvestments((prev) =>
        prev.map((it) => (it.id === id ? { ...it, invested: newInvested, current: newCurrent } : it))
      );
    } catch (err) {
      console.error("Update investment:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this investment?")) return;
    try {
      await deleteDoc(doc(db, "investments", id));
      setInvestments((prev) => prev.filter((it) => it.id !== id));
    } catch (err) {
      console.error("Delete investment:", err);
    }
  };

  // AI portfolio analysis
  const askAiForPortfolio = async (question: string) => {
    if (!user) return alert("Login to get AI advice.");
    setAiLoading(true);
    setAiAdvice(null);
    setMessages([]);

    try {
      const res = await fetch("https://gullak-orvf.onrender.com/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, query: question }),
      });
      const data = await res.json();
      const aiReply = data?.advice ?? data?.message ?? "No advice returned.";
      setAiAdvice(aiReply);
      setMessages((prev) => [...prev, { role: "ai", content: aiReply }]);
      setChatEnabled(true); // ✅ enable follow-up chat after analysis
    } catch (err) {
      console.error(err);
      setAiAdvice("Error fetching AI advice.");
    } finally {
      setAiLoading(false);
    }
  };

  // Send follow-up message to AI
  const sendChatMessage = async () => {
    if (!inputMessage.trim() || !user || !chatEnabled) return;

    const userMsg = inputMessage.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInputMessage("");
    setAiLoading(true);

    try {
      const res = await fetch("https://gullak-orvf.onrender.com/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, messages: [...messages, { role: "user", content: userMsg }] }),
      });
      const data = await res.json();
      const aiReply = data?.advice ?? data?.message ?? "No reply from AI.";
      setMessages((prev) => [...prev, { role: "ai", content: aiReply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "ai", content: "Error contacting AI." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const MiniBar = ({ value, max = totals.totalCurrent || 1 }: { value: number; max?: number }) => {
    const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
    return (
      <div className="w-28 h-2 bg-muted rounded overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${pct}%` }} />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Header & Buttons */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Investment Portfolio</h1>
            <p className="text-muted-foreground">Track & manage your investments — AI helps you analyze performance</p>
          </div>

          <div className="flex gap-2 items-center">
            <Button onClick={() => askAiForPortfolio("Analyze my portfolio")} disabled={!user || aiLoading}>
              {aiLoading ? "Analyzing..." : "AI: Analyze Portfolio"}
            </Button>
            {!demoAdded && investments.length === 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  if (!user) return alert("Login to use demo data.");
                  setInvestments([
                    { id: "demo-1", name: "Demo Nifty Fund", type: "Mutual Fund", invested: 50000, current: 58000, isDemo: true },
                    { id: "demo-2", name: "Demo SIP", type: "SIP", invested: 24000, current: 27000, isDemo: true },
                  ]);
                  setDemoAdded(true);
                }}
              >
                Quick Demo
              </Button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Invested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totals.totalInvested.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totals.totalCurrent.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardHeader>
              <CardTitle>Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {totals.totalInvested > 0
                  ? `${(((totals.totalCurrent - totals.totalInvested) / totals.totalInvested) * 100).toFixed(1)}%`
                  : "—"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add investment */}
        <div className="mb-6">
          <Card>
            <CardContent className="flex flex-wrap gap-3 items-center">
              <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Type" value={type} onChange={(e) => setType(e.target.value)} />
              <Input
                placeholder="Invested ₹"
                type="number"
                value={invested}
                onChange={(e) => setInvested(e.target.value === "" ? "" : Number(e.target.value))}
              />
              <Input
                placeholder="Current ₹"
                type="number"
                value={current}
                onChange={(e) => setCurrent(e.target.value === "" ? "" : Number(e.target.value))}
              />
              <select value={risk} onChange={(e) => setRisk(e.target.value as any)} className="px-3 py-2 border rounded">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <Button onClick={handleAdd} disabled={adding || !user}>
                {adding ? (
                  "Adding..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" /> Add Investment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Investments list */}
        <div className="grid gap-4">
          {loading ? (
            <p>Loading investments...</p>
          ) : investments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p>No investments yet.</p>
                <p className="text-sm text-muted-foreground">Add your first investment above.</p>
              </CardContent>
            </Card>
          ) : (
            investments.map((inv) => {
              const allocationPct = totals.totalCurrent ? Math.round((inv.current / totals.totalCurrent) * 100) : 0;
              return (
                <motion.div key={inv.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-lg">{inv.name}</h3>
                            <div className="text-sm text-muted-foreground">
                              {inv.type} • {inv.risk || "—"} risk
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-lg">₹{inv.current.toLocaleString()}</div>
                            <div
                              className={`text-sm ${
                                inv.current - inv.invested >= 0 ? "text-primary" : "text-destructive"
                              }`}
                            >
                              {inv.current - inv.invested >= 0 ? "+" : ""}
                              ₹{(inv.current - inv.invested).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MiniBar value={inv.current} />
                            <div className="text-xs text-muted-foreground">{allocationPct}% of portfolio</div>
                          </div>

                          {!inv.isDemo && (
                            <div className="flex gap-2 items-center">
                              <button
                                className="text-sm px-3 py-1 border rounded"
                                onClick={async () => {
                                  const add = Number(prompt("Add amount (₹):", "1000") || "0");
                                  if (!add) return;
                                  await handleUpdateAmounts(inv.id, inv.invested + add, inv.current + add);
                                }}
                              >
                                Add Savings
                              </button>
                              <button
                                className="text-sm px-3 py-1 border rounded"
                                onClick={async () => {
                                  const sell = Number(prompt("Sell amount (₹):", "1000") || "0");
                                  if (!sell) return;
                                  const newCurrent = Math.max(0, inv.current - sell);
                                  const newInvested = Math.max(0, inv.invested - Math.min(inv.invested, sell));
                                  await handleUpdateAmounts(inv.id, newInvested, newCurrent);
                                }}
                              >
                                Sell
                              </button>
                              <button
                                className="text-sm px-3 py-1 border rounded"
                                onClick={() =>
                                  askAiForPortfolio(`Advise about ${inv.name} (invested ₹${inv.invested}, current ₹${inv.current})`)
                                }
                              >
                                Ask AI
                              </button>
                              <button
                                className="text-sm px-3 py-1 border rounded text-destructive"
                                onClick={() => handleDelete(inv.id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* AI chat */}
        {aiAdvice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <Card className="bg-accent/5 border-accent/30">
              <CardHeader>
                <CardTitle>Gullak AI Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded ${
                      msg.role === "ai" ? "bg-primary/10 self-start" : "bg-secondary/10 self-end"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
              </CardContent>
              <div className="flex mt-2 gap-2">
                <Input
                  placeholder="Type your question..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendChatMessage();
                  }}
                  disabled={!chatEnabled}
                />
                <Button onClick={sendChatMessage} disabled={aiLoading || !chatEnabled}>
                  {aiLoading ? "Sending..." : "Send"}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
