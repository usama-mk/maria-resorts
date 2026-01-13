'use client';

// Simplified version for MVP: Just managing menu items
// In full version, we would also clear tables or manage orders.

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Utensils, Coffee, Edit, Trash } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export default function FoodPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/food', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data.data.items);
      setCategories(response.data.data.categories);
    } catch (error) {
       toast.error('Failed to fetch menu');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      // Adding new menu item
      await axios.post('/api/food', {
        type: 'item',
        name: data.name,
        price: parseFloat(data.price),
        categoryId: data.categoryId
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Menu item added');
      setIsDialogOpen(false);
      reset();
      fetchMenu();
    } catch (error: any) {
      toast.error('Failed to add item');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Restaurant & Food</h2>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" /> Add Menu Item
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardHeader className="bg-gray-50 pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Utensils className="h-4 w-4 mr-2 text-orange-600" />
                {cat.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {items
                  .filter(item => item.categoryId === cat.id)
                  .map(item => (
                    <li key={item.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                      <span>{item.name}</span>
                      <span className="font-semibold text-gray-700">{formatCurrency(item.price)}</span>
                    </li>
                  ))}
                  {items.filter(item => item.categoryId === cat.id).length === 0 && (
                    <li className="text-sm text-gray-500 italic">No items in this category</li>
                  )}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input id="name" {...register('name', { required: true })} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="categoryId">Category *</Label>
              <select
                id="categoryId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...register('categoryId', { required: true })}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Price *</Label>
               <Input 
                id="price" 
                type="number" 
                {...register('price', { required: true })} 
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                Save Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
