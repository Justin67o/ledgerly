import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

//TODO: add authentication and authorization to ensure users can only access their own accounts
// update one specific existing account by id

export async function PUT(request: Request,
    { params }: { params: Promise<{ id: string }>  }
  ) {
    const data = await request.json();
    console.log("Received data for account update:");
    try{
        const { id } = await params;
        const account = await prisma.transaction.update({
        where: { id: id },
        data: {
            ...(data.amount && { amount: data.amount }),
            ...(data.description && { description: data.description }),
            ...(data.date && { date: data.date }),
            ...(data.accountId && { accountId: data.accountId }),
            ...(data.categoryId && { categoryId: data.categoryId }),
        }
        });
        console.log("Updated transaction:", account);
        return NextResponse.json({message: 'Transaction updated successfully', data: account}, {status: 200});
    } catch (error) {
        return NextResponse.json({message: 'Error updating transaction, ${error.message}'}, {status: 500});
    }
}

// delete one specific existing transaction by id
export async function DELETE(
    req: Request,
    {params}: {params: Promise<{id: string}>}
){

    try{
        const { id } = await params;
        await prisma.transaction.delete({
        where: {id: id},
    });
    
        return NextResponse.json({message: 'Transaction deleted successfully'}, {status: 200});
    } catch (error) {
        return NextResponse.json({message: 'Error deleting transaction, ${error.message}'}, {status: 500});
    }


}