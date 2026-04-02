import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuthentication } from "@/lib/requireAuthentication";
import { Prisma } from "@/generated/prisma/client";

// PUT /api/budgets/[id]/goals/[goalId]
// Updates the goal amount for a specific budget goal
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; goalId: string }> }
) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const data = await request.json();
  const { id, goalId } = await params;

  try {
    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const updated = await prisma.budgetGoal.update({
      where: { id: goalId },
      data: { goalAmount: new Prisma.Decimal(data.goalAmount) },
      include: { category: true },
    });

    return NextResponse.json({ message: "Goal updated successfully", data: updated }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error updating goal, ${error.message}` }, { status: 500 });
    }
  }
}

// DELETE /api/budgets/[id]/goals/[goalId]
// Removes a goal from a budget
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; goalId: string }> }
) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id, goalId } = await params;

  try {
    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await prisma.budgetGoal.delete({ where: { id: goalId } });
    return NextResponse.json({ message: "Goal deleted successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error deleting goal, ${error.message}` }, { status: 500 });
    }
  }
}
