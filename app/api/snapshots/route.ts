import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuthentication } from "@/lib/requireAuthentication";
import { createNetWorthSnapshot } from '@/lib/networthSnapshot';
import { createInvestmentSnapshot } from '@/lib/investmentSnapshot';
import { localDateString } from '@/lib/dateUtils';

//TODO: add authentication and authorization to ensure users can only access their own accounts
// get all existing snapshots for user
export async function GET(request: Request) {

  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  try {

    const userSnapshots = await prisma.netWorthSnapshot.findMany({
      where: {
        userId: user.id,
      },
      orderBy: { createdAt: "asc" },
    });

    const formatted = userSnapshots.map(s => ({
      date: s.date,
      amount: parseFloat(s.amount.toString()),
      createdAt: s.createdAt,
    }));
    return NextResponse.json({ message: 'Snapshots retrieved successfully', data: formatted }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.log("Error retrieving snapshots:", error);
      return NextResponse.json({ message: `Error retrieving snapshots, ${error.message}` }, { status: 500 });
    }
  }
}

// Create snapshots for today (net worth, investment account, and investment total)
export async function POST(request: Request) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const today = localDateString(request.headers.get("X-Timezone") ?? undefined);

  try {
    await createNetWorthSnapshot(user.id, today);
    await createInvestmentSnapshot(user.id, today);
    return NextResponse.json({ message: 'Snapshots created successfully' }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error creating snapshots: ${error.message}` }, { status: 500 });
    }
  }
}