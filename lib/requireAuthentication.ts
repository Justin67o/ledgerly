import { getServerSession } from "next-auth";
import { authOptions } from "../app/api/auth/[...nextauth]/route"

export async function requireAuthentication(){

    //TODO: remove mock user and have real authentication here
    const session = await getServerSession(authOptions);
    return { id: "mock-user-id", name: "Test User", email: "test@example.com" };
    // if(!session){
    //     return null;
    // }
    
    // const user = session.user as { id: string; name?: string; email?: string };
    // return user;
}