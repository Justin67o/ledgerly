import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

//TODO: add authentication and authorization to ensure users can only access their own accounts
// update one specific existing account by id

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  console.log("GET by ID route hit", params.id);
  return Response.json({ id: params.id });
}

export async function PUT(request: Request,
    { params }: { params: { id: string } }
  ) {
    const data = await request.json();
    console.log("Received data for account update:");
    try{
        const account = await prisma.account.update({
        where: { id: params.id },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.type && { type: data.type }),
            ...(data.balance !== undefined && { balance: data.balance }),
        }
        });
        console.log("Updated account:", account);
        return NextResponse.json({message: 'Account updated successfully', data: account}, {status: 200});
    } catch (error) {
        console.log("Error updating account:", error);
        return NextResponse.json({message: 'Error updating account, ${error.message}'}, {status: 500});
    }
}

// delete one specific existing account by id
export async function DELETE(
    req: Request,
    {params}: {params: {id: string}}
){

    try{
    await prisma.account.delete({
        where: {id: params.id},
    });
    
        return NextResponse.json({message: 'Account deleted successfully'}, {status: 200});
    } catch (error) {
        return NextResponse.json({message: 'Error deleting account, ${error.message}'}, {status: 500});
    }


}

