import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

//TODO: add authentication and authorization to ensure users can only access their own accounts
// get all existing accounts for user
export async function GET() {
    try{
        const categories = await prisma.category.findMany();
        return NextResponse.json({message: 'Categories retrieved successfully', data: categories}, {status: 200});
    } catch (error) {
        if(error instanceof Error) {
            return NextResponse.json({message: `Error retrieving categories, ${error.message}`}, {status: 500});
        }
    }

}

// create a new transaction
export async function POST(request: Request) {
  const data = await request.json();
  console.log("Received data for new transaction:", data);
  try{
    const category = await prisma.category.create({
        data: {
            name: data.name,
            type: data.type,
            createdAt: data.createdAt ?? new Date(),
            userId: data.userId
        }
    })
    return NextResponse.json({message: 'Category created successfully', data: category}, {status: 201});
    } catch (error) {
        if(error instanceof Error) {
            return NextResponse.json({message: `Error creating category, ${error.message}`}, {status: 500});
        }
    }
}

