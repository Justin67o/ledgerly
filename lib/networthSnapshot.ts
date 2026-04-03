import { prisma } from "./prisma";
import { Prisma } from "@/generated/prisma/client";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// function to create a networth snapshot for a user
export async function createNetWorthSnapshot(userId: string) {
  const accounts = await prisma.account.findMany({ where: { userId } });

  let netWorth = 0;
  for (const account of accounts) {
    if (account.type !== "INVESTMENT") {
      netWorth += parseFloat(account.balance.toString());
      continue;
    }

    const holdings = await prisma.investment.findMany({ where: { accountId: account.id } });
    for (const inv of holdings) {
      const qty = parseFloat(inv.quantity.toString());
      try {
        const result = await yahooFinance.quote(inv.name);
        const price = result?.regularMarketPrice ?? parseFloat(inv.purchasePrice.toString());
        netWorth += qty * price;
      } catch {
        netWorth += qty * parseFloat(inv.purchasePrice.toString());
      }
    }
  }

  const date = new Date().toISOString().split("T")[0];
  await prisma.netWorthSnapshot.create({
    data: { userId, amount: new Prisma.Decimal(netWorth), date }
  });
}