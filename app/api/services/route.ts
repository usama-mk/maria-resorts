import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';

// GET all extra services
export async function GET(request: NextRequest) {
    try {
        const services = await prisma.extraService.findMany({
            orderBy: { name: 'asc' },
        });

        return successResponse(services);
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to fetch services', 500);
    }
}

// POST create extra service
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, price } = body;

        if (!name || !price) {
            return errorResponse('Name and price are required');
        }

        const service = await prisma.extraService.create({
            data: {
                name,
                description,
                price,
            },
        });

        return successResponse(service, 'Service created successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to create service', 500);
    }
}

// PUT update extra service
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, description, price, available } = body;

        if (!id) {
            return errorResponse('Service ID is required');
        }

        const service = await prisma.extraService.update({
            where: { id },
            data: { name, description, price, available },
        });

        return successResponse(service, 'Service updated successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to update service', 500);
    }
}
