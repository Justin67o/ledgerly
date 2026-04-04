import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuthentication } from "@/lib/requireAuthentication";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { createNetWorthSnapshot } from "@/lib/networthSnapshot";
import { createInvestmentAccountSnapshot } from "@/lib/investmentAccountSnapshot";
import { createInvestmentSnapshot } from "@/lib/investmentSnapshot";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export async function POST(request: Request) {
    const data = await request.json();
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });

    try {
        
        const accounts = await prisma.account.findMany({
            where: { userId: user.id, type: "INVESTMENT" }
        });
        const accountsArray = accounts.map(a => a.name).join(", ");

        const today = new Date().toISOString().split("T")[0];
        console.log("Sending to gemini");
        const aiResult = await model.generateContent(
            `You are an investment parser. Parse the following natural language input into a JSON object.
        Only return valid JSON, no markdown, no explanation.

        Valid investment accounts: ${accountsArray}

        Return this exact structure:
        {"accountName": "required field, account name from valid investment accounts list",
        "ticker": "required field, stock ticker symbol in Yahoo Finance format — US tickers are uppercase with no suffix (e.g. AAPL, TSLA), Canadian TSX tickers append .TO (e.g. XEQT.TO, CNR.TO), TSX Venture tickers append .V (e.g. XYZ.V). Infer the correct suffix from context or the ticker name.",
        "quantity": number,
        "purchasePrice": number,
        "date": "required field, YYYY-MM-DD default to today's date (${today}) if not provided"}

        INPUT: ${data.aiInput}`
        );
        const rawText = aiResult.response.text().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
        console.log("Gemini response:", rawText);
        const parsed = JSON.parse(rawText);

        const account = await prisma.account.findFirst({
            where: { name: parsed.accountName, userId: user.id, type: "INVESTMENT" }
        });

        if (!account) {
            return new Response("Invalid account parsed from AI", { status: 400 });
        }
        const addedQty = parseFloat(parsed.quantity);
        const addedPrice = parseFloat(parsed.purchasePrice);
        const existing = await prisma.investment.findFirst({
            where: { accountId: account.id, name: parsed.ticker },
        });

        let investment;
        if (existing) {
            const existingQty = parseFloat(existing.quantity.toString());
            const existingPrice = parseFloat(existing.purchasePrice.toString());
            const newQty = existingQty + addedQty;
            const newAvgPrice = (existingQty * existingPrice + addedQty * addedPrice) / newQty;

            investment = await prisma.investment.update({
                where: { id: existing.id },
                data: {
                    quantity: new Prisma.Decimal(newQty),
                    purchasePrice: new Prisma.Decimal(newAvgPrice),
                },
            });
        } else {
            investment = await prisma.investment.create({
                data: {
                    name: parsed.ticker,
                    quantity: new Prisma.Decimal(addedQty),
                    purchasePrice: new Prisma.Decimal(addedPrice),
                    date: parsed.date,
                    accountId: account.id,
                },
            });
        }
        console.log("Investment created/updated:", investment);
        await prisma.account.update({
            where: { id: account.id },
            data: { balance: { increment: addedQty * addedPrice } }
        });

        createNetWorthSnapshot(user.id);
        createInvestmentAccountSnapshot(account.id);
        createInvestmentSnapshot(user.id);
        return NextResponse.json({ message: 'Investment created successfully', data: investment }, { status: 201 });
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error creating investment:", error);
            return NextResponse.json({ message: `Error creating investment, ${error.message}` }, { status: 500 });
        }
    }
}
