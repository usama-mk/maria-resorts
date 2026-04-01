"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Staff {
  id: string;
  name: string;
  position: string | null;
  salary: number;
  balance: number;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
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
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, position, salary: parseFloat(salary) || 0 }),
      });
      
      if (res.ok) {
        setShowAddModal(false);
        setName("");
        setPosition("");
        setSalary("");
        fetchStaff();
      } else {
        alert("Failed to create staff");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Staff Management
          </h1>
          <p className="text-gray-500 mt-1">Manage staff salaries and balances</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Staff
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 font-semibold text-gray-600">Name</th>
                <th className="py-4 px-6 font-semibold text-gray-600">Position</th>
                <th className="py-4 px-6 font-semibold text-gray-600">Assigned Salary</th>
                <th className="py-4 px-6 font-semibold text-gray-600">Current Balance</th>
                <th className="py-4 px-6 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No staff members found.</td></tr>
              ) : (
                staff.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{s.name}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{s.position || "N/A"}</td>
                    <td className="py-4 px-6 font-medium text-gray-700">Rs {s.salary.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        s.balance > 0 
                          ? "bg-red-100 text-red-700" 
                          : s.balance < 0 
                            ? "bg-green-100 text-green-700" // Negative balance means hotel gave advance, staff owes
                            : "bg-gray-100 text-gray-700"
                      }`}>
                        {s.balance > 0 ? `Rs ${s.balance.toLocaleString()} (Due)` : 
                         s.balance < 0 ? `Rs ${Math.abs(s.balance).toLocaleString()} (Advance)` : 
                         "Settled"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link 
                        href={`/dashboard/staff/${s.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Add New Staff</h2>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Receptionist"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Salary (Rs)</label>
                <input
                  type="number"
                  required
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  loading={submitting}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  Add Staff
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
