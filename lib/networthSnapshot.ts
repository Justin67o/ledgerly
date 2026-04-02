import { prisma } from "./prisma";
import { Prisma } from "@/generated/prisma/client";

// function to create a networth snapshot for a user
export async function createNetWorthSnapshot(userId: string) {
  const accounts = await prisma.account.findMany({ where: { userId } });
  const netWorth = accounts.reduce((sum, a) => sum + parseFloat(a.balance.toString()), 0);
  const date = new Date().toISOString().split("T")[0];
  await prisma.netWorthSnapshot.create({
    data: { userId, amount: new Prisma.Decimal(netWorth), date }
  });
} 