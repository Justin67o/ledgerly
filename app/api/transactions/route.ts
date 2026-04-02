import { getServerSession } from "next-auth";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuthentication } from "@/lib/requireAuthentication";
import { Prisma } from "@/generated/prisma/client";
import { request } from "https";
import { createNetWorthSnapshot } from '@/lib/networthSnapshot';

//TODO: add authentication and authorization to ensure users can only access their own accounts
// get all existing accounts for user
export async function GET(request: Request) {

  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const accountId = url.searchParams.get("accountId"); // optional filter to get transactions for a specific account

  try {

    const userTransactions = await prisma.transaction.findMany({
      where: {
        accountId: accountId || undefined, // if accountId is provided, filter by it; otherwise, get all transactions for the user
        account: { userId: user.id }
      },
      include: { account: true, category: true },
    });
    return NextResponse.json({ message: 'Transactions retrieved successfully', data: userTransactions }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.log("Error retrieving transactions:", error);
      return NextResponse.json({ message: `Error retrieving transactions, ${error.message}` }, { status: 500 });
    }
  }

}

// create a new transaction
export async function POST(request: Request) {
  const data = await request.json();
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Find the actual accounts and categories from the data by their ID
  const account = await prisma.account.findUnique({
    where: { id: data.accountId },
  });

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!account || account.userId !== user.id) {
    return new Response("Invalid account", { status: 400 });
  }




  try {
    // Normalize sign based on category type: EXPENSE → always negative, INCOME → always positive
    const rawAmount = Math.abs(parseFloat(data.amount));
    const normalizedAmount = category ? category.type === "INCOME" ? rawAmount : -rawAmount : rawAmount; // if category is missing, just use the raw amount as-is (could be positive or negative based on user input)

    console.log("Creating transaction with account ID:", data.accountId, "and category ID:", data.categoryId);
    const transaction = await prisma.transaction.create({
      data: {
        amount: new Prisma.Decimal(normalizedAmount),
        description: data.name,
        date: data.date || new Date().toISOString().split("T")[0], // fallback to current date if not provided
        createdAt: data.createdAt ?? new Date(),
        accountId: account.id,
        categoryId: category?.id ?? null
      }
    })

    console.log("Created transaction:", transaction);

    await prisma.account.update({
      where: { id: account.id },
      data: {
        balance: {
          increment: normalizedAmount
        }
      }
    })

    createNetWorthSnapshot(user.id);
    return NextResponse.json({ message: 'Transaction created successfully', data: transaction }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error creating transaction, ${error.message}` }, { status: 500 });
    }
  }
}

