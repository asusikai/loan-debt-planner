import { z } from "zod";

export const budgetFormSchema = z
  .object({
    monthlyBudget: z.string(),
    extraPayment: z.string(),
    minimumRequired: z.number().nonnegative(),
    hasDebts: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const budget = Number(value.monthlyBudget || "0");
    const extra = Number(value.extraPayment || "0");

    if (!Number.isFinite(budget) || budget < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["monthlyBudget"],
        message: "월 예산은 0 이상 숫자여야 합니다.",
      });
    }

    if (!Number.isFinite(extra) || extra < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["extraPayment"],
        message: "추가 상환 금액은 0 이상이어야 합니다.",
      });
    }

    if (value.hasDebts && Number.isFinite(budget) && budget < value.minimumRequired) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["monthlyBudget"],
        message: "예산이 월 필수납입 합계보다 작습니다.",
      });
    }
  });
