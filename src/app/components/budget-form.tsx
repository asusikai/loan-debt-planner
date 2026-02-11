import { budgetFormSchema } from "@/lib/validation/budget-schema";

type BudgetFormProps = {
  monthlyBudget: string;
  extraPayment: string;
  minimumRequired: number;
  hasDebts: boolean;
  onChangeMonthlyBudget: (value: string) => void;
  onChangeExtraPayment: (value: string) => void;
};

function toCurrency(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function BudgetForm({
  monthlyBudget,
  extraPayment,
  minimumRequired,
  hasDebts,
  onChangeMonthlyBudget,
  onChangeExtraPayment,
}: BudgetFormProps) {
  const budgetNumber = Number(monthlyBudget || "0");
  const extraPaymentNumber = Number(extraPayment || "0");
  const parsed = budgetFormSchema.safeParse({
    monthlyBudget,
    extraPayment,
    minimumRequired,
    hasDebts,
  });
  const issues = parsed.success ? [] : parsed.error.issues;
  const monthlyBudgetError = issues.find((issue) => issue.path[0] === "monthlyBudget")?.message;
  const extraPaymentError = issues.find((issue) => issue.path[0] === "extraPayment")?.message;
  const totalAvailablePayment = Math.max(0, budgetNumber) + Math.max(0, extraPaymentNumber);

  return (
    <div className="budget-grid">
      <label>
        월 상환 예산(원)
        <input
          type="number"
          min="0"
          step="1000"
          value={monthlyBudget}
          onChange={(event) => onChangeMonthlyBudget(event.target.value)}
          disabled={!hasDebts}
          aria-invalid={Boolean(monthlyBudgetError)}
        />
      </label>
      <p className="muted budget-hint">최소납입 합계: {toCurrency(minimumRequired)}</p>
      <label>
        추가 상환(원, 선택)
        <input
          type="number"
          min="0"
          step="1000"
          value={extraPayment}
          onChange={(event) => onChangeExtraPayment(event.target.value)}
          disabled={!hasDebts}
          aria-invalid={Boolean(extraPaymentError)}
        />
      </label>
      <p className="muted budget-hint">월 총 가용 상환: {toCurrency(totalAvailablePayment)}</p>
      {!hasDebts ? <p className="field-warning">채무를 먼저 추가해야 예산을 설정할 수 있습니다.</p> : null}
      {hasDebts && monthlyBudgetError ? (
        <p className="field-error">{monthlyBudgetError}</p>
      ) : null}
      {hasDebts && extraPaymentError ? (
        <p className="field-error">{extraPaymentError}</p>
      ) : null}
    </div>
  );
}
