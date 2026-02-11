/**
 * Core debt shape used for base field documentation.
 */
export type DebtCore = {
  /** Unique debt identifier. */
  id: string;
  /** User-facing debt name. */
  name: string;
  /** Current principal balance in KRW. */
  balance: number;
  /** Annual interest rate as decimal (e.g. 0.12). */
  interestRate: number;
  /** Required minimum monthly payment in KRW. */
  minPayment: number;
};

/**
 * Debt model used by simulation engine and UI forms.
 */
export type Debt = {
  /** Debt display name. */
  name: string;
  /** Remaining principal in KRW. */
  balance: number;
  /** Annual interest rate as decimal (e.g. 0.12). */
  annualRate: number;
  /** Minimum required monthly payment in KRW. */
  minimumPayment: number;
  /** Optional prepayment fee rate as decimal. */
  prepaymentFeeRate?: number;
  /** Optional prepayment fee exemption months. */
  feeExemptionMonths?: number;
  /** Optional remaining months to maturity. */
  maturityMonths?: number;
};

/**
 * Debt model with editable id for list management.
 */
export type EditableDebt = Debt & { id: string };

/**
 * Simulation input used by repayment engine.
 */
export type ScenarioInput = {
  /** Monthly repayment budget in KRW. */
  monthlyBudget: number;
  /** Optional additional payment in KRW. */
  extraPayment: number;
  /** Debt set to simulate. */
  debts: Debt[];
};

/**
 * UI-level scenario model with explicit strategy selection.
 */
export type Scenario = {
  /** Debt set to simulate. */
  debts: Debt[];
  /** Monthly repayment budget in KRW. */
  monthlyBudget: number;
  /** Selected strategy in legacy uppercase format. */
  strategy: "SNOWBALL" | "AVALANCHE";
};

/**
 * Supported repayment strategy identifiers.
 */
export type StrategyType = "avalanche" | "snowball";

/**
 * Flat monthly payment entry emitted by engine.
 */
export type MonthlyPlanItem = {
  /** 1-based month index. */
  monthIndex: number;
  /** Target debt name for this row. */
  debtName: string;
  /** Paid amount in this row (KRW). */
  paymentAmount: number;
  /** Interest portion in KRW. */
  interestAmount: number;
  /** Principal portion in KRW. */
  principalAmount: number;
  /** Remaining debt balance after payment (KRW). */
  remainingBalance: number;
};

/**
 * Debt-level breakdown item for grouped monthly plans.
 */
export type MonthlyDebtStatus = {
  /** Target debt name. */
  debtName: string;
  /** Paid amount in KRW. */
  paymentAmount: number;
  /** Interest amount in KRW. */
  interestAmount: number;
  /** Principal amount in KRW. */
  principalAmount: number;
  /** Remaining balance in KRW. */
  remainingBalance: number;
};

/**
 * Grouped monthly plan format for reporting.
 */
export type MonthlyPlan = {
  /** 1-based month number. */
  month: number;
  /** Total remaining balance at month end. */
  remainingBalance: number;
  /** Running total of paid interest. */
  totalPaidInterest: number;
  /** Debt-level payment breakdown. */
  payments: MonthlyDebtStatus[];
};

/**
 * Strategy simulation output used by UI.
 */
export type StrategyResult = {
  /** Selected strategy key. */
  strategy: StrategyType;
  /** Total paid interest in KRW. */
  totalInterest: number;
  /** Number of months until full payoff. */
  monthsToPayoff: number;
  /** Payoff month in YYYY-MM format. */
  payoffDate: string;
  /** Flat monthly payment rows. */
  monthlyPlans: MonthlyPlanItem[];
};

/**
 * Legacy-style summary model for strategy comparison.
 */
export type StrategySummary = {
  /** Strategy display key. */
  strategyName: StrategyType;
  /** Total paid interest in KRW. */
  totalInterest: number;
  /** Total payoff duration in months. */
  totalDuration: number;
  /** Grouped monthly plans. */
  monthlyPlans: MonthlyPlan[];
};
