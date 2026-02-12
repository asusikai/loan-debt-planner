import { simulateStrategy } from "@/lib/repayment/engine";
import type { ScenarioInput, StrategyResult, StrategyType } from "@/types/repayment";

export function runStrategySimulation(
  input: ScenarioInput,
  strategy: StrategyType,
): StrategyResult {
  return simulateStrategy(input, strategy);
}

export function runAllStrategySimulations(input: ScenarioInput): {
  avalanche: StrategyResult;
  snowball: StrategyResult;
} {
  return {
    avalanche: runStrategySimulation(input, "avalanche"),
    snowball: runStrategySimulation(input, "snowball"),
  };
}
