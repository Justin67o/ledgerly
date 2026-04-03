import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthentication } from "@/lib/requireAuthentication";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({suppressNotices: ['yahooSurvey']});

export async function GET(request: Request) {

    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const url = new URL(request.url);
    const ticker = url.searchParams.get("ticker") ?? "";

    const result = await yahooFinance.quote(ticker);

    if (!result || !result.regularMarketPrice) {
        return NextResponse.json({ message: "Failed to fetch price" }, { status: 500 });
    }


    return NextResponse.json({ data: result.regularMarketPrice }, { status: 200 });
}