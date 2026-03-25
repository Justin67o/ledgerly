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
        const category = await prisma.category.update({
        where: { id: id },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.type && { type: data.type }),
        }
        });
        console.log("Updated category:", category);
        return NextResponse.json({message: 'Category updated successfully', data: category}, {status: 200});
    } catch (error) {
        return NextResponse.json({message: 'Error updating category, ${error.message}'}, {status: 500});
    }
}
    
// delete one specific existing transaction by id
export async function DELETE(
    req: Request,
    {params}: {params: Promise<{id: string}>}
){

    try{
        const { id } = await params;
        await prisma.category.delete({
        where: {id: id},
    });
    
        return NextResponse.json({message: 'Category deleted successfully'}, {status: 200});
    } catch (error) {
        return NextResponse.json({message: 'Error deleting category, ${error.message}'}, {status: 500});
    }


}