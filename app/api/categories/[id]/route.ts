import { getServerSession } from "next-auth";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuthentication } from "@/lib/requireAuthentication";

//TODO: add authentication and authorization to ensure users can only access their own accounts
// update one specific existing account by id

export async function PUT(request: Request,
    { params }: { params: Promise<{ id: string }>  }
  ) {
    
    const data = await request.json();
    const user = await requireAuthentication();
    if (!user) return new Response("Unauthorized", { status: 401 });
    console.log("Received data for category update:");
    try{
        const { id } = await params;
        const category = await prisma.category.findUnique({
            where: { id: id},
        })
        if(!category || category.userId !== user.id){
            return new Response("Unauthorized", { status: 401 });
        }

        const updatedCategory = await prisma.category.update({
        where: { id: id },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.type && { type: data.type }),
        }
        });
        console.log("Updated category:", updatedCategory);
        return NextResponse.json({message: 'Category updated successfully', data: updatedCategory}, {status: 200});
    } catch (error) {
        return NextResponse.json({message: 'Error updating category, ${error.message}'}, {status: 500});
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
        const category = await prisma.category.findUnique({
            where: { id: id},
        })
        if(!category || category.userId !== user.id){
            return new Response("Unauthorized", { status: 401 });
        }
        await prisma.category.delete({
            where: {id: id},
        });
    
        return NextResponse.json({message: 'Category deleted successfully'}, {status: 200});
    } catch (error) {
        return NextResponse.json({message: 'Error deleting category, ${error.message}'}, {status: 500});
    }


}