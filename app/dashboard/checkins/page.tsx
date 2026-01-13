'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { LogIn, LogOut, Search, Clock, Key } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export default function CheckInsPage() {
  const [activeStays, setActiveStays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  
  // Data for lists
  const [guests, setGuests] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);

  const { register: registerCheckIn, handleSubmit: handleSubmitCheckIn, reset: resetCheckIn } = useForm();

  useEffect(() => {
    fetchActiveStays();
    fetchGuests();
    fetchRooms();
    fetchReservations();
  }, []);

  const fetchActiveStays = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // We can filter checkins API or just list the active ones.
      // Let's assume the GET /api/checkins returns all history, we filter client side or API side.
      // Actually checking the API implementation: GET /api/checkins returns all.
      const response = await axios.get('/api/checkins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter for those with NO actualCheckOut
      const active = response.data.data.filter((c: any) => !c.actualCheckOut);
      setActiveStays(active);
    } catch (error) {
      toast.error('Failed to fetch check-ins');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuests = async () => { /* ... reuse ... */ 
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/guests', { headers: { Authorization: `Bearer ${token}` } });
      setGuests(res.data.data);
  };
  
  const fetchRooms = async () => { /* ... reuse ... */
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/rooms', { headers: { Authorization: `Bearer ${token}` } });
      setRooms(res.data.data);
  };

  const fetchReservations = async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/reservations', { headers: { Authorization: `Bearer ${token}` } });
      setReservations(res.data.data.filter((r: any) => r.status === 'RESERVED'));
  };

  const onCheckInSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/checkins', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Guest checked in successfully');
      setIsCheckInOpen(false);
      resetCheckIn();
      fetchActiveStays();
      fetchRooms(); // Update room status
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async (checkInId: string) => {
    if (!confirm('Are you sure you want to check out this guest? This will generate their bill.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/checkins', { id: checkInId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Guest checked out & Bill generated');
      fetchActiveStays();
    } catch (error: any) {
      toast.error('Check-out failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Front Desk Operations</h2>
        <Button onClick={() => setIsCheckInOpen(true)} className="bg-green-600 hover:bg-green-700">
          <LogIn className="mr-2 h-4 w-4" /> Guest Check-In
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Current Guests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{activeStays.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Arrivals Today</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mock or calculate */}
            <div className="text-2xl font-bold text-purple-900">{reservations.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currently Checked-In</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Check In Time</TableHead>
                <TableHead>Expected Check Out</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24">Loading active stays...</TableCell></TableRow>
              ) : activeStays.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24 text-gray-500">No active check-ins.</TableCell></TableRow>
              ) : (
                activeStays.map((stay) => (
                  <TableRow key={stay.id}>
                    <TableCell className="font-medium">{stay.guest?.name}</TableCell>
                    <TableCell>Room {stay.room?.roomNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(stay.checkInTime).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(stay.expectedCheckOut).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:bg-red-50 border border-red-200"
                        onClick={() => handleCheckOut(stay.id)}
                      >
                        <LogOut className="mr-2 h-3 w-3" />
                        Check Out
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Guest Check-In</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCheckIn(onCheckInSubmit)} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="reservationId">Linked Reservation (Optional)</Label>
              <select
                id="reservationId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...registerCheckIn('reservationId')}
              >
                <option value="">Walk-in (No Reservation)</option>
                {reservations.map((r) => (
                   <option key={r.id} value={r.id}>
                     Rez #{r.id.slice(0,4)} - {r.guest?.name} (Room {r.room?.roomNumber})
                   </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 p-3 rounded-md border text-sm text-gray-500 mb-2">
              <p>For walk-ins, please select Guest and Room below.</p>
            </div>

             <div className="grid gap-2">
              <Label htmlFor="guestId">Guest *</Label>
              <select
                id="guestId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...registerCheckIn('guestId')} // Optional if reservation selected, but let's just make it required or handle logic? API handles it.
              >
                <option value="">Select Guest (if walk-in)</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="roomId">Room *</Label>
              <select
                id="roomId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...registerCheckIn('roomId')}
              >
                <option value="">Select Room (if walk-in)</option>
                {rooms.filter(r => r.status === 'AVAILABLE').map((r) => (
                  <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.category?.name})</option>
                ))}
              </select>
            </div>
            
             <div className="grid gap-2">
                <Label htmlFor="expectedCheckOut">Expected Check Out *</Label>
                <Input type="date" id="expectedCheckOut" {...registerCheckIn('expectedCheckOut')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="customPrice">Custom Room Price (Optional)</Label>
                    <Input 
                      type="number" 
                      id="customPrice" 
                      placeholder="Leave empty for default"
                      {...registerCheckIn('customPrice')} 
                    />
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="advancePayment">Advance Payment (Optional)</Label>
                    <Input 
                      type="number" 
                      id="advancePayment" 
                      placeholder="0.00"
                      {...registerCheckIn('advancePayment')} 
                    />
                 </div>
              </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCheckInOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Complete Check-In
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
