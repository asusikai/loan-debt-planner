import type { RecommendationResult, StrategyResult } from "@/types/repayment";

type StrategyPair = {
  avalanche: StrategyResult;
  snowball: StrategyResult;
};

function extractExtraPaymentOrder(result: StrategyResult): string[] {
  const ordered = new Set<string>();

  for (const item of result.monthlyPlans) {
    if (item.interestAmount === 0 && item.principalAmount > 0) {
      ordered.add(item.debtName);
    }
  }

  return [...ordered];
}

export function recommendLowestInterestStrategy(results: StrategyPair): RecommendationResult {
  const recommendedStrategy =
    results.avalanche.totalInterest <= results.snowball.totalInterest ? "avalanche" : "snowball";
  const source = recommendedStrategy === "avalanche" ? results.avalanche : results.snowball;

  return {
    strategy: recommendedStrategy,
    extraPaymentOrder: extractExtraPaymentOrder(source),
  };
}
