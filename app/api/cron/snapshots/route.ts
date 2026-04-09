import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createNetWorthSnapshot } from "@/lib/networthSnapshot";
import { createInvestmentSnapshot } from "@/lib/investmentSnapshot";

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    const users = await prisma.user.findMany({ select: { id: true } });

    const results = await Promise.allSettled(
        users.map(async (user) => {
            await createNetWorthSnapshot(user.id);
            await createInvestmentSnapshot(user.id);
        })
    );

    const failed = results.filter(r => r.status === "rejected").length;
    return NextResponse.json({ total: users.length, failed });
}
