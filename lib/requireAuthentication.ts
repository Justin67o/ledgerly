import { getServerSession } from "next-auth";
import { authOptions } from "../app/api/auth/[...nextauth]/route"
import { prisma } from "./prisma";

export async function requireAuthentication(){

    //TODO: remove mock user and have real authentication here
    const session = await getServerSession(authOptions);
    // return { id: "mock-user-id", name: "Test User", email: "test@example.com" };
    if(!session?.user?.email){
        throw new Error ("Unauthorized");
    }
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user){
        throw new Error ("Unauthorized")
    }
    return user;
}