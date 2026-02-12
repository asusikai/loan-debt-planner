import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ReactNode } from "react";

import {
  validateDebtForm,
  type DebtFormErrors,
  type DebtFormField,
} from "@/lib/validation/debt-form-schema";
import type { RepaymentType } from "@/types/repayment";

export type DebtFormValues = {
  name: string;
  balance: string;
  annualRatePercent: string;
  repaymentType: RepaymentType;
  maturityMonths: string;
  graceMonths: string;
  prepaymentFeeRatePercent: string;
};

type DebtFormProps = {
  mode: "create" | "edit";
  initialValues: DebtFormValues;
  onSubmit: (values: DebtFormValues) => void;
  onCancel: () => void;
};

function FieldHelpTooltip({ id, label, content }: { id: string; label: string; content: ReactNode }) {
  return (
    <span className="help-tooltip-wrap">
      <button
        type="button"
        className="help-tooltip-trigger"
        aria-label={label}
        aria-describedby={id}
      >
        ?
      </button>
      <span id={id} role="tooltip" className="help-tooltip-content">
        {content}
      </span>
    </span>
  );
}

function areEqual(left: DebtFormValues, right: DebtFormValues): boolean {
  return (
    left.name === right.name &&
    left.balance === right.balance &&
    left.annualRatePercent === right.annualRatePercent &&
    left.repaymentType === right.repaymentType &&
    left.maturityMonths === right.maturityMonths &&
    left.graceMonths === right.graceMonths &&
    left.prepaymentFeeRatePercent === right.prepaymentFeeRatePercent
  );
}

export function DebtForm({ mode, initialValues, onSubmit, onCancel }: DebtFormProps) {
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const balanceInputRef = useRef<HTMLInputElement | null>(null);
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
    if (mode === "edit") {
      balanceInputRef.current?.focus();
      balanceInputRef.current?.select();
      return;
    }

    nameInputRef.current?.focus();
  }, [mode, initialValues]);

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
          ref={nameInputRef}
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
          ref={balanceInputRef}
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
      <label htmlFor="debt-repayment-type">
        <span className="label-row">
          <span>상환 방식 *</span>
          <FieldHelpTooltip
            id="debt-repayment-help"
            label="원리금균등상환 설명보기"
            content={
              <>
                원리금균등상환: 매월 총 납입액이 거의 같습니다.
                <br />
                원금균등상환: 매월 상환 원금이 같아 시간이 지날수록 납입액이 줄어듭니다.
                <br />
                원금만기일시상환: 만기 전에는 이자 중심으로 납부하고 만기에 원금을 일시 상환합니다.
              </>
            }
          />
        </span>
        <select
          id="debt-repayment-type"
          value={values.repaymentType}
          onChange={(event) => {
            const nextType = event.target.value as RepaymentType;
            updateField("repaymentType", nextType);
            if (nextType === "bullet") {
              updateField("graceMonths", "");
            }
          }}
          onBlur={() => markTouched("repaymentType")}
          aria-invalid={Boolean(getFieldError("repaymentType"))}
          aria-describedby={getFieldError("repaymentType") ? "debt-repayment-type-error" : undefined}
          required
        >
          <option value="equalInstallment">원리금균등상환</option>
          <option value="equalPrincipal">원금균등상환</option>
          <option value="bullet">원금만기일시상환</option>
        </select>
        {getFieldError("repaymentType") ? (
          <p id="debt-repayment-type-error" className="field-error" role="alert">
            {getFieldError("repaymentType")}
          </p>
        ) : null}
      </label>
      <label htmlFor="debt-maturity-months">
        만기 잔여 개월 수(원금만기일시 선택 시 필수)
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
      <label htmlFor="debt-grace-months">
        거치 기간(개월, 선택)
        <input
          id="debt-grace-months"
          type="number"
          min="0"
          step="1"
          value={values.graceMonths}
          onChange={(event) => updateField("graceMonths", event.target.value)}
          onBlur={() => markTouched("graceMonths")}
          disabled={values.repaymentType === "bullet"}
          aria-invalid={Boolean(getFieldError("graceMonths"))}
          aria-describedby={getFieldError("graceMonths") ? "debt-grace-months-error" : undefined}
          placeholder="예: 6"
        />
        {values.repaymentType === "bullet" ? (
          <p className="field-warning">원금만기일시상환은 거치 기간을 설정할 수 없습니다.</p>
        ) : null}
        {getFieldError("graceMonths") ? (
          <p id="debt-grace-months-error" className="field-error" role="alert">
            {getFieldError("graceMonths")}
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
