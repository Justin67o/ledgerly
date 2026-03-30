import { getServerSession } from "next-auth";
import { authOptions } from "../app/api/auth/[...nextauth]/route"
import { prisma } from "./prisma";

export async function requireAuthentication(){

    const session = await getServerSession(authOptions);
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