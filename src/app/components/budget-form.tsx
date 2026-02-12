import { budgetFormSchema } from "@/lib/validation/budget-schema";

type BudgetFormProps = {
  extraPayment: string;
  minimumRequired: number;
  hasDebts: boolean;
  onChangeExtraPayment: (value: string) => void;
};

function toCurrency(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function BudgetForm({
  extraPayment,
  minimumRequired,
  hasDebts,
  onChangeExtraPayment,
}: BudgetFormProps) {
  const extraPaymentNumber = Number(extraPayment || "0");
  const parsed = budgetFormSchema.safeParse({
    extraPayment,
    hasDebts,
  });
  const issues = parsed.success ? [] : parsed.error.issues;
  const extraPaymentError = issues.find((issue) => issue.path[0] === "extraPayment")?.message;
  const totalAvailablePayment = Math.max(0, minimumRequired) + Math.max(0, extraPaymentNumber);

  return (
    <div className="budget-grid">
      <p className="muted budget-hint">월 필수납입 합계: {toCurrency(minimumRequired)}</p>
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
      {hasDebts && extraPaymentError ? (
        <p className="field-error">{extraPaymentError}</p>
      ) : null}
    </div>
  );
}
