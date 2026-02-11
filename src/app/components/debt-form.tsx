import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  validateDebtForm,
  type DebtFormErrors,
  type DebtFormField,
} from "@/lib/validation/debt-form-schema";

export type DebtFormValues = {
  name: string;
  balance: string;
  annualRatePercent: string;
  minimumPayment: string;
  maturityMonths: string;
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
    left.maturityMonths === right.maturityMonths &&
    left.prepaymentFeeRatePercent === right.prepaymentFeeRatePercent
  );
}

export function DebtForm({ mode, initialValues, onSubmit, onCancel }: DebtFormProps) {
  const [values, setValues] = useState<DebtFormValues>(initialValues);
  const [errors, setErrors] = useState<DebtFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<DebtFormField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
  }, [initialValues]);

  useEffect(() => {
    const hasTouchedField = Object.values(touched).some(Boolean);
    if (!hasTouchedField) {
      return;
    }

    const timeout = setTimeout(() => {
      const result = validateDebtForm(values);
      const nextErrors: DebtFormErrors = {};

      for (const key of Object.keys(touched) as DebtFormField[]) {
        if (touched[key] && result.errors[key]) {
          nextErrors[key] = result.errors[key];
        }
      }

      setErrors((prev) => ({ ...prev, ...nextErrors }));
    }, 300);

    return () => {
      clearTimeout(timeout);
    };
  }, [values, touched]);

  const isDirty = useMemo(() => !areEqual(values, initialValues), [values, initialValues]);
  function updateField<K extends keyof DebtFormValues>(field: K, value: DebtFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function markTouched(field: DebtFormField) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function getFieldError(field: DebtFormField): string | undefined {
    if (!(submitAttempted || touched[field])) {
      return undefined;
    }

    return errors[field];
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = validateDebtForm(values);
    setErrors(result.errors);
    setSubmitAttempted(true);

    if (!result.isValid) {
      return;
    }

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
          onBlur={() => markTouched("name")}
          placeholder="예: 신용대출A"
          aria-invalid={Boolean(getFieldError("name"))}
          aria-describedby={getFieldError("name") ? "debt-name-error" : undefined}
          required
        />
        {getFieldError("name") ? (
          <p id="debt-name-error" className="field-error" role="alert">
            {getFieldError("name")}
          </p>
        ) : null}
      </label>
      <label htmlFor="debt-balance">
        잔액(원) *
        <input
          id="debt-balance"
          type="number"
          value={values.balance}
          onChange={(event) => updateField("balance", event.target.value)}
          onBlur={() => markTouched("balance")}
          placeholder="5000000"
          aria-invalid={Boolean(getFieldError("balance"))}
          aria-describedby={getFieldError("balance") ? "debt-balance-error" : undefined}
          required
        />
        {getFieldError("balance") ? (
          <p id="debt-balance-error" className="field-error" role="alert">
            {getFieldError("balance")}
          </p>
        ) : null}
      </label>
      <label htmlFor="debt-rate">
        연이율(%) *
        <input
          id="debt-rate"
          type="number"
          step="0.01"
          value={values.annualRatePercent}
          onChange={(event) => updateField("annualRatePercent", event.target.value)}
          onBlur={() => markTouched("annualRatePercent")}
          placeholder="8.2"
          aria-invalid={Boolean(getFieldError("annualRatePercent"))}
          aria-describedby={getFieldError("annualRatePercent") ? "debt-rate-error" : undefined}
          required
        />
        {getFieldError("annualRatePercent") ? (
          <p id="debt-rate-error" className="field-error" role="alert">
            {getFieldError("annualRatePercent")}
          </p>
        ) : null}
      </label>
      <label htmlFor="debt-minimum-payment">
        최소납입액(원) *
        <input
          id="debt-minimum-payment"
          type="number"
          value={values.minimumPayment}
          onChange={(event) => updateField("minimumPayment", event.target.value)}
          onBlur={() => markTouched("minimumPayment")}
          placeholder="200000"
          aria-invalid={Boolean(getFieldError("minimumPayment"))}
          aria-describedby={getFieldError("minimumPayment") ? "debt-minimum-payment-error" : undefined}
          required
        />
        {getFieldError("minimumPayment") ? (
          <p id="debt-minimum-payment-error" className="field-error" role="alert">
            {getFieldError("minimumPayment")}
          </p>
        ) : null}
      </label>
      <label htmlFor="debt-maturity-months">
        만기 잔여 개월 수(선택)
        <input
          id="debt-maturity-months"
          type="number"
          min="1"
          step="1"
          value={values.maturityMonths}
          onChange={(event) => updateField("maturityMonths", event.target.value)}
          onBlur={() => markTouched("maturityMonths")}
          aria-invalid={Boolean(getFieldError("maturityMonths"))}
          aria-describedby={getFieldError("maturityMonths") ? "debt-maturity-months-error" : undefined}
          placeholder="예: 24"
        />
        {getFieldError("maturityMonths") ? (
          <p id="debt-maturity-months-error" className="field-error" role="alert">
            {getFieldError("maturityMonths")}
          </p>
        ) : null}
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
          onBlur={() => markTouched("prepaymentFeeRatePercent")}
          placeholder="1.0"
          aria-invalid={Boolean(getFieldError("prepaymentFeeRatePercent"))}
          aria-describedby={
            getFieldError("prepaymentFeeRatePercent")
              ? "debt-prepayment-fee-rate-error"
              : undefined
          }
        />
        {getFieldError("prepaymentFeeRatePercent") ? (
          <p id="debt-prepayment-fee-rate-error" className="field-error" role="alert">
            {getFieldError("prepaymentFeeRatePercent")}
          </p>
        ) : null}
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
