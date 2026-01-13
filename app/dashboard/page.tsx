'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BedDouble, CreditCard, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [occupancy, setOccupancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* Real data for the chart */
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Use local date string to ensure we fetch today's data relative to user's timezone
        const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        
        const [occupancyRes, dailyRes, weeklyRes] = await Promise.all([
          axios.get('/api/reports?type=occupancy', config),
          axios.get(`/api/reports?type=daily&date=${todayStr}`, config),
          axios.get('/api/reports?type=weekly', config)
        ]);

        setStats(dailyRes.data.data);
        setOccupancy(occupancyRes.data.data);
        setWeeklyData(weeklyRes.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        // toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  const statCards = [
    {
      title: "Today's Revenue",
      value: stats ? formatCurrency(stats.totalRevenue) : 'PKR 0',
      description: `Collected: ${stats ? formatCurrency(stats.totalPaid) : 'PKR 0'}`,
      icon: CreditCard,
      color: "text-green-600"
    },
    {
      title: "Occupancy Rate",
      value: occupancy ? `${occupancy.occupancyRate}%` : '0%',
      description: `${occupancy?.occupiedRooms || 0} occupied / ${occupancy?.totalRooms || 0} total`,
      icon: BedDouble,
      color: "text-blue-600"
    },
    {
      title: "Check-ins Today",
      value: occupancy ? occupancy.checkInsToday : '0',
      description: "Total arrivals for today",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Check-outs Today",
      value: occupancy ? occupancy.checkOutsToday : '0',
      description: "Total departures for today",
      icon: Activity,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Weekly Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs${value}`} />
                  <Tooltip formatter={(value) => [`Rs ${value}`, 'Revenue']} />
                   <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Room Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                <div className="flex-1 text-sm font-medium">Available</div>
                <div className="text-sm text-gray-500">{occupancy?.availableRooms || 0}</div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                <div className="flex-1 text-sm font-medium">Occupied</div>
                <div className="text-sm text-gray-500">{occupancy?.occupiedRooms || 0}</div>
              </div>
              {/* Add more statuses as we expand the API */}
            </div>
            
            <div className="mt-8 pt-6 border-t">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{occupancy?.totalRooms || 0}</div>
                <p className="text-sm text-gray-500">Total Rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
