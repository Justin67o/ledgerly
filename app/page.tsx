import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Landing from "./landing/page";

export default async function Start() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) redirect("/dashboard");
  return <Landing />;
}
