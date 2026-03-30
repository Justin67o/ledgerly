import { redirect } from "next/navigation";
import { requireAuthentication } from "@/lib/requireAuthentication";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export default async function Start(){
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  } else {
    redirect("/dashboard");
  }
}