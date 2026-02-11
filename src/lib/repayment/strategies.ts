import type { Debt, StrategyType } from "@/types/repayment";
import { SortProvider } from "@/lib/repayment/sort-provider";

const sortProvider = new SortProvider();

export function rankDebtsByStrategy<T extends Debt>(
  debts: T[],
  strategy: StrategyType,
): T[] {
  return sortProvider.rankDebtsByStrategy(debts, strategy);
}
