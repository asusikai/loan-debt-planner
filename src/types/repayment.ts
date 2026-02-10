export type Debt = {
  name: string;
  balance: number;
  annualRate: number;
  minimumPayment: number;
  prepaymentFeeRate?: number;
  maturityDate?: string;
};

export type EditableDebt = Debt & { id: string };

export type ScenarioInput = {
  monthlyBudget: number;
  extraPayment: number;
  debts: Debt[];
};

export type StrategyType = "avalanche" | "snowball";

export type MonthlyPlanItem = {
  monthIndex: number;
  debtName: string;
  paymentAmount: number;
  interestAmount: number;
  principalAmount: number;
  remainingBalance: number;
};

export type StrategyResult = {
  strategy: StrategyType;
  totalInterest: number;
  monthsToPayoff: number;
  payoffDate: string;
  monthlyPlans: MonthlyPlanItem[];
};
