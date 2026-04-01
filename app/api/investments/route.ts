import { getServerSession } from "next-auth";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuthentication } from "@/lib/requireAuthentication";
import { Prisma } from "@/generated/prisma/client";
import { request } from "https";

//TODO: add authentication and authorization to ensure users can only access their own accounts
// get all existing accounts for user
export async function GET(request: Request) {

  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const accountId = url.searchParams.get("accountId"); // optional filter to get investments for a specific account

  try {

    const userInvestments = await prisma.investment.findMany({
      where: { 
        accountId: accountId || undefined, // if accountId is provided, filter by it; otherwise, get all transactions for the user
        account: { userId: user.id } },
      include: { account: true },
    });
    return NextResponse.json({ message: 'Investments retrieved successfully', data: userInvestments }, { status: 200 });
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

  // Find the actual account from the data by their ID
  const account = await prisma.account.findUnique({
    where: { id: data.accountId },
  });

  if (!account || account.userId !== user.id) {
    return new Response("Invalid account", { status: 400 });
  }


  try {
    console.log("Creating investment with account ID:", data.accountId);
    const investment = await prisma.investment.create({
      data: {
        quantity: new Prisma.Decimal(data.quantity),
        purchasePrice: new Prisma.Decimal(data.purchasePrice),
        name: data.name,
        date: data.date || new Date().toISOString().split("T")[0], // fallback to current date if not provided
        createdAt: data.createdAt ?? new Date(),
        accountId: account.id,
      }
    })

    console.log("Created investment:", investment);
    return NextResponse.json({ message: 'Investment created successfully', data: investment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error creating investment, ${error.message}` }, { status: 500 });
    }
  }
}

