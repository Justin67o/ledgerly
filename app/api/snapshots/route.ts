import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuthentication } from "@/lib/requireAuthentication";
import { Prisma } from "@/generated/prisma/client";
import { request } from "https";
import { createNetWorthSnapshot } from '@/lib/networthSnapshot';

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