'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    fetchReport();
  }, [month]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Using the monthly report endpoint
      const response = await axios.get(`/api/reports?type=monthly&date=${month}-01`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if(!data && !loading) return <div>Failed to load report.</div>;

  const pieData = data ? [
    { name: 'Room Revenue', value: data.breakdown.room },
    { name: 'Food Revenue', value: data.breakdown.food },
    { name: 'Services', value: data.breakdown.service },
  ] : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <Input 
            type="month" 
            value={month} 
            onChange={(e) => setMonth(e.target.value)}
            className="w-[180px]"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data ? formatCurrency(data.totalRevenue) : '...'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">For {month}</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data ? formatCurrency(data.totalPaid) : '...'}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data ? formatCurrency(data.pending) : '...'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Sources</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] w-full flex justify-center">
              {loading ? <div className="self-center">Loading chart...</div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
             </div>
             <div className="flex justify-center gap-4 mt-4">
               {pieData.map((entry, index) => (
                 <div key={index} className="flex items-center text-sm">
                   <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[index] }} />
                   {entry.name}
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>

        {/* Placeholder for Expenses vs Profit if we had better sample data for expense history */}
         <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Total Bills Generated</p>
                  <p className="text-2xl font-bold">{data?.billCount || 0}</p>
               </div>
               <div className="text-sm text-gray-500 italic">
                  * Expense data is tracked in Overall reports logic.
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
