import { prisma } from "./prisma";
import { Prisma } from "@/generated/prisma/client";
import YahooFinance from "yahoo-finance2";
import { localDateString } from "./dateUtils";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// function to create a networth snapshot for a user
export async function createNetWorthSnapshot(userId: string, date?: string) {
  const accounts = await prisma.account.findMany({ where: { userId } });

  let netWorth = 0;
  const investmentAccountTotals: { accountId: string; total: number }[] = [];

  for (const account of accounts) {
    if (account.type !== "INVESTMENT") {
      netWorth += parseFloat(account.balance.toString());
      continue;
    }

    let accountTotal = 0;
    const holdings = await prisma.investment.findMany({ where: { accountId: account.id } });
    for (const inv of holdings) {
      const qty = parseFloat(inv.quantity.toString());
      try {
        const result = await yahooFinance.quote(inv.name);
        const price = result?.regularMarketPrice ?? parseFloat(inv.purchasePrice.toString());
        accountTotal += qty * price;
      } catch {
        accountTotal += qty * parseFloat(inv.purchasePrice.toString());
      }
    }
    netWorth += accountTotal;
    investmentAccountTotals.push({ accountId: account.id, total: accountTotal });
  }

  date ??= localDateString();
  await prisma.netWorthSnapshot.create({
    data: { userId, amount: new Prisma.Decimal(netWorth), date }
  });

  for (const { accountId, total } of investmentAccountTotals) {
    await prisma.investmentAccountSnapshot.create({
      data: { accountId, amount: new Prisma.Decimal(total), date },
    });
  }
}