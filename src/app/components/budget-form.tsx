type BudgetFormProps = {
  monthlyBudget: string;
  minimumRequired: number;
  hasDebts: boolean;
  onChangeMonthlyBudget: (value: string) => void;
};

function toCurrency(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function BudgetForm({
  monthlyBudget,
  minimumRequired,
  hasDebts,
  onChangeMonthlyBudget,
}: BudgetFormProps) {
  const budgetNumber = Number(monthlyBudget || "0");
  const isInsufficient = hasDebts && Number.isFinite(budgetNumber) && budgetNumber < minimumRequired;

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
          aria-invalid={isInsufficient}
        />
      </label>
      <p className="muted budget-hint">최소납입 합계: {toCurrency(minimumRequired)}</p>
      {!hasDebts ? <p className="field-warning">채무를 먼저 추가해야 예산을 설정할 수 있습니다.</p> : null}
      {hasDebts && isInsufficient ? (
        <p className="field-error">예산이 최소납입 합계보다 작습니다.</p>
      ) : null}
    </div>
  );
}
