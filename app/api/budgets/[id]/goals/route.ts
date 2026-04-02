import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuthentication } from "@/lib/requireAuthentication";
import { Prisma } from "@/generated/prisma/client";

// POST /api/budgets/[id]/goals
// Adds or updates a goal for a category in a budget
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const data = await request.json();
  const { id } = await params;

  try {
    // find the budget
    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // upsert is update and insert, ensures that a record exists for this Id and updates if exists, or create if doesn't
    const goal = await prisma.budgetGoal.upsert({
      // budgetId_categoryId is the compound unique key on budgetGoal so each category can only appear once per budgetGoal
      where: { budgetId_categoryId: { budgetId: id, categoryId: data.categoryId } },
      update: { goalAmount: new Prisma.Decimal(data.goalAmount ?? 0) },
      create: {
        budgetId: id,
        categoryId: data.categoryId,
        goalAmount: new Prisma.Decimal(data.goalAmount ?? 0),
      },
      include: { category: true },
    });

    return NextResponse.json({ message: "Goal saved successfully", data: goal }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error saving goal, ${error.message}` }, { status: 500 });
    }
  }
}
