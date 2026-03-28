'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Printer, ArrowLeft, Mail, Phone, MapPin, User, Bed, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function RestaurantBillPage() {
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
            }, 500);
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

  if (loading) return <div className="p-8 text-center">Loading restaurant invoice...</div>;
  if (!bill) return <div className="p-8 text-center text-red-500">Invoice not found</div>;

  // Filter only FOOD items
  const foodItems = bill.items.filter((item: any) => item.type === 'FOOD');
  const restaurantTotal = foodItems.reduce((sum: number, item: any) => sum + item.total, 0);

  // Group by QT Number
  const groupedFoodItems = Object.entries(
    foodItems.reduce((acc: any, item: any) => {
      const qt = item.qtNumber || 'No QT';
      if (!acc[qt]) {
        acc[qt] = { total: 0, items: [] };
      }
      acc[qt].total += item.total;
      acc[qt].items.push(item);
      return acc;
    }, {})
  );

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
          <Printer className="h-4 w-4" /> Print Res. Bill
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
              <h2 className="text-3xl font-bold text-gray-900">RESTAURANT BILL</h2>
              <p className="font-mono text-sm text-gray-500">Ref: #{bill.billNumber}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(bill.generatedAt)}</p>
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
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Delivery / Room</h3>
              {bill.checkIn ? (
                <div className="space-y-1">
                   <p className="font-medium flex items-center gap-2">
                     <Bed className="h-4 w-4 text-gray-400" /> Room {bill.checkIn.room.roomNumber} ({bill.checkIn.room.category.name})
                   </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No room linked (Walk-in)</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Orders</h3>
            {groupedFoodItems.length > 0 ? (
              <div className="space-y-6">
                {groupedFoodItems.map(([qt, data]: [string, any]) => (
                  <div key={qt} className="border rounded-md overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                      <span className="font-semibold text-gray-700">QT / KOT: {qt}</span>
                      <span className="font-semibold text-gray-900">Total: {formatCurrency(data.total)}</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500 bg-white">
                          <th className="py-2 px-4 w-1/2">Item</th>
                          <th className="py-2 px-4 text-center">Qty</th>
                          <th className="py-2 px-4 text-right">Price</th>
                          <th className="py-2 px-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {data.items.map((item: any) => (
                          <tr key={item.id}>
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-900">{item.description}</p>
                            </td>
                            <td className="py-3 px-4 text-center">{item.quantity}</td>
                            <td className="py-3 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
                <p className="text-center text-gray-500 py-4 italic">No food items ordered on this bill.</p>
            )}
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex justify-end pt-2">
            <div className="w-1/2 space-y-2">
              <div className="flex justify-between text-xl font-bold border-t pt-4">
                <span>Restaurant Total</span>
                <span>{formatCurrency(restaurantTotal)}</span>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="pt-8 text-center text-xs text-gray-400">
            <p className="mb-1">This is a supplementary restaurant slip for your reference.</p>
            <p>Please refer to the main folio for final settlement.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
