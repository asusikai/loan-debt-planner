import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

export type DebtFormValues = {
  name: string;
  balance: string;
  annualRatePercent: string;
  minimumPayment: string;
  maturityDate: string;
  prepaymentFeeRatePercent: string;
};

type DebtFormProps = {
  mode: "create" | "edit";
  initialValues: DebtFormValues;
  onSubmit: (values: DebtFormValues) => void;
  onCancel: () => void;
};

function areEqual(left: DebtFormValues, right: DebtFormValues): boolean {
  return (
    left.name === right.name &&
    left.balance === right.balance &&
    left.annualRatePercent === right.annualRatePercent &&
    left.minimumPayment === right.minimumPayment &&
    left.maturityDate === right.maturityDate &&
    left.prepaymentFeeRatePercent === right.prepaymentFeeRatePercent
  );
}

export function DebtForm({ mode, initialValues, onSubmit, onCancel }: DebtFormProps) {
  const [values, setValues] = useState<DebtFormValues>(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const isDirty = useMemo(() => !areEqual(values, initialValues), [values, initialValues]);

  function updateField<K extends keyof DebtFormValues>(field: K, value: DebtFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label htmlFor="debt-name">
        채무명 *
        <input
          id="debt-name"
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="예: 신용대출A"
          required
        />
      </label>
      <label htmlFor="debt-balance">
        잔액(원) *
        <input
          id="debt-balance"
          type="number"
          value={values.balance}
          onChange={(event) => updateField("balance", event.target.value)}
          placeholder="5000000"
          required
        />
      </label>
      <label htmlFor="debt-rate">
        연이율(%) *
        <input
          id="debt-rate"
          type="number"
          step="0.01"
          value={values.annualRatePercent}
          onChange={(event) => updateField("annualRatePercent", event.target.value)}
          placeholder="8.2"
          required
        />
      </label>
      <label htmlFor="debt-minimum-payment">
        최소납입액(원) *
        <input
          id="debt-minimum-payment"
          type="number"
          value={values.minimumPayment}
          onChange={(event) => updateField("minimumPayment", event.target.value)}
          placeholder="200000"
          required
        />
      </label>
      <label htmlFor="debt-maturity-date">
        만기(선택)
        <input
          id="debt-maturity-date"
          type="date"
          value={values.maturityDate}
          onChange={(event) => updateField("maturityDate", event.target.value)}
        />
      </label>
      <label htmlFor="debt-prepayment-fee-rate">
        중도상환수수료율(%, 선택)
        <input
          id="debt-prepayment-fee-rate"
          type="number"
          step="0.01"
          min="0"
          value={values.prepaymentFeeRatePercent}
          onChange={(event) => updateField("prepaymentFeeRatePercent", event.target.value)}
          placeholder="1.0"
        />
      </label>
      <div className="form-actions">
        <button type="submit" disabled={mode === "edit" && !isDirty}>
          {mode === "edit" ? "채무 수정" : "채무 추가"}
        </button>
        {mode === "edit" ? (
          <button type="button" className="ghost" onClick={onCancel}>
            수정 취소
          </button>
        ) : null}
      </div>
    </form>
  );
}
