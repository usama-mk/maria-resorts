'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
}

const CATEGORIES = [
  'Grocery',
  'Vegetables',
  'Repair & Maintenance',
  'Diesel',
  'Gas Cylinder',
  'Other'
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [userRole, setUserRole] = useState<string>('');

  // Form states
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16)); // Format for datetime-local

  useEffect(() => {
    fetchExpenses();
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      } catch (e) {
        // ignore
      }
    }
  }, [filterDate]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/expenses?date=${filterDate}`);
      setExpenses(response.data);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const finalCategory = category === 'Other' ? customCategory : category;
      
      if (!finalCategory) {
        toast.error('Please enter a category');
        setSubmitting(false);
        return;
      }

      await axios.post('/api/expenses', {
        category: finalCategory,
        amount,
        description,
        date,
      });

      toast.success('Expense added successfully');
      
      // Reset form
      setCategory(CATEGORIES[0]);
      setCustomCategory('');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().slice(0, 16));
      
      // Refresh list
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await axios.delete(`/api/expenses/${id}`);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <div className="flex items-center gap-2">
            <Label htmlFor="filterDate" className="whitespace-nowrap">Filter Date:</Label>
            <Input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-auto"
            />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Expense Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {category === 'Other' && (
                <div className="space-y-2">
                  <Label htmlFor="customCategory">Custom Category Name</Label>
                  <Input
                    id="customCategory"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category"
                    required={category === 'Other'}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date & Time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details..."
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Expense'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Expenses List */}
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Expenses ({format(new Date(filterDate), 'MMM d, yyyy')})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('en-PK', {
                            style: 'currency',
                            currency: 'PKR'
                        }).format(totalExpenses)}
                    </div>
                </CardContent>
            </Card>

            <Card className="h-fit">
            <CardHeader>
                <CardTitle>Expense List</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
                ) : expenses.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-4">
                    No expenses found for this date.
                </div>
                ) : (
                <div className="rounded-md border">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        {userRole === 'ADMIN' && <TableHead className="w-[50px]"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                            {format(new Date(expense.date), 'h:mm a')}
                            </TableCell>
                            <TableCell>
                            <div className="flex flex-col">
                                <span>{expense.category}</span>
                                {expense.description && (
                                <span className="text-xs text-gray-500 truncate max-w-[150px]">
                                    {expense.description}
                                </span>
                                )}
                            </div>
                            </TableCell>
                            <TableCell className="text-right">
                            {new Intl.NumberFormat('en-PK', {
                                style: 'currency',
                                currency: 'PKR'
                            }).format(expense.amount)}
                            </TableCell>
                             {userRole === 'ADMIN' && (
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDelete(expense.id)}
                                    >
                                        <span className="sr-only">Delete</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
                )}
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
