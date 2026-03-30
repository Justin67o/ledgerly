import { getServerSession } from "next-auth";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuthentication } from "@/lib/requireAuthentication";

//TODO: add authentication and authorization to ensure users can only access their own accounts
// get all existing accounts for user
export async function GET() {
  
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });
    
    try{
      
        const userTransactions = await prisma.transaction.findMany({
            where: { account: { userId: user.id } },
            include: { account: true, category: true },
          });
        return NextResponse.json({message: 'Transactions retrieved successfully', data: userTransactions}, {status: 200});
    } catch (error) {
        if(error instanceof Error) {
          console.log("Error retrieving transactions:", error);
            return NextResponse.json({message: `Error retrieving transactions, ${error.message}`}, {status: 500});
        }
    }

}

// create a new transaction
export async function POST(request: Request) {
  const data = await request.json();
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const account = await prisma.account.findUnique({
    where: { id: data.accountId },
  });
  
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if(!category || category.userId !== user.id){
    return new Response("Invalid category", {status: 400})
  }
  if (!account || account.userId !== user.id) {
    return new Response("Invalid account", { status: 400 });
  }
  console.log("Received data for new transaction:", data);
  try{
    const transaction = await prisma.transaction.create({
        data: {
            amount: data.amount,
            description: data.description,
            date: data.date ?? new Date(),
            createdAt: data.createdAt ?? new Date(),
            accountId: account.id,
            categoryId: category.id
        }
    })
    return NextResponse.json({message: 'Transaction created successfully', data: transaction}, {status: 201});
    } catch (error) {
        if(error instanceof Error) {
            return NextResponse.json({message: `Error creating transaction, ${error.message}`}, {status: 500});
        }
    }
}

