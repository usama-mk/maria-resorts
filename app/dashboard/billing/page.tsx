'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Receipt, 
  CreditCard, 
  Download, 
  Search, 
  Euro, 
  Banknote 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function BillingPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchBills();
  }, [search]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Adding search param if implemented in backend, otherwise client filter
      // The backend actually implements generic search? Checked route.ts, filtering logic is minimal there, mostly by status.
      // Let's rely on basic fetch and client search for now or backend if exists.
      // Backend: GET /api/billing returns all
      const response = await axios.get('/api/billing', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allBills = response.data.data;
      if (search) {
        setBills(allBills.filter((b: any) => 
          b.billNumber.toLowerCase().includes(search.toLowerCase()) || 
          b.guest?.name.toLowerCase().includes(search.toLowerCase())
        ));
      } else {
        setBills(allBills);
      }
    } catch (error) {
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const onPaymentSubmit = async (data: any) => {
    if (!selectedBill) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/payments', {
        billId: selectedBill.id,
        amount: parseFloat(data.amount),
        method: data.method,
        notes: data.notes
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Payment recorded successfully');
      setIsPaymentOpen(false);
      reset();
      fetchBills();
    } catch (error: any) {
      toast.error('Payment failed');
    }
  };

  const generatePDF = (bill: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text('MARIA RESORTS', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('Official Invoice', 105, 30, { align: 'center' });
    
    // Bill Details
    doc.setFontSize(10);
    doc.text(`Bill #: ${bill.billNumber}`, 15, 45);
    doc.text(`Date: ${new Date(bill.generatedAt).toLocaleDateString()}`, 15, 50);
    doc.text(`Guest: ${bill.guest?.name}`, 15, 55);
    
    // Status
    doc.text(`Status: ${bill.status}`, 150, 45);
    
    // Items Table
    const tableData = bill.items.map((item: any) => [
      item.description,
      item.itemType, // Assuming backend provides 'itemType' or similar distinguish
      item.quantity,
      `Rs ${item.unitPrice}`,
      `Rs ${item.total}`
    ]);
    
    autoTable(doc, {
      startY: 65,
      head: [['Description', 'Type', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
    });
    
    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.text(`Subtotal: Rs ${bill.total - bill.taxAmount}`, 140, finalY);
    doc.text(`Tax (5%): Rs ${bill.taxAmount}`, 140, finalY + 5);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: Rs ${bill.total}`, 140, finalY + 12);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const totalPaid = bill.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    doc.text(`Paid: Rs ${totalPaid}`, 140, finalY + 20);
    doc.text(`Balance: Rs ${bill.total - totalPaid}`, 140, finalY + 25);
    
    doc.save(`Invoice-${bill.billNumber}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PAID: 'bg-green-100 text-green-800',
      PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
      UNPAID: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Billing & Payments</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoices</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search bills..."
                className="pl-9 w-[250px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24">Loading bills...</TableCell></TableRow>
              ) : bills.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24 text-gray-500">No bills found.</TableCell></TableRow>
              ) : (
                bills.map((bill) => {
                  const totalPaid = bill.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
                  return (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono">{bill.billNumber}</TableCell>
                      <TableCell>{bill.guest?.name}</TableCell>
                      <TableCell>{new Date(bill.generatedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(bill.total)}</TableCell>
                      <TableCell>{formatCurrency(totalPaid)}</TableCell>
                      <TableCell>{getStatusBadge(bill.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {bill.status !== 'PAID' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => { setSelectedBill(bill); setIsPaymentOpen(true); }}
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Pay
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => generatePDF(bill)}
                        >
                          <Download className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Link href={`/dashboard/billing/${bill.id}`} target="_blank">
                          <Button variant="ghost" size="sm">
                             <Receipt className="h-4 w-4 text-gray-600" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Bill Total</p>
            <p className="text-xl font-bold">{selectedBill ? formatCurrency(selectedBill.total) : ''}</p>
            <p className="text-xs text-gray-500 mt-1">
               Remaining: {selectedBill ? formatCurrency(selectedBill.total - selectedBill.payments.reduce((sum:any, p:any) => sum + p.amount, 0)) : ''}
            </p>
          </div>
          
          <form onSubmit={handleSubmit(onPaymentSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Payment Amount *</Label>
              <Input 
                id="amount" 
                type="number" 
                step="0.01"
                {...register('amount', { required: true })} 
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="method">Payment Method *</Label>
              <select
                id="method"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...register('method', { required: true })}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Credit/Debit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" {...register('notes')} placeholder="Transaction Ref etc." />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Confirm Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
