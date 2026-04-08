import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuthentication } from "@/lib/requireAuthentication";
import { createNetWorthSnapshot } from '@/lib/networthSnapshot';
import { localDateString } from '@/lib/dateUtils';

// PUT: Update a specific transaction
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const data = await request.json();
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: "Transaction not found" });

  const account = await prisma.account.findUnique({ where: { id: data.accountId } });
  if (!account || account.userId !== user.id) return new Response("Invalid account", { status: 400 });

  const category = data.categoryId ? await prisma.category.findUnique({ where: { id: data.categoryId } }) : null;

  try {
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // Step 1: Remove old transaction amount from old account
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { decrement: existing.amount } }
      });

      // Step 2: Update the transaction
      const txUpdated = await tx.transaction.update({
        where: { id },
        data: {
          ...(data.amount && { amount: data.amount }),
          ...(data.description && { description: data.description }),
          ...(data.date && { date: data.date }),
          ...(data.accountId && { accountId: data.accountId }),
          ...(data.type && { type: data.type }),
          categoryId: category?.id ?? null,
        }
      });

      // Step 3: Add new transaction amount to new account
      if (txUpdated.accountId && txUpdated.amount) {
        await tx.account.update({
          where: { id: txUpdated.accountId },
          data: { balance: { increment: txUpdated.amount } }
        });
      }

      return txUpdated;
    });

    await createNetWorthSnapshot(user.id, localDateString(request.headers.get("X-Timezone") ?? undefined));

    return NextResponse.json({ message: 'Transaction updated successfully', data: updatedTransaction }, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error updating transaction: ${error.message}` }, { status: 500 });
    }
  }
}

// DELETE: Delete a transaction
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const transaction = await prisma.transaction.findUnique({ where: { id }, include: { account: true } });
  if (!transaction || transaction.account.userId !== user.id) return new Response("Unauthorized", { status: 401 });

  try {
    await prisma.$transaction([
      prisma.account.update({
        where: { id: transaction.account.id },
        data: { balance: { decrement: transaction.amount } }
      }),
      prisma.transaction.delete({ where: { id } })
    ]);

    await createNetWorthSnapshot(user.id, localDateString(req.headers.get("X-Timezone") ?? undefined));

    return NextResponse.json({ message: 'Transaction deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error deleting transaction: ${error.message}` }, { status: 500 });
    }
  }
}

// GET: Get a single transaction
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const transaction = await prisma.transaction.findUnique({ where: { id }, include: { account: true } });
  if (!transaction || transaction.account.userId !== user.id) return new Response("Unauthorized", { status: 401 });

  return NextResponse.json({ data: transaction }, { status: 200 });
}