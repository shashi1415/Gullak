"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Target,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { auth, db } from "@/lib/firebase"; // your firebase exports
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

type Transaction = {
  id: string;
  name: string;
  amount: number;
  category: string;
  time: string;
  type: "income" | "expense";
};

const MOCK_USER = {
  name: "Guest",
  balance: 12450,
  spentThisMonth: 4320,
  totalSaved: 2100,
  goalProgress: 45,
  transactions: [
    { id: "m1", name: "Mock Coffee", amount: -80, category: "Food", time: "2h ago", type: "expense" },
    { id: "m2", name: "Pocket Money", amount: 2000, category: "Income", time: "1d ago", type: "income" },
    { id: "m3", name: "Mock Snack", amount: -120, category: "Food", time: "2d ago", type: "expense" },
  ] as Transaction[],
};

export default function DashboardPage() {
  const [user, setUser] = useState<any | null>(null); // firebase user or null
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [goalProgress, setGoalProgress] = useState<number>(0);
  const [spentThisMonth, setSpentThisMonth] = useState<number>(0);
  const [totalSaved, setTotalSaved] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemo, setIsDemo] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    let unsubscribeTransactions: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Logged in - load real data
        setIsDemo(false);
        setUser(currentUser);

        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as any;
            setBalance(data.balance ?? 0);
            setGoalProgress(data.goalProgress ?? 0);
            setTotalSaved(data.totalSaved ?? 0);
            setSpentThisMonth(data.spentThisMonth ?? 0);
          } else {
            // If user doc missing, keep defaults (0) — optionally create profile doc on signup flow
          }

          const transactionsRef = collection(db, "users", currentUser.uid, "transactions");
          const q = query(transactionsRef, orderBy("time", "desc"));
          unsubscribeTransactions = onSnapshot(q, (snapshot) => {
            const txs: Transaction[] = snapshot.docs.map((d) => {
              const data = d.data() as any;
              return {
                id: d.id,
                name: data.name,
                amount: data.amount,
                category: data.category,
                time: data.time || "some time",
                type: data.type || (data.amount >= 0 ? "income" : "expense"),
              } as Transaction;
            });
            setTransactions(txs);
          });
        } catch (err) {
          console.error("Error fetching user data:", err);
        } finally {
          setLoading(false);
        }
      } else {
        // Not logged in — show demo/mock data instead of redirecting
        setUser(null);
        setIsDemo(true);
        setBalance(MOCK_USER.balance);
        setSpentThisMonth(MOCK_USER.spentThisMonth);
        setTotalSaved(MOCK_USER.totalSaved);
        setGoalProgress(MOCK_USER.goalProgress);
        setTransactions(MOCK_USER.transactions);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeTransactions) unsubscribeTransactions();
    };
  }, []);

  if (loading) return <p className="text-center mt-20">Loading dashboard...</p>;

  // prepare chart (take up to 7 entries)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const expenseData = transactions
    .filter((t) => t.type === "expense")
    .slice(0, 7)
    .map((tx, i) => ({ day: days[i % 7], amount: Math.abs(tx.amount) }));

  // greeting name (displayName if logged in, otherwise 'Guest' or demo name)
  const greetingName = user?.displayName || (user?.email ? user.email.split("@")[0] : isDemo ? MOCK_USER.name : "User");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* demo banner when not logged in */}
        {isDemo && (
          <div className="mb-6 rounded-md border border-dashed border-muted p-4 bg-muted/40 flex items-center justify-between">
            <div>
              <strong className="mr-2">Demo mode</strong>
              Viewing mock/demo data. <span className="text-sm text-muted-foreground">Log in to view your personal data.</span>
            </div>
          </div>
        )}

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            Hey {greetingName} 👋 — Welcome back to Gullak
          </h1>
          <p className="text-muted-foreground">Here's your financial overview {isDemo ? "(demo)" : "for today"}</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                <Wallet className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{balance.toLocaleString()}</div>
                {!isDemo && <p className="text-xs text-muted-foreground mt-1"><span className="text-primary">+12.5%</span> from last month</p>}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Spent This Month</CardTitle>
                <TrendingDown className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{spentThisMonth.toLocaleString()}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
                <PiggyBank className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalSaved.toLocaleString()}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{goalProgress}%</div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
                    style={{ width: `${goalProgress}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Expense Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={expenseData.length ? expenseData : [{ day: "Mon", amount: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transactions.length === 0 && <p className="text-sm text-muted-foreground">No transactions found</p>}
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${transaction.type === "income" ? "bg-primary/10" : "bg-secondary/10"}`}>
                        {transaction.type === "income" ? (
                          <ArrowUpRight className="h-4 w-4 text-primary" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-secondary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{transaction.name}</p>
                        <p className="text-xs text-muted-foreground">{transaction.time}</p>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${transaction.type === "income" ? "text-primary" : "text-foreground"}`}>
                      {transaction.type === "income" ? "+" : ""}₹{Math.abs(transaction.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Alerts Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-6">
          <Card className="bg-accent/5 border-accent/30">
            <CardContent className="flex items-start gap-4 p-6">
              <Bell className="h-5 w-5 text-accent mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Daily Reminder</h3>
                <p className="text-sm text-muted-foreground">
                  {isDemo ? "This is a demo reminder. Log in to get personalized reminders." : "You need to save ₹500 today to reach your goal. Keep it up!"}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Floating Add Button */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }} className="fixed bottom-8 right-8">
          <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0">
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
