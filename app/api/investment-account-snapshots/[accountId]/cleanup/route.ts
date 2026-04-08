import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuthentication } from "@/lib/requireAuthentication";
import { localDateString } from "@/lib/dateUtils";

export async function POST(
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

  const snapshots = await prisma.investmentAccountSnapshot.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
  });

  const today = localDateString(request.headers.get("X-Timezone") ?? undefined);
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
    await prisma.investmentAccountSnapshot.deleteMany({
      where: { id: { in: toDelete } },
    });
  }

  return NextResponse.json({ message: "Cleanup complete" });
}
