export type DebtCore = {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minPayment: number;
};

export type Debt = {
  name: string;
  balance: number;
  annualRate: number;
  minimumPayment: number;
  prepaymentFeeRate?: number;
  maturityMonths?: number;
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

export type MonthlyDebtStatus = {
  debtName: string;
  paymentAmount: number;
  interestAmount: number;
  principalAmount: number;
  remainingBalance: number;
};

export type MonthlyPlan = {
  month: number;
  remainingBalance: number;
  totalPaidInterest: number;
  payments: MonthlyDebtStatus[];
};

export type StrategyResult = {
  strategy: StrategyType;
  totalInterest: number;
  monthsToPayoff: number;
  payoffDate: string;
  monthlyPlans: MonthlyPlanItem[];
};

export type StrategySummary = {
  strategyName: StrategyType;
  totalInterest: number;
  totalDuration: number;
  monthlyPlans: MonthlyPlan[];
};
