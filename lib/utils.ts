import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays, differenceInHours } from 'date-fns';

// Tailwind CSS class merger
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
    }).format(amount);
}

// Format date
export function formatDate(date: Date | string): string {
    return format(new Date(date), 'MMM dd, yyyy');
}

// Format datetime
export function formatDateTime(date: Date | string): string {
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

// Calculate number of nights between two dates
export function calculateNights(checkIn: Date, checkOut: Date): number {
    const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
    return nights > 0 ? nights : 1;
}

// Calculate room charges
export function calculateRoomCharges(
    checkIn: Date,
    checkOut: Date,
    pricePerNight: number
): number {
    const nights = calculateNights(checkIn, checkOut);
    return nights * pricePerNight;
}

// Calculate late checkout charges
export function calculateLateCharges(
    expectedCheckOut: Date,
    actualCheckOut: Date,
    pricePerNight: number
): number {
    const hoursLate = differenceInHours(new Date(actualCheckOut), new Date(expectedCheckOut));

    if (hoursLate <= 2) return 0; // Grace period of 2 hours
    if (hoursLate <= 6) return pricePerNight * 0.25; // 25% for up to 6 hours
    return pricePerNight * 0.5; // 50% for more than 6 hours
}

// Generate unique bill number
export function generateBillNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${random}`;
}

// Calculate tax (adjustable percentage)
export function calculateTax(subtotal: number, taxRate: number = 0.05): number {
    return subtotal * taxRate;
}

// Response helpers
export function successResponse(data: any, message?: string) {
    return Response.json({
        success: true,
        message,
        data,
    });
}

export function errorResponse(message: string, status: number = 400) {
    return Response.json(
        {
            success: false,
            message,
        },
        { status }
    );
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
    return errorResponse(message, 401);
}

export function forbiddenResponse(message: string = 'Forbidden') {
    return errorResponse(message, 403);
}
