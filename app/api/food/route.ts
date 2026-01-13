import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';

// GET all food menu items
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');

        let where: any = {};
        if (categoryId) where.categoryId = categoryId;

        const items = await prisma.foodMenuItem.findMany({
            where,
            include: {
                category: true,
            },
            orderBy: { name: 'asc' },
        });

        const categories = await prisma.foodCategory.findMany({
            orderBy: { name: 'asc' },
        });

        return successResponse({ items, categories });
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to fetch food menu', 500);
    }
}

// POST create food item or category
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, name, categoryId, price } = body;

        if (type === 'category') {
            const category = await prisma.foodCategory.create({
                data: { name },
            });
            return successResponse(category, 'Category created successfully');
        }

        if (type === 'item') {
            if (!name || !categoryId || !price) {
                return errorResponse('Name, category, and price are required');
            }

            const item = await prisma.foodMenuItem.create({
                data: {
                    name,
                    categoryId,
                    price,
                },
                include: {
                    category: true,
                },
            });

            return successResponse(item, 'Food item created successfully');
        }

        return errorResponse('Invalid type');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to create', 500);
    }
}

// PUT update food item
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, price, available } = body;

        if (!id) {
            return errorResponse('Item ID is required');
        }

        const item = await prisma.foodMenuItem.update({
            where: { id },
            data: { name, price, available },
            include: {
                category: true,
            },
        });

        return successResponse(item, 'Food item updated successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to update food item', 500);
    }
}
