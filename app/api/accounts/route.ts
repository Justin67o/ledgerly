import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

//TODO: add authentication and authorization to ensure users can only access their own accounts
// get all existing accounts for user
export async function GET() {
    try{
        const accounts = await prisma.account.findMany();
        return NextResponse.json({message: 'Accounts retrieved successfully', data: accounts}, {status: 200});
    } catch (error) {
        return NextResponse.json({message: 'Error retrieving accounts, ${error.message}'}, {status: 500});
    }

}

// create a new account
export async function POST(request: Request) {
  const data = await request.json();
  console.log("Received data for new account:", data);
  try{
    const account = await prisma.account.create({
        data: {
            name: data.name,
            type: data.type,
            balance: data.balance ?? 0,
            userId: data.userId
        }
    })
    return NextResponse.json({message: 'Account created successfully', data: account}, {status: 201});
    } catch (error) {
        if(error instanceof Error) {
            return NextResponse.json({message: `Error creating account, ${error.message}`}, {status: 500});
        }
    }
}

