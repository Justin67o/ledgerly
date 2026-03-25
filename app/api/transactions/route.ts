import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

//TODO: add authentication and authorization to ensure users can only access their own accounts
// get all existing accounts for user
export async function GET() {
    try{
        const transactions = await prisma.transaction.findMany();
        return NextResponse.json({message: 'Transactions retrieved successfully', data: transactions}, {status: 200});
    } catch (error) {
        if(error instanceof Error) {
            return NextResponse.json({message: `Error retrieving transactions, ${error.message}`}, {status: 500});
        }
    }

}

// create a new transaction
export async function POST(request: Request) {
  const data = await request.json();
  console.log("Received data for new transaction:", data);
  try{
    const transaction = await prisma.transaction.create({
        data: {
            amount: data.amount,
            description: data.description,
            date: data.date ?? new Date(),
            createdAt: data.createdAt ?? new Date(),
            accountId: data.accountId,
            categoryId: data.categoryId
        }
    })
    return NextResponse.json({message: 'Transaction created successfully', data: transaction}, {status: 201});
    } catch (error) {
        if(error instanceof Error) {
            return NextResponse.json({message: `Error creating transaction, ${error.message}`}, {status: 500});
        }
    }
}

