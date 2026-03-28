"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, DollarSign, Wallet } from "lucide-react";
import Link from "next/link";

interface Transaction {
  id: string;
  type: "SALARY_DUE" | "PAYMENT";
  amount: number;
  description: string | null;
  date: string;
}

interface Staff {
  id: string;
  name: string;
  position: string | null;
  salary: number;
  balance: number;
  transactions: Transaction[];
}

export default function StaffDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<"SALARY_DUE" | "PAYMENT">("PAYMENT");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const fetchStaffDetails = async () => {
    try {
      const res = await fetch(`/api/staff/${id}`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffDetails();
  }, [id]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    try {
      const res = await fetch(`/api/staff/${id}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: transactionType,
          amount: parseFloat(amount),
          description,
        }),
      });

      if (res.ok) {
        setShowTransactionModal(false);
        setAmount("");
        setDescription("");
        fetchStaffDetails(); // Refresh data
      } else {
        alert("Failed to create transaction");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading staff details...</div>;
  if (!staff) return <div className="p-8 text-center text-red-500">Staff not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/staff" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{staff.name}</h1>
          <p className="text-gray-500">{staff.position || "Staff Member"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500 mb-1">Assigned Salary</p>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-gray-900">Rs {staff.salary.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500 mb-1">Current Balance</p>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${
              staff.balance > 0 ? 'bg-red-50 text-red-600' : 
              staff.balance < 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
            }`}>
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-3xl font-bold ${
                staff.balance > 0 ? 'text-red-600' : 
                staff.balance < 0 ? 'text-green-600' : 'text-gray-900'
              }`}>
                Rs {Math.abs(staff.balance).toLocaleString()}
              </p>
              <p className="text-sm font-medium mt-1">
                {staff.balance > 0 ? "Amount Due (Hotel owes staff)" : 
                 staff.balance < 0 ? "Advance Taken (Staff owes hotel)" : 
                 "Settled (No dues)"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Transaction Ledger</h2>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setTransactionType("SALARY_DUE");
                setAmount(staff.salary.toString());
                setDescription("Monthly Salary Due");
                setShowTransactionModal(true);
              }}
              className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
              Add Salary Due
            </button>
            <button
              onClick={() => {
                setTransactionType("PAYMENT");
                setAmount("");
                setDescription("Salary Payment / Advance");
                setShowTransactionModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Record Payment
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 font-semibold text-gray-600">Date</th>
                <th className="py-4 px-6 font-semibold text-gray-600">Type</th>
                <th className="py-4 px-6 font-semibold text-gray-600">Description</th>
                <th className="py-4 px-6 font-semibold text-gray-600 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {staff.transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">No transactions recorded yet.</td>
                </tr>
              ) : (
                staff.transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-gray-600">
                      {tx.date ? tx.date.split('T')[0] : "-"}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        tx.type === 'SALARY_DUE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {tx.type === 'SALARY_DUE' ? 'SALARY DUE' : 'PAYMENT'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-800">{tx.description || "-"}</td>
                    <td className={`py-4 px-6 text-right font-bold ${
                      tx.type === 'SALARY_DUE' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {tx.type === 'SALARY_DUE' ? '+' : '-'} Rs {tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {transactionType === 'SALARY_DUE' ? 'Record Salary Due' : 'Record Payment / Advance'}
            </h2>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. March Salary"
                />
              </div>
              
              {transactionType === 'PAYMENT' && (
                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-2">
                  <Wallet className="w-5 h-5 shrink-0" />
                  <p>This payment will automatically be recorded in the Expenses section as "Staff Salary".</p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    transactionType === 'SALARY_DUE' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Confirm {transactionType === 'SALARY_DUE' ? 'Due' : 'Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
