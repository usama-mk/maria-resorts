'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  Calendar,
  Phone,
  Truck
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function VendorDetailPage() {
  const { id } = useParams();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [txType, setTxType] = useState<'BILL_RECEIVED' | 'PAYMENT_MADE'>('BILL_RECEIVED');

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (id) fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/vendors?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVendor(response.data.data);
    } catch (error) {
       toast.error('Failed to fetch vendor details');
    } finally {
      setLoading(false);
    }
  };

  const onTransactionSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/vendors', {
        type: 'transaction',
        vendorId: id,
        transactionType: txType,
        amount: parseFloat(data.amount),
        description: data.description,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Transaction recorded successfully');
      setIsTxOpen(false);
      reset();
      fetchVendor();
    } catch (error: any) {
      toast.error('Failed to record transaction');
    }
  };

  if (loading) return <div className="p-8">Loading vendor details...</div>;
  if (!vendor) return <div className="p-8 text-center text-red-500">Vendor not found</div>;

  // Calculate Totals
  const totalBilled = vendor.transactions
    .filter((t: any) => t.type === 'BILL_RECEIVED')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalPaid = vendor.transactions
    .filter((t: any) => t.type === 'PAYMENT_MADE')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const balance = totalBilled - totalPaid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/vendors">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{vendor.name}</h1>
          <div className="flex items-center text-sm text-gray-500 gap-4">
            <span className="flex items-center"><Truck className="h-3 w-3 mr-1" /> {vendor.services}</span>
            <span className="flex items-center"><Phone className="h-3 w-3 mr-1" /> {vendor.phone}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-red-50 border-red-100">
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium text-red-600">Total Billed</CardTitle>
             <ArrowDownLeft className="h-4 w-4 text-red-600" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-red-700">{formatCurrency(totalBilled)}</div>
             <p className="text-xs text-red-500">Expenses Incurred</p>
           </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium text-green-600">Total Paid</CardTitle>
             <ArrowUpRight className="h-4 w-4 text-green-600" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-green-700">{formatCurrency(totalPaid)}</div>
             <p className="text-xs text-green-500">Payments Sent</p>
           </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium text-blue-600">Balance Due</CardTitle>
             <Wallet className="h-4 w-4 text-blue-600" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-blue-700">{formatCurrency(balance)}</div>
             <p className="text-xs text-blue-500">{balance > 0 ? 'To Pay' : 'Settled'}</p>
           </CardContent>
        </Card>
      </div>

      {/* Transactions Area */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ledger History</CardTitle>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => { setTxType('BILL_RECEIVED'); setIsTxOpen(true); }}
            >
              <Plus className="mr-2 h-4 w-4" /> Record Bill
            </Button>
            <Button 
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => { setTxType('PAYMENT_MADE'); setIsTxOpen(true); }}
            >
              <Plus className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendor.transactions.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center h-24 text-gray-400">No transactions recorded</TableCell></TableRow>
              ) : (
                vendor.transactions.map((tx: any) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">{formatDate(tx.transactionDate)}</TableCell>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        tx.type === 'BILL_RECEIVED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {tx.type === 'BILL_RECEIVED' ? 'BILL' : 'PAYMENT'}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${
                       tx.type === 'BILL_RECEIVED' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {tx.type === 'BILL_RECEIVED' ? '-' : '+'} {formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {txType === 'BILL_RECEIVED' ? 'Record New Bill From Vendor' : 'Record Payment To Vendor'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onTransactionSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input id="amount" type="number" step="0.01" {...register('amount', { required: true })} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Input 
                id="description" 
                {...register('description', { required: true })} 
                placeholder={txType === 'BILL_RECEIVED' ? "e.g. 50 Water Bottles" : "e.g. Cash Payment"}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
               <Button type="button" variant="outline" onClick={() => setIsTxOpen(false)}>
                 Cancel
               </Button>
               <Button type="submit" className={txType === 'BILL_RECEIVED' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}>
                 Confirm
               </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
