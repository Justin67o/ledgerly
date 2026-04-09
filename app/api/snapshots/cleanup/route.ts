import { requireAuthentication } from "@/lib/requireAuthentication";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { localDateString } from "@/lib/dateUtils";

export async function POST(request: Request) {
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });

    // Get all unique snapshots for this user ordered from newest to oldest
    const snapshots = await prisma.netWorthSnapshot.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
    });

    // Keep only the latest snapshot per date

    const today = localDateString(request.headers.get("X-Timezone") ?? undefined)
    const filteredSnapshots = snapshots.filter(s => s.date < today); // only consider snapshots before, ignore any future-dated snapshots that might exist for some reason
    // Use a Set to track dates already seen and an array to collect IDs of snapshots to delete
    const seen = new Set<string>();
    const toDelete: string[] = [];

    // loop through all the user's snapshots from newest to oldest
    for (const snapshot of filteredSnapshots) {
        // If we've already seen a snapshot for this date, mark it for deletion
        if (seen.has(snapshot.date)) {
            // This is a duplicate snapshot for the same date, so we want to delete it, add its ID to the array of snapshots to delete
            toDelete.push(snapshot.id);
        } else {
            // This is the first (newest) snapshot we've seen for this date, so we keep it and add the date to the seen set so we can delete any older snapshots with the same date
            seen.add(snapshot.date);
        }
    }

    // if there are any snapshots to delete, delete them all in one query
    if (toDelete.length > 0) {
        await prisma.netWorthSnapshot.deleteMany({
            where: { id: { in: toDelete } }
        });
    }

    return NextResponse.json({ message: "Cleanup complete" });
}