'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', data);
      
      if (response.data.success) {
        // Store token in localStorage (or cookies)
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        toast.success('Welcome back!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Maria Resorts</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email to sign in to your account
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register('email')}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                {...register('password')}
                disabled={loading}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          
          <div className="text-center text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs">
              <p>Admin: <span className="font-mono">admin@mariaresorts.com</span> / <span className="font-mono">admin123</span></p>
              <p>Front Desk: <span className="font-mono">frontdesk@mariaresorts.com</span> / <span className="font-mono">frontdesk123</span></p>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden bg-gray-100 lg:block relative">
        <div className="absolute inset-0 bg-blue-900/10 z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop"
          alt="Luxury Hotel"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
        <div className="absolute bottom-10 left-10 z-20 text-white max-w-md">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium drop-shadow-md">
              &ldquo;The ultimate tool for seamless resort operations. Manage guests, rooms, and billing with elegance and ease.&rdquo;
            </p>
            <footer className="text-sm opacity-80 drop-shadow-md">Maria Resorts Management System</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
