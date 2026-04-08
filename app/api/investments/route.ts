import { getServerSession } from "next-auth";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuthentication } from "@/lib/requireAuthentication";
import { Prisma } from "@/generated/prisma/client";
import { request } from "https";
import { createNetWorthSnapshot } from '@/lib/networthSnapshot';
import { createInvestmentAccountSnapshot } from '@/lib/investmentAccountSnapshot';
import { createInvestmentSnapshot } from '@/lib/investmentSnapshot';
import { localDateString } from '@/lib/dateUtils';

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
        account: { userId: user.id }
      },
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
    const addedQty = parseFloat(data.quantity);
    const addedPrice = parseFloat(data.purchasePrice);
    const existing = await prisma.investment.findFirst({
      where: { accountId: account.id, name: data.name },
    });

    let investment;
    if (existing) {
      const existingQty = parseFloat(existing.quantity.toString());
      const existingPrice = parseFloat(existing.purchasePrice.toString());
      const newQty = existingQty + addedQty;
      const newAvgPrice = (existingQty * existingPrice + addedQty * addedPrice) / newQty;

      investment = await prisma.investment.update({
        where: { id: existing.id },
        data: {
          quantity: new Prisma.Decimal(newQty),
          purchasePrice: new Prisma.Decimal(newAvgPrice),
        },
      });
    } else {
      investment = await prisma.investment.create({
        data: {
          quantity: new Prisma.Decimal(addedQty),
          purchasePrice: new Prisma.Decimal(addedPrice),
          name: data.name,
          date: data.date || localDateString(request.headers.get("X-Timezone") ?? undefined),
          createdAt: data.createdAt ?? new Date(),
          accountId: account.id,
        },
      });
    }

    await prisma.account.update({
      where: { id: account.id },
      data: { balance: { increment: addedQty * addedPrice } },
    });

    const today = localDateString(request.headers.get("X-Timezone") ?? undefined);
    createNetWorthSnapshot(user.id, today);
    createInvestmentAccountSnapshot(account.id, today);
    createInvestmentSnapshot(user.id, today);

    console.log("Created/updated investment:", investment);
    return NextResponse.json({ message: 'Investment created successfully', data: investment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error creating investment, ${error.message}` }, { status: 500 });
    }
  }
}

