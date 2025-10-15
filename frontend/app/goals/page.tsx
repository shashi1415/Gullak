"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore"
import Navbar from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { Target, Plus, Calendar, TrendingUp, CreditCard, Bell } from "lucide-react"

// --- Types ---
type Goal = {
  id: string
  name: string
  target: number
  current: number
  deadline: string
  color: string
}

type Bill = {
  id: string
  name: string
  amount: number
  dueDate: string
  paid: boolean
}

// --- Helper: Browser Notification ---
const notify = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, { body })
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") new Notification(title, { body })
    })
  }
}

export default function FinancePage() {
  // --- State ---
  const [goals, setGoals] = useState<Goal[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [loadingBills, setLoadingBills] = useState(true)

  // Goal form
  const [newGoalName, setNewGoalName] = useState("")
  const [newGoalTarget, setNewGoalTarget] = useState(0)
  const [newGoalCurrent, setNewGoalCurrent] = useState(0)
  const [newGoalDeadline, setNewGoalDeadline] = useState("")
  const [newGoalColor, setNewGoalColor] = useState("from-primary to-secondary")
  const [addingGoal, setAddingGoal] = useState(false)

  // Bill form
  const [newBillName, setNewBillName] = useState("")
  const [newBillAmount, setNewBillAmount] = useState(0)
  const [newBillDueDate, setNewBillDueDate] = useState("")
  const [addingBill, setAddingBill] = useState(false)

  // --- Fetch Goals ---
  useEffect(() => {
    const fetchGoals = async () => {
      const snapshot = await getDocs(collection(db, "goals"))
      const goalsData: Goal[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Goal, "id">),
      }))
      setGoals(goalsData)
      setLoadingGoals(false)
    }
    fetchGoals()
  }, [])

  // --- Fetch Bills ---
  useEffect(() => {
    const fetchBills = async () => {
      const snapshot = await getDocs(collection(db, "bills"))
      const billsData: Bill[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Bill, "id">),
      }))
      setBills(billsData)
      setLoadingBills(false)

      // Notify bills due today
      const today = new Date().toISOString().slice(0, 10)
      billsData.forEach((bill) => {
        if (!bill.paid && bill.dueDate === today) {
          notify("Bill Due Today", `${bill.name} ₹${bill.amount} is due today!`)
        }
      })
    }
    fetchBills()
  }, [])

  // --- Add Goal ---
  const handleAddGoal = async () => {
    if (!newGoalName || !newGoalTarget || !newGoalDeadline) return
    setAddingGoal(true)
    try {
      const docRef = await addDoc(collection(db, "goals"), {
        name: newGoalName,
        target: newGoalTarget,
        current: newGoalCurrent,
        deadline: newGoalDeadline,
        color: newGoalColor,
      })
      setGoals([
        ...goals,
        {
          id: docRef.id,
          name: newGoalName,
          target: newGoalTarget,
          current: newGoalCurrent,
          deadline: newGoalDeadline,
          color: newGoalColor,
        },
      ])
      setNewGoalName("")
      setNewGoalTarget(0)
      setNewGoalCurrent(0)
      setNewGoalDeadline("")
      setNewGoalColor("from-primary to-secondary")
    } catch (err) {
      console.error("Error adding goal:", err)
    } finally {
      setAddingGoal(false)
    }
  }

  // --- Add Savings to Goal ---
  const handleAddSavings = async (goal: Goal, amount: number) => {
    if (!amount) return
    const goalRef = doc(db, "goals", goal.id)
    await updateDoc(goalRef, { current: goal.current + amount })
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id ? { ...g, current: g.current + amount } : g
      )
    )
  }

  // --- Add Bill ---
  const handleAddBill = async () => {
    if (!newBillName || !newBillAmount || !newBillDueDate) return
    setAddingBill(true)
    try {
      const docRef = await addDoc(collection(db, "bills"), {
        name: newBillName,
        amount: newBillAmount,
        dueDate: newBillDueDate,
        paid: false,
      })
      setBills([
        ...bills,
        {
          id: docRef.id,
          name: newBillName,
          amount: newBillAmount,
          dueDate: newBillDueDate,
          paid: false,
        },
      ])
      setNewBillName("")
      setNewBillAmount(0)
      setNewBillDueDate("")
    } catch (err) {
      console.error("Error adding bill:", err)
    } finally {
      setAddingBill(false)
    }
  }

  // --- Mark Bill as Paid ---
  const handleMarkPaid = async (bill: Bill) => {
    const billRef = doc(db, "bills", bill.id)
    await updateDoc(billRef, { paid: true })
    setBills((prev) =>
      prev.map((b) => (b.id === bill.id ? { ...b, paid: true } : b))
    )
  }

  // --- UI ---
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1 space-y-12">
        {/* --- Goals Section --- */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">Your Savings Goals</h1>
              <p className="text-muted-foreground">Track progress and add savings to stay motivated</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-start sm:items-center">
              <Input
                placeholder="Goal Name"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
              />
              <Input
                placeholder="Target ₹"
                type="number"
                value={newGoalTarget || ""}
                onChange={(e) => setNewGoalTarget(Number(e.target.value))}
              />
              <Input
                placeholder="Deadline"
                value={newGoalDeadline}
                onChange={(e) => setNewGoalDeadline(e.target.value)}
              />
              <Button onClick={handleAddGoal} disabled={addingGoal}>
                {addingGoal ? "Adding..." : <><Plus className="h-4 w-4" /> Add Goal</>}
              </Button>
            </div>
          </motion.div>

          {/* Goals Grid */}
          {loadingGoals ? (
            <p>Loading goals...</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {goals.map((goal, index) => {
                const progress = Math.round((goal.current / goal.target) * 100)
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden">
                      <div className={`h-2 bg-gradient-to-r ${goal.color}`} />
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            {goal.name}
                          </span>
                          <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {goal.deadline}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-2xl font-bold">₹{goal.current.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">of ₹{goal.target.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-primary">
                              ₹{(goal.target - goal.current).toLocaleString()} left
                            </p>
                            <p className="text-xs text-muted-foreground">to reach goal</p>
                          </div>
                        </div>

                        {/* Add Savings */}
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Add Savings ₹"
                            id={`addSavings-${goal.id}`}
                          />
                          <Button
                            onClick={() => {
                              const inputEl = document.getElementById(
                                `addSavings-${goal.id}`
                              ) as HTMLInputElement
                              handleAddSavings(goal, Number(inputEl.value))
                              inputEl.value = ""
                            }}
                          >
                            Add
                          </Button>
                        </div>

                        {progress >= 100 && (
                          <p className="text-green-600 font-semibold">🎉 Goal Achieved!</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>

        {/* --- Bills Section --- */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">Your Bills</h1>
              <p className="text-muted-foreground">Track upcoming bills and mark them as paid</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-start sm:items-center">
              <Input
                placeholder="Bill Name"
                value={newBillName}
                onChange={(e) => setNewBillName(e.target.value)}
              />
              <Input
                placeholder="Amount ₹"
                type="number"
                value={newBillAmount || ""}
                onChange={(e) => setNewBillAmount(Number(e.target.value))}
              />
              <Input
                placeholder="Due Date (YYYY-MM-DD)"
                value={newBillDueDate}
                onChange={(e) => setNewBillDueDate(e.target.value)}
              />
              <Button onClick={handleAddBill} disabled={addingBill}>
                {addingBill ? "Adding..." : <><Plus className="h-4 w-4" /> Add Bill</>}
              </Button>
            </div>
          </motion.div>

          {/* Bills Grid */}
          {loadingBills ? (
            <p>Loading bills...</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bills.map((bill, index) => {
                const today = new Date().toISOString().slice(0, 10)
                const overdue = !bill.paid && bill.dueDate < today
                return (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={`overflow-hidden ${
                        overdue ? "border-2 border-red-500" : ""
                      }`}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            {bill.name}
                          </span>
                          <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {bill.dueDate}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex justify-between items-center">
                        <p className={`text-lg font-semibold ${bill.paid ? "text-green-600" : ""}`}>
                          ₹{bill.amount.toLocaleString()}
                        </p>
                        <Button
                          variant={bill.paid ? "outline" : "default"}
                          onClick={() => handleMarkPaid(bill)}
                          disabled={bill.paid}
                        >
                          {bill.paid ? "Paid ✅" : "Mark as Paid"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
