import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuthentication } from "@/lib/requireAuthentication";
import { createNetWorthSnapshot } from '@/lib/networthSnapshot';

// update one specific existing investment by id

export async function PUT(request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const data = await request.json();
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });
    const account = await prisma.account.findUnique({
        where: { id: data.accountId },
    });



    if (!account || account.userId !== user.id) {
        return new Response("Invalid account", { status: 400 });
    }
    try {
        const { id } = await params;
        const investment = await prisma.investment.findUnique({
            where: { id: id }
        })

        if (!investment) return NextResponse.json({ message: "Investment not found" });



        await prisma.account.update({
            where: { id: investment.accountId },
            data: {
                balance: {
                    decrement: (parseFloat(investment.quantity.toString()) * parseFloat(investment.purchasePrice.toString()))
                }
            }
        })






        const updatedInvestment = await prisma.investment.update({
            where: { id: id },
            data: {
                ...(data.quantity && { quantity: data.quantity }),
                ...(data.name && { name: data.name }),
                ...(data.date && { date: data.date }),
                ...(data.accountId && { accountId: data.accountId }),
                ...(data.purchasePrice && { purchasePrice: data.purchasePrice })
            }
        });

        await prisma.account.update({
            where: { id: updatedInvestment.accountId },
            data: {
                balance: {
                    increment: parseFloat(data.quantity.toString()) * parseFloat(data.purchasePrice.toString())
                }
            }
        });

        createNetWorthSnapshot(user.id);
        console.log("Updated investment:", updatedInvestment);
        return NextResponse.json({ message: 'Investment updated successfully', data: updatedInvestment }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Error updating investment, ${error.message}' }, { status: 500 });
    }
}

// delete one specific existing investment by id
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });

    try {
        const { id } = await params;
        const investment = await prisma.investment.findUnique({
            where: { id: id },
            include: { account: true },
        });

        if (!investment || investment.account.userId !== user.id) {
            return new Response("Unauthorized", { status: 401 });
        }

        await prisma.account.update({
            where: { id: investment.account.id },
            data: {
                balance: {
                    decrement: parseFloat(investment.quantity.toString()) * parseFloat(investment.purchasePrice.toString())
                }
            }
        })

        await prisma.investment.delete({
            where: { id: id },
        });

        createNetWorthSnapshot(user.id);
        return NextResponse.json({ message: 'Investment deleted successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting investment, ${error.message}' }, { status: 500 });
    }


}

// Get request to get a single investment by id
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }) {
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });
    const { id } = await params;
    const investment = await prisma.investment.findUnique({
        where: { id: id },
        include: { account: true },
    });

    if (!investment || investment.account.userId !== user.id) {
        return new Response("Unauthorized", { status: 401 });
    }
    return NextResponse.json({ data: investment }, { status: 200 });
}