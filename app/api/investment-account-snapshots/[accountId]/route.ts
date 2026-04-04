import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuthentication } from "@/lib/requireAuthentication";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { accountId } = await params;

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const snapshots = await prisma.investmentAccountSnapshot.findMany({
      where: { accountId },
      orderBy: { createdAt: "asc" },
    });

    const formatted = snapshots.map((s) => ({
      date: s.date,
      amount: parseFloat(s.amount.toString()),
      createdAt: s.createdAt,
    }));

    return NextResponse.json(
      { message: "Investment account snapshots retrieved successfully", data: formatted },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: `Error retrieving snapshots, ${error.message}` },
        { status: 500 }
      );
    }
  }
}
