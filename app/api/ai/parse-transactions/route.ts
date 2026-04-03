import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuthentication } from "@/lib/requireAuthentication";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNetWorthSnapshot } from "@/lib/networthSnapshot";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || ""); // Make sure to set your GEMINI_API_KEY in the .env file
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });


// recieve a new transaction to be created, parse it with Gemini, and create the transaction in the database
export async function POST(request: Request) {
    const data = await request.json();
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });

    console.log("Received ai data for new transaction:", data);
    try {

        // get all user accounts that are not investment
        const accounts = await prisma.account.findMany({
            where: { userId: user.id, type: { not: "INVESTMENT" } }
        })
        const accountsArray = accounts.map(account => account.name).join(", ");

        // get all user categories
        const categories = await prisma.category.findMany({
            where: { userId: user.id }
        });
        const categoriesArray = categories.map(category => category.name).join(", ");

        const aiInput = data.aiInput;

        console.log("Sending to gemini")
        const today = new Date().toISOString().split("T")[0];

        const aiResult = await model.generateContent(
            `You are a transaction parser. Parse the following natural language input into a JSON object.
        Only return valid JSON, no markdown, no explanation.
        
        Valid accounts: ${accountsArray}
        Valid categories: ${categoriesArray}
        
        Return this exact structure:
        {"accountName": "required field, account name from valid accounts list", 
        "categoryName": "category name from valid categories list" or null if none mentioned,
        "amount": number,
        "date": "required field, YYYY-MM-DD default to today's date (${today}) if not provided",
        "description": "name of the transaction",
        "type": "INCOME" or "EXPENSE"}
        
        INPUT: ${aiInput}`
        );

        console.log("gemini responded")
        const rawText = aiResult.response.text().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
        console.log(rawText);
        const parsed = JSON.parse(rawText);
        console.log("Parsed AI result:", parsed);

        const account = await prisma.account.findFirst({
            where: { name: parsed.accountName, userId: user.id }
        });

        if (!account) {
            return new Response("Invalid account parsed from AI", { status: 400 });
        }

        const category = parsed.categoryName ? await prisma.category.findFirst({
            where: { name: parsed.categoryName, userId: user.id }
        }) : null;

        const transaction = await prisma.transaction.create({
            data: {
                description: parsed.description,
                amount: parsed.amount,
                date: parsed.date,
                type: parsed.type ?? "EXPENSE",
                accountId: account.id,
                categoryId: category?.id ?? undefined,
            }
        })

        const rawAmount = Math.abs(parseFloat(parsed.amount));
        const normalizedAmount = parsed.type === "INCOME" ? rawAmount : -rawAmount;

        await prisma.account.update({
            where: { id: account.id },
            data: {
                balance: {
                    increment: normalizedAmount
                }
            }
        })

        createNetWorthSnapshot(user.id);
        return NextResponse.json({ message: 'Transaction created successfully', data: transaction }, { status: 201 });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ message: `Error creating transaction, ${error.message}` }, { status: 500 });
        }
    }
}

