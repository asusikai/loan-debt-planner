import { z } from "zod";

import type { DebtFormValues } from "@/app/components/debt-form";

const MAX_BALANCE = 999_999_999;

const requiredString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label}을(를) 입력해 주세요.`);

const optionalPercentString = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value === "") {
        return true;
      }

      const numberValue = Number(value);
      return Number.isFinite(numberValue) && numberValue >= 0 && numberValue <= 100;
    },
    { message: "중도상환수수료율은 0~100 사이여야 합니다." },
  );

const optionalDateString = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), {
    message: "유효한 날짜를 입력해 주세요.",
  });

export const debtFormSchema = z
  .object({
    name: requiredString("채무명").max(100, "채무명은 100자 이하여야 합니다."),
    balance: requiredString("잔액").refine((value) => {
      const numberValue = Number(value);
      return Number.isInteger(numberValue) && numberValue > 0 && numberValue <= MAX_BALANCE;
    }, "잔액은 1~999,999,999 사이 정수여야 합니다."),
    annualRatePercent: requiredString("연이율").refine((value) => {
      const numberValue = Number(value);
      return Number.isFinite(numberValue) && numberValue >= 0 && numberValue <= 100;
    }, "연이율은 0~100 사이 값이어야 합니다."),
    minimumPayment: requiredString("최소납입액").refine((value) => {
      const numberValue = Number(value);
      return Number.isInteger(numberValue) && numberValue > 0;
    }, "최소납입액은 1 이상 정수여야 합니다."),
    maturityDate: optionalDateString,
    prepaymentFeeRatePercent: optionalPercentString,
  })
  .superRefine((value, ctx) => {
    const balance = Number(value.balance);
    const minimumPayment = Number(value.minimumPayment);

    if (Number.isFinite(balance) && Number.isFinite(minimumPayment) && minimumPayment > balance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minimumPayment"],
        message: "최소납입액은 잔액보다 클 수 없습니다.",
      });
    }
  });

export type DebtFormField = keyof DebtFormValues;
export type DebtFormErrors = Partial<Record<DebtFormField, string>>;

export function validateDebtForm(values: DebtFormValues): {
  isValid: boolean;
  errors: DebtFormErrors;
} {
  const parsed = debtFormSchema.safeParse(values);

  if (parsed.success) {
    return { isValid: true, errors: {} };
  }

  const errors: DebtFormErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as DebtFormField] = issue.message;
    }
  }

  return { isValid: false, errors };
}

export function isPastMaturityDate(value: string): boolean {
  if (!value) {
    return false;
  }

  const selected = new Date(value);
  if (Number.isNaN(selected.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selected.setHours(0, 0, 0, 0);

  return selected < today;
}
