'use client';

// Simplified version for MVP: Just managing menu items
// In full version, we would also clear tables or manage orders.

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/ui/spinner';
import { Plus, Utensils, Coffee, Edit, Trash, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [activeCheckIns, setActiveCheckIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedItemForOrder, setSelectedItemForOrder] = useState<any>(null);

  const { register: registerMenu, handleSubmit: handleSubmitMenu, reset: resetMenu, formState: { isSubmitting: isAddingMenu } } = useForm();
  const { register: registerOrder, handleSubmit: handleSubmitOrder, reset: resetOrder, formState: { isSubmitting: isAddingOrder } } = useForm();

  useEffect(() => {
    fetchMenu();
    fetchActiveCheckIns();
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

  const fetchActiveCheckIns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/checkins?active=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Ensure we only have checkins that haven't checked out yet
      const active = response.data.data.filter((c: any) => !c.actualCheckOut);
      setActiveCheckIns(active);
    } catch (error) {
      console.error('Failed to fetch checkins', error);
    }
  };

  const onMenuSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/food', {
        type: 'item',
        name: data.name,
        price: parseFloat(data.price),
        categoryId: data.categoryId
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Menu item added');
      setIsMenuDialogOpen(false);
      resetMenu();
      fetchMenu();
    } catch (error: any) {
      toast.error('Failed to add item');
    }
  };

  const onOrderSubmit = async (data: any) => {
    if (!selectedItemForOrder) return;
    
    try {
      const token = localStorage.getItem('token');
      // Find the checkin to get billId
      const checkin = activeCheckIns.find(c => c.id === data.checkInId);
      if (!checkin || !checkin.bills || checkin.bills.length === 0) {
        toast.error('Could not find active bill for this check-in');
        return;
      }
      
      const billId = checkin.bills[0].id; // Assumption: active stay has 1 active bill
      
      await axios.put('/api/billing', {
        billId,
        type: 'FOOD',
        description: selectedItemForOrder.name,
        quantity: parseInt(data.quantity),
        unitPrice: selectedItemForOrder.price,
        foodId: selectedItemForOrder.id,
        qtNumber: data.qtNumber || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Food added to guest bill');
      setIsOrderDialogOpen(false);
      resetOrder();
    } catch (error: any) {
       toast.error('Failed to add order to bill');
    }
  };

  const handleOpenOrderDialog = (item: any) => {
    setSelectedItemForOrder(item);
    setIsOrderDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Restaurant & Food</h2>
        <Button onClick={() => setIsMenuDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" /> Add Menu Item
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <Spinner size="lg" className="border-t-orange-600" />
        </div>
      ) : (
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
                      <div>
                        <span className="block font-medium">{item.name}</span>
                        <span className="block text-gray-500 text-xs">{formatCurrency(item.price)}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleOpenOrderDialog(item)} className="h-7 text-xs">
                        <ShoppingCart className="h-3 w-3 mr-1" /> Order
                      </Button>
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
      )}

       {/* Menu Dialog */}
       <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitMenu(onMenuSubmit)} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input id="name" {...registerMenu('name', { required: true })} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="categoryId">Category *</Label>
              <select
                id="categoryId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...registerMenu('categoryId', { required: true })}
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
                {...registerMenu('price', { required: true })} 
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsMenuDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700" loading={isAddingMenu}>
                Save Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order to Room</DialogTitle>
          </DialogHeader>
          {selectedItemForOrder && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md border">
              <p className="font-medium">{selectedItemForOrder.name}</p>
              <p className="text-sm text-gray-500">{formatCurrency(selectedItemForOrder.price)} each</p>
            </div>
          )}
          <form onSubmit={handleSubmitOrder(onOrderSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="checkInId">Select Room / Guest *</Label>
              <select
                id="checkInId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...registerOrder('checkInId', { required: true })}
              >
                <option value="">-- Select Active Stay --</option>
                {activeCheckIns.map((c) => (
                  <option key={c.id} value={c.id}>
                    Room {c.room?.roomNumber} - {c.guest?.name}
                  </option>
                ))}
              </select>
              {activeCheckIns.length === 0 && (
                <p className="text-xs text-red-500">No active guests found. Check someone in first.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  min="1"
                  defaultValue="1"
                  {...registerOrder('quantity', { required: true })} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="qtNumber">QT / KOT Number</Label>
                <Input 
                   id="qtNumber" 
                   placeholder="e.g. QT-1004"
                   {...registerOrder('qtNumber')} 
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={activeCheckIns.length === 0} loading={isAddingOrder}>
                Add to Bill
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
