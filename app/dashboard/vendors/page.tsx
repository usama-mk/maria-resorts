'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/ui/spinner';
import { Plus, Search, Pencil, Trash2, Truck, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
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

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { register, handleSubmit, reset, formState } = useForm();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/vendors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVendors(response.data.data);
    } catch (error) {
       toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/vendors', { ...data, type: 'vendor' }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Vendor added successfully');
      setIsDialogOpen(false);
      reset();
      fetchVendors();
    } catch (error: any) {
      toast.error('Failed to add vendor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Vendor Management</h2>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Vendor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
             <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Services/Goods</TableHead>
                <TableHead>Transactions</TableHead>
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
              ) : vendors.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24 text-gray-500">No vendors found.</TableCell></TableRow>
              ) : (
                vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium text-lg flex items-center">
                       <Truck className="h-4 w-4 mr-2 text-gray-400" />
                       {vendor.name}
                    </TableCell>
                    <TableCell>{vendor.contactPerson}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center"><Phone className="h-3 w-3 mr-1"/> {vendor.phone}</div>
                        <div className="flex items-center text-gray-500"><Mail className="h-3 w-3 mr-1"/> {vendor.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{vendor.services}</TableCell>
                    <TableCell>{vendor._count?.transactions || 0} Records</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/vendors/${vendor.id}`}>
                        <Button variant="outline" size="sm">View Ledger</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
             <div className="grid gap-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input id="name" {...register('name', { required: true })} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input id="contactPerson" {...register('contactPerson', { required: true })} />
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

            <div className="grid gap-2">
              <Label htmlFor="services">Services/Goods Provided</Label>
              <Input id="services" {...register('services')} placeholder="e.g. Vegetables, Laundry Chemicals..." />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address')} />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" loading={formState.isSubmitting}>
                Create Vendor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
