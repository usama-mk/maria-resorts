'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Printer, ArrowLeft, Mail, Phone, MapPin, User, Calendar, Bed } from 'lucide-react';
import Link from 'next/link';

export default function BillDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/billing?id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.data && response.data.data.length > 0) {
          setBill(response.data.data[0]);
          // Auto-print if requested
          if (searchParams.get('print') === 'true') {
            setTimeout(() => {
              window.print();
            }, 500); // Small delay to ensure render
          }
        }
      } catch (error) {
        console.error('Failed to fetch bill', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBill();
  }, [id, searchParams]);

  if (loading) return <div className="p-8 text-center">Loading invoice details...</div>;
  if (!bill) return <div className="p-8 text-center text-red-500">Invoice not found</div>;

  const totalPaid = bill.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const balance = bill.total - totalPaid;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 print:py-0 print:px-0">
      {/* Action Bar */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/billing">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Billing
          </Button>
        </Link>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Print Invoice
        </Button>
      </div>

      {/* Invoice Card */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="pb-4 border-b">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-primary">MARIA RESORTS</h1>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="flex items-center gap-2"><MapPin className="h-3 w-3" /> 123 Scenic Drive, Murree</p>
                <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> +92 300 1234567</p>
                <p className="flex items-center gap-2"><Mail className="h-3 w-3" /> info@mariaresorts.com</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
              <p className="font-mono text-sm text-gray-500">#{bill.billNumber}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(bill.generatedAt)}</p>
              <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                bill.status === 'PAID' ? 'bg-green-100 text-green-800 border-green-200' : 
                bill.status === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                'bg-red-100 text-red-800 border-red-200'
              }`}>
                {bill.status.replace('_', ' ')}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-8">
          {/* Guest & Stay Details */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Bill To</h3>
              <div className="space-y-1">
                <p className="font-bold text-lg flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" /> {bill.guest.name}
                </p>
                <p className="text-sm text-gray-600">{bill.guest.phone}</p>
                <p className="text-sm text-gray-600">{bill.guest.email}</p>
                <p className="text-sm text-gray-600">CNIC: {bill.guest.cnic}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Stay Details</h3>
              {bill.checkIn ? (
                <div className="space-y-1">
                   <p className="font-medium flex items-center gap-2">
                     <Bed className="h-4 w-4 text-gray-400" /> Room {bill.checkIn.room.roomNumber} ({bill.checkIn.room.category.name})
                   </p>
                   <p className="text-sm text-gray-600 flex items-center gap-2">
                     <Calendar className="h-3 w-3" /> Check-in: {formatDateTime(bill.checkIn.checkInTime)}
                   </p>
                   <p className="text-sm text-gray-600 flex items-center gap-2 ml-5">
                     Check-out: {bill.checkIn.actualCheckOut ? formatDateTime(bill.checkIn.actualCheckOut) : 'Currently Staying'}
                   </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No check-in record linked</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Charges</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 w-1/2">Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bill.items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-3">
                      <p className="font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.type.toLowerCase()}</p>
                    </td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator />

          {/* Financials & Payments */}
          <div className="grid grid-cols-2 gap-8">
            {/* Payments */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment History</h3>
              {bill.payments.length > 0 ? (
                <div className="space-y-2">
                  {bill.payments.map((payment: any) => (
                    <div key={payment.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                      <div>
                        <span className="font-medium">{formatDate(payment.paymentDate)}</span>
                        <span className="text-gray-500 text-xs ml-2">({payment.paymentMethod})</span>
                      </div>
                      <span className="text-green-600 font-medium">-{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No payments recorded</p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(bill.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">{formatCurrency(bill.tax)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(bill.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 font-medium pt-2">
                <span>Amount Paid</span>
                <span>{formatCurrency(totalPaid)}</span>
              </div>
              <div className={`flex justify-between text-lg font-bold border-t pt-2 mt-2 ${balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                <span>Balance Due</span>
                <span>{formatCurrency(balance)}</span>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="pt-8 text-center text-xs text-gray-400">
            <p>Thank you for choosing Maria Resorts. We hope you had a pleasant stay.</p>
            <p>Computer generated invoice, requires no signature.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
