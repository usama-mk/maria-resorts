'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Filter, Utensils } from 'lucide-react';
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
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeCheckIns, setActiveCheckIns] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Room Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  
  // Service Dialog State
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [selectedRoomService, setSelectedRoomService] = useState<any>(null); // { room, checkIn }

  const { register, handleSubmit, reset, setValue, formState } = useForm();
  
  // Separate form for service to avoid conflicts
  const { 
    register: registerService, 
    handleSubmit: handleSubmitService, 
    reset: resetService,
    watch: watchService,
    formState: serviceFormState
  } = useForm();

  const serviceType = watchService('type', 'FOOD');

  // Load data on mount
  useEffect(() => {
    fetchRooms();
    fetchCheckIns();
    fetchMenu();
  }, [statusFilter]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = statusFilter 
        ? `/api/rooms?status=${statusFilter}` 
        : '/api/rooms';
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckIns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/checkins?active=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActiveCheckIns(response.data.data);
    } catch (error) {
      console.error('Failed to fetch check-ins');
    }
  };

  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/food', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.data && response.data.data.items) {
        setMenuItems(response.data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch menu');
    }
  };

  const onSubmit = async (data: any) => {
    // ... existing room submit logic ...
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingRoom) {
        await axios.put('/api/rooms', { ...data, id: editingRoom.id }, { headers });
        toast.success('Room updated successfully');
      } else {
        await axios.post('/api/rooms', data, { headers });
        toast.success('Room created successfully');
      }

      setIsDialogOpen(false);
      reset();
      setEditingRoom(null);
      fetchRooms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const onServiceSubmit = async (data: any) => {
    if (!selectedRoomService?.checkIn?.bills?.[0]) {
      toast.error('No active bill found for this room');
      return;
    }

    const billId = selectedRoomService.checkIn.bills[0].id;
    
    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        billId,
        quantity: parseInt(data.quantity),
      };

      if (data.type === 'FOOD') {
        const foodItem = menuItems.find(i => i.id === data.foodId);
        if (!foodItem) return;
        payload.type = 'FOOD';
        payload.description = foodItem.name;
        payload.unitPrice = foodItem.price;
        payload.foodId = foodItem.id;
      } else {
        payload.type = 'SERVICE';
        payload.description = data.description;
        payload.unitPrice = parseFloat(data.price);
      }

      await axios.put('/api/billing', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Charge added to room bill');
      setIsServiceDialogOpen(false);
      resetService();
    } catch (error: any) {
      toast.error('Failed to add charge');
    }
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    setValue('roomNumber', room.roomNumber);
    setValue('floor', room.floor);
    setValue('categoryId', room.categoryId);
    setValue('status', room.status);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingRoom(null);
    reset();
    setIsDialogOpen(true);
  };

  const handleAddService = (room: any) => {
    const checkIn = activeCheckIns.find(c => c.roomId === room.id);
    if (!checkIn) {
      toast.error('Could not find active check-in for this room');
      return;
    }
    setSelectedRoomService({ room, checkIn });
    setIsServiceDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      AVAILABLE: 'bg-green-100 text-green-800',
      OCCUPIED: 'bg-red-100 text-red-800',
      BOOKED: 'bg-blue-100 text-blue-800',
      CLEANING: 'bg-yellow-100 text-yellow-800',
      MAINTENANCE: 'bg-gray-100 text-gray-800',
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
        <h2 className="text-3xl font-bold tracking-tight">Room Management</h2>
        <Button onClick={openNewDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Room
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Room Inventory</CardTitle>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="BOOKED">Booked</option>
                <option value="CLEANING">Cleaning</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Number</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Price / Night</TableHead>
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
              ) : rooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-gray-500">No rooms found.</TableCell>
                </TableRow>
              ) : (
                rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium text-lg">{room.roomNumber}</TableCell>
                    <TableCell>{room.category?.name || 'Standard'}</TableCell>
                    <TableCell>{room.floor}</TableCell>
                    <TableCell>{formatCurrency(room.category?.basePrice || 0)}</TableCell>
                    <TableCell>{getStatusBadge(room.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {room.status === 'OCCUPIED' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          onClick={() => handleAddService(room)}
                          title="Add Room Charge/Service"
                        >
                          <Utensils className="h-4 w-4 mr-1" /> Add Charge
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(room)}>
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Room Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="roomNumber">Room Number *</Label>
                <Input id="roomNumber" {...register('roomNumber', { required: true })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="floor">Floor *</Label>
                <Input id="floor" type="number" {...register('floor', { required: true, valueAsNumber: true })} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="categoryId">Room Category *</Label>
              <select
                id="categoryId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('categoryId', { required: true })}
              >
                <option value="">Select Category</option>
                {rooms.reduce((acc: any[], room) => {
                    if (!acc.find(c => c.id === room.categoryId)) {
                        acc.push(room.category);
                    }
                    return acc;
                }, []).map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                        {cat.name} ({formatCurrency(cat.basePrice)})
                    </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('status')}
                defaultValue="AVAILABLE"
              >
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied (Checked In)</option>
                <option value="BOOKED">Booked (Reserved)</option>
                <option value="CLEANING">Cleaning</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" loading={formState.isSubmitting}>
                {editingRoom ? 'Update Room' : 'Create Room'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Charge to Room {selectedRoomService?.room?.roomNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitService(onServiceSubmit)} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Charge Type</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...registerService('type')}
                defaultValue="FOOD"
              >
                <option value="FOOD">Food / Menu Item</option>
                <option value="SERVICE">Custom Service / Other</option>
              </select>
            </div>

            {serviceType === 'FOOD' ? (
              <div className="grid gap-2">
                <Label htmlFor="foodId">Select Item</Label>
                <select
                  id="foodId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...registerService('foodId')}
                >
                  <option value="">Select food item...</option>
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {formatCurrency(item.price)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" placeholder="e.g. Laundry, Extra Bed" {...registerService('description')} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" type="number" step="0.01" {...registerService('price')} />
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" defaultValue={1} {...registerService('quantity', { required: true, min: 1 })} />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" loading={serviceFormState.isSubmitting}>
                Add to Bill
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
