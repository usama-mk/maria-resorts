'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/ui/spinner';
import { Plus, Search, Pencil, Trash2, Mail, Phone, User, CreditCard } from 'lucide-react';
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

export default function GuestsPage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<any>(null);

  const { register, handleSubmit, reset, setValue, formState } = useForm();

  const fetchGuests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/guests?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGuests(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch guests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGuests();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingGuest) {
        await axios.put('/api/guests', { ...data, id: editingGuest.id }, { headers });
        toast.success('Guest updated successfully');
      } else {
        await axios.post('/api/guests', data, { headers });
        toast.success('Guest created successfully');
      }

      setIsDialogOpen(false);
      reset();
      setEditingGuest(null);
      fetchGuests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (guest: any) => {
    setEditingGuest(guest);
    setValue('name', guest.name);
    setValue('email', guest.email);
    setValue('phone', guest.phone);
    setValue('cnic', guest.cnic);
    setValue('passportNumber', guest.passportNumber);
    setValue('address', guest.address);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingGuest(null);
    reset();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Guest Management</h2>
        <Button onClick={openNewDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add New Guest
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guest Directory</CardTitle>
          <div className="flex items-center space-x-2 pt-4">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by name, CNIC, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>ID Document</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      <div className="flex justify-center items-center h-full">
                        <Spinner size="md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : guests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                      No guests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  guests.map((guest) => (
                    <TableRow key={guest.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {guest.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-2 text-gray-400" />
                            {guest.email || '-'}
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-2 text-gray-400" />
                            {guest.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CreditCard className="h-3 w-3 mr-2 text-gray-400" />
                          {guest.cnic || guest.passportNumber}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {guest.address || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(guest)}
                        >
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingGuest ? 'Edit Guest' : 'Add New Guest'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" {...register('name', { required: true })} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" {...register('phone', { required: true })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cnic">CNIC</Label>
                <Input id="cnic" placeholder="xxxxx-xxxxxxx-x" {...register('cnic')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="passportNumber">Passport Number</Label>
                <Input id="passportNumber" {...register('passportNumber')} />
              </div>
            </div>
            <p className="text-xs text-gray-500">Provide at least one ID document number.</p>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('address')}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" loading={formState.isSubmitting}>
                {editingGuest ? 'Update Guest' : 'Create Guest'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
