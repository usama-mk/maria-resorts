import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';

// GET room availability dashboard
export async function GET(request: NextRequest) {
    try {
        // Get all rooms grouped by status
        const rooms = await prisma.room.findMany({
            include: {
                category: true,
            },
            orderBy: { roomNumber: 'asc' },
        });

        // Group by status
        const availabilityData = {
            AVAILABLE: rooms.filter(r => r.status === 'AVAILABLE'),
            OCCUPIED: rooms.filter(r => r.status === 'OCCUPIED'),
            BOOKED: rooms.filter(r => r.status === 'BOOKED'),
            CLEANING: rooms.filter(r => r.status === 'CLEANING'),
            MAINTENANCE: rooms.filter(r => r.status === 'MAINTENANCE'),
        };

        // Statistics
        const stats = {
            total: rooms.length,
            available: availabilityData.AVAILABLE.length,
            occupied: availabilityData.OCCUPIED.length,
            booked: availabilityData.BOOKED.length,
            cleaning: availabilityData.CLEANING.length,
            maintenance: availabilityData.MAINTENANCE.length,
            occupancyRate: rooms.length > 0
                ? Math.round((availabilityData.OCCUPIED.length / rooms.length) * 100)
                : 0,
        };

        return successResponse({ rooms: availabilityData, stats });
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to fetch availability', 500);
    }
}
