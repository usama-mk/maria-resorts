'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Search, Calendar, User, BedDouble, XCircle, CheckCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
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
import { formatCurrency, formatDate } from '@/lib/utils'; // formatDate utility needed

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [guests, setGuests] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  
  const { register, handleSubmit, reset, watch, setValue, formState } = useForm();
  
  // Fetch reservations on mount
  useEffect(() => {
    fetchReservations();
    // Pre-fetch guests and rooms for the form
    fetchGuests();
    fetchRooms();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/reservations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReservations(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/guests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGuests(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };
  
  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/rooms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter for available rooms or show all? For reservation, show all but maybe indicate status
      setRooms(response.data.data);
    } catch (error) {
       console.error(error);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/reservations', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Reservation created successfully');
      setIsDialogOpen(false);
      reset();
      fetchReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create reservation');
    }
  };

  const cancelReservation = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/reservations', { id, status: 'CANCELLED' }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Reservation cancelled');
      fetchReservations();
    } catch (error: any) {
      toast.error('Failed to cancel reservation');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      RESERVED: 'bg-blue-100 text-blue-800',
      CHECKED_IN: 'bg-green-100 text-green-800',
      CHECKED_OUT: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reservations</h2>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> New Booking
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    <div className="flex justify-center items-center h-full">
                      <Spinner size="md" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : reservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-gray-500">No reservations found.</TableCell>
                </TableRow>
              ) : (
                reservations.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="font-medium">{res.guest?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center">
                        <BedDouble className="h-4 w-4 mr-2 text-gray-400" />
                        Room {res.room?.roomNumber}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(res.checkInDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(res.expectedCheckOut).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(res.status)}</TableCell>
                    <TableCell className="text-right">
                      {res.status === 'RESERVED' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => cancelReservation(res.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Reservation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="guestId">Select Guest *</Label>
              <select
                id="guestId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...register('guestId', { required: true })}
              >
                <option value="">Select a guest...</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} ({g.phone})</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Don't see the guest? Create them in Guest Management first.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="checkInDate">Check In Date *</Label>
                <Input type="date" id="checkInDate" {...register('checkInDate', { required: true })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expectedCheckOut">Check Out Date *</Label>
                <Input type="date" id="expectedCheckOut" {...register('expectedCheckOut', { required: true })} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="roomId">Select Room *</Label>
              <select
                id="roomId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...register('roomId', { required: true })}
              >
                <option value="">Select a room...</option>
                {rooms
                  .filter(r => r.status === 'AVAILABLE' || r.status === 'CLEANING') // Only show relevant rooms
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} - {r.category?.name} ({formatCurrency(r.category?.basePrice)})
                    </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" loading={formState.isSubmitting}>
                Confirm Booking
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
