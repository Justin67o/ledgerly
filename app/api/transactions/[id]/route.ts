import { getServerSession } from "next-auth";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuthentication } from "@/lib/requireAuthentication";
import { trace } from "console";

//TODO: add authentication and authorization to ensure users can only access their own accounts
// update one specific existing account by id

export async function PUT(request: Request,
    { params }: { params: Promise<{ id: string }>  }
  ) {
    const data = await request.json();
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });
    const account = await prisma.account.findUnique({
        where: { id: data.accountId },
      });
      
    const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
    });

    if (!account || account.userId !== user.id) {
        return new Response("Invalid account", { status: 400 });
    }
    try{
        const { id } = await params;
        const transaction = await prisma.transaction.findUnique({
            where: { id: id }
        })


        const updatedTransaction = await prisma.transaction.update({
        where: { id: id },
        data: {
            ...(data.amount && { amount: data.amount }),
            ...(data.description && { description: data.description }),
            ...(data.date && { date: data.date }),
            ...(data.accountId && { accountId: data.accountId }),
            categoryId: category?.id ?? null,
        }
        });
        console.log("Updated transaction:", updatedTransaction);
        return NextResponse.json({message: 'Transaction updated successfully', data: updatedTransaction}, {status: 200});
    } catch (error) {
        return NextResponse.json({message: 'Error updating transaction, ${error.message}'}, {status: 500});
    }
}

// delete one specific existing transaction by id
export async function DELETE(
    req: Request,
    {params}: {params: Promise<{id: string}>}
){
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });
    
    try{
        const { id } = await params;
        const transaction = await prisma.transaction.findUnique({
            where: { id: id },
            include: { account: true },
        });
        
        if (!transaction || transaction.account.userId !== user.id){
            return new Response("Unauthorized", { status: 401 });
        }
        await prisma.transaction.delete({
            where: {id: id},
        });
    
        return NextResponse.json({message: 'Transaction deleted successfully'}, {status: 200});
    } catch (error) {
        return NextResponse.json({message: 'Error deleting transaction, ${error.message}'}, {status: 500});
    }


}

// Get request to get a single transaction by id
export async function GET(
    req: Request,
    {params}: {params: Promise<{id: string}>})
{
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });
    const { id } = await params;
    const transaction = await prisma.transaction.findUnique({
        where: {id: id },
        include: { account: true },
    });

    if(!transaction || transaction.account.userId !== user.id){
        return new Response("Unauthorized", { status: 401 });
    }
    return NextResponse.json({data: transaction}, {status: 200});
}