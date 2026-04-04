import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuthentication } from "@/lib/requireAuthentication";

// GET /api/budgets?month=4&year=2026
// Returns the budget for a given month/year with goals and computed spent amounts
export async function GET(request: Request) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // get the month and year
  const url = new URL(request.url);
  const month = parseInt(url.searchParams.get("month") ?? "");
  const year = parseInt(url.searchParams.get("year") ?? "");

  if (!month || !year) {
    return NextResponse.json({ message: "month and year are required" }, { status: 400 });
  }

  try {
    // get the budget, include the budgetgoals with their categories
    const budget = await prisma.budget.findUnique({
      where: { userId_month_year: { userId: user.id, month, year } },
      include: {
        goals: {
          include: { category: true },
        },
      },
    });

    if (!budget) {
      return NextResponse.json({ message: "Budget retrieved successfully", data: null }, { status: 200 });
    }

    // Compute spent per category from transactions in this month
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    // loop over each goal in the budget
    const goalsWithSpent = await Promise.all(

      // sum up all transaction amounts for that goal's category
      budget.goals.map(async (goal) => {
        const result = await prisma.transaction.aggregate({
          where: {
            categoryId: goal.categoryId,
            account: { userId: user.id },
            date: { gte: startDate, lt: endDate },
          },

          // sum the amount field (postgresql query)
          _sum: { amount: true },
        });

        // convert to number
        const spent = Math.abs(Number(result._sum.amount ?? 0));
        // return an object for each goal
        return {
          id: goal.id,
          categoryId: goal.categoryId,
          categoryName: goal.category.name,
          categoryType: goal.category.type,
          goalAmount: Number(goal.goalAmount),
          spent,
        };
      })
    );

    return NextResponse.json({
      message: "Budget retrieved successfully",
      data: { id: budget.id, month: budget.month, year: budget.year, goals: goalsWithSpent },
    }, { status: 200 });

  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error retrieving budget, ${error.message}` }, { status: 500 });
    }
  }
}

// POST /api/budgets
// Creates a new budget for a given month/year
export async function POST(request: Request) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const data = await request.json();
  const { month, year } = data;

  if (!month || !year) {
    return NextResponse.json({ message: "month and year are required" }, { status: 400 });
  }

  try {
    // Return existing budget if already created
    const existing = await prisma.budget.findUnique({
      where: { userId_month_year: { userId: user.id, month, year } },
      include: { goals: { include: { category: true } } },
    });
    if (existing) {
      return NextResponse.json({ message: "Budget already exists", data: existing }, { status: 200 });
    }

    // budget doesn't exist, so create a new one
    const budget = await prisma.budget.create({
      data: { userId: user.id, month, year },
    });

    // Carry forward goals from the most recent previous budget
    const prevBudget = await prisma.budget.findFirst({
      // condition: where userId is this userId and the budget is from an earlier year OR from same year but earlier month
      where: { userId: user.id, OR: [{ year: { lt: year } }, { year, month: { lt: month } }] },
      // sort from newest to oldest to ensure we get latest budget
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { goals: true },
    });

    // if there is a previous budget with any goals (? is optional chaining so if null it doesn't break)
    // copies over goals from previous budget to this one
    if (prevBudget?.goals.length) {
      // create new budget goals from previous budget goals
      await prisma.budgetGoal.createMany({
        data: prevBudget.goals.map(g => ({
          budgetId: budget.id,
          categoryId: g.categoryId,
          goalAmount: g.goalAmount,
        })),
      });
    }

    // variable for the newly created budget
    const budgetWithGoals = await prisma.budget.findUnique({
      where: { id: budget.id },
      include: { goals: { include: { category: true } } },
    });

    
    return NextResponse.json({ message: "Budget created successfully", data: budgetWithGoals }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: `Error creating budget, ${message}`, data: null }, { status: 500 });
  }
}
