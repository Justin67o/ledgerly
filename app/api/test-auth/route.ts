// app/api/test-auth/route.ts
import { NextRequest } from "next/server";
import { requireAuthentication } from "@/lib/requireAuthentication";

export async function GET(req: NextRequest) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  return new Response(`Logged in as: ${user.id}`);
}