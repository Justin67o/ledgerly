import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuthentication } from "@/lib/requireAuthentication";

export async function POST(request: Request) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const snapshots = await prisma.investmentSnapshot.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const today = new Date().toISOString().split("T")[0];
  const pastSnapshots = snapshots.filter((s) => s.date < today);

  const seen = new Set<string>();
  const toDelete: string[] = [];

  for (const snapshot of pastSnapshots) {
    if (seen.has(snapshot.date)) {
      toDelete.push(snapshot.id);
    } else {
      seen.add(snapshot.date);
    }
  }

  if (toDelete.length > 0) {
    await prisma.investmentSnapshot.deleteMany({
      where: { id: { in: toDelete } },
    });
  }

  return NextResponse.json({ message: "Cleanup complete" });
}
