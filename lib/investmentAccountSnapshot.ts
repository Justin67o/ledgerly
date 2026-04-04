import { prisma } from "./prisma";
import { Prisma } from "@/generated/prisma/client";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export async function createInvestmentAccountSnapshot(accountId: string) {
  const holdings = await prisma.investment.findMany({ where: { accountId } });

  let total = 0;
  for (const inv of holdings) {
    const qty = parseFloat(inv.quantity.toString());
    try {
      const result = await yahooFinance.quote(inv.name);
      const price = result?.regularMarketPrice ?? parseFloat(inv.purchasePrice.toString());
      total += qty * price;
    } catch {
      total += qty * parseFloat(inv.purchasePrice.toString());
    }
  }

  const date = new Date().toISOString().split("T")[0];
  await prisma.investmentAccountSnapshot.create({
    data: { accountId, amount: new Prisma.Decimal(total), date },
  });
}
