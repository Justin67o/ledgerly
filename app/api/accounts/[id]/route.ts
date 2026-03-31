import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { requireAuthentication } from '@/lib/requireAuthentication';

// update one specific existing account by id

export async function PUT(request: Request,
    { params }: { params: Promise<{ id: string }>  }
  ) {
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });
    const data = await request.json();
    console.log("Received data for account update:");
    try{
        const { id } = await params;
        const account = await prisma.account.findUnique({
            where: {id: id },
        });

        if(!account || account.userId !== user.id){
            return new Response("Unauthorized", { status: 401 });
        }
        const updatedAccount = await prisma.account.update({
        where: { id: id },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.type && { type: data.type }),
            ...(data.balance !== undefined && { balance: data.balance }),
        }
        });
        console.log("Updated account:", updatedAccount);
        return NextResponse.json({message: 'Account updated successfully', data: updatedAccount}, {status: 200});
    } catch (error) {
        console.log("Error updating account:", error);
        return NextResponse.json({message: 'Error updating account, ${error.message}'}, {status: 500});
    }
}

// delete one specific existing account by id
export async function DELETE(
    req: Request,
    {params}: {params: Promise<{id: string}>}
){
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });
    const { id } = await params;
    const account = await prisma.account.findUnique({
        where: {id: id },
    });

    if(!account || account.userId !== user.id){
        return new Response("Unauthorized", { status: 401 });
    }
    try{
        const { id } = await params;
        await prisma.account.delete({
        where: {id: id},
    });
    
        return NextResponse.json({message: 'Account deleted successfully'}, {status: 200});
    } catch (error) {
        console.log("Error deleting account:", error);
        return NextResponse.json({message: 'Error deleting account, ${error.message}'}, {status: 500});
    }


}

export async function GET(
    req: Request,
    {params}: {params: Promise<{id: string}>})
{
    console.log("Received request for account with id");
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });
    
    const { id } = await params;
    const account = await prisma.account.findUnique({
        where: {id: id },
    });

    if(!account || account.userId !== user.id){
        return new Response("Unauthorized", { status: 401 });
    }
    return NextResponse.json({data: account}, {status: 200});
}
