import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

// ➕ Add new expense
export async function addExpense(userId: string, amount: number, category: string) {
  await addDoc(collection(db, "expenses"), {
    userId,
    amount,
    category,
    createdAt: new Date(),
  });
}

// 📦 Fetch all user expenses
export async function getUserExpenses(userId: string) {
  const q = query(collection(db, "expenses"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
