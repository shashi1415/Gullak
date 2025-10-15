"use client";
import { addExpense } from "@/lib/firestore";

export default function Test() {
  return (
    <div className="flex items-center justify-center h-screen">
      <button
        onClick={() => addExpense("test-user", 100, "Food")}
        className="bg-indigo-600 text-white p-4 rounded"
      >
        Add Test Expense
      </button>
    </div>
  );
}
