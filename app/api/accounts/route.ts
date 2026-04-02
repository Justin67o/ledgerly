import { getServerSession } from "next-auth";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuthentication } from "@/lib/requireAuthentication";
import { Prisma } from "@/generated/prisma/client";
import { createNetWorthSnapshot } from '@/lib/networthSnapshot';

export async function GET() {
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });
    try {
        const accounts = await prisma.account.findMany({
            where: { userId: user.id }
        });
        return NextResponse.json({ message: 'Accounts retrieved successfully', data: accounts }, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error retrieving accounts:", error);
            return NextResponse.json({ message: `Error retrieving accounts, ${error.message}` }, { status: 500 });
        }
    }

}

// create a new account
export async function POST(request: Request) {
    const data = await request.json();
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });
    console.log("Received data for new account:", data);

    if (data.type === "INVESTMENT") {
        data.balance = 0;
    }
    console.log("Data after processing for account creation:", data.balance);
    try {
        const account = await prisma.account.create({
            data: {
                name: data.name,
                type: data.type,
                dateCreated: data.date || new Date().toISOString().split("T")[0], // fallback to current date if not provided
                balance: new Prisma.Decimal(data.balance || 0),
                userId: user.id
            }
        })

        createNetWorthSnapshot(user.id);
        return NextResponse.json({ message: 'Account created successfully', data: account }, { status: 201 });
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error creating account:", error);
            return NextResponse.json({ message: `Error creating account, ${error.message}` }, { status: 500 });
        }
    }
}

