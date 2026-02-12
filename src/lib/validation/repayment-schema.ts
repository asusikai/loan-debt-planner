import { z } from "zod";

import { calculateMinimumRequiredMonthlyBudget } from "@/lib/repayment/required-payment";

export const debtSchema = z.object({
  name: z.string().min(1),
  balance: z.number().int().nonnegative(),
  annualRate: z.number().min(0),
  repaymentType: z.enum(["bullet", "equalPrincipal", "equalInstallment"]),
  prepaymentFeeRate: z.number().min(0).optional().default(0),
  feeExemptionMonths: z.number().int().nonnegative().optional().default(0),
  maturityMonths: z.number().int().positive().optional(),
}).superRefine((value, ctx) => {
  if (value.repaymentType === "bullet" && value.maturityMonths === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["maturityMonths"],
      message: "원금만기일시상환은 만기 잔여 개월 수가 필요합니다.",
    });
  }
});

export const scenarioSchema = z
  .object({
    monthlyBudget: z.number().int().nonnegative(),
    extraPayment: z.number().int().nonnegative(),
    debts: z.array(debtSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const minimumRequired = calculateMinimumRequiredMonthlyBudget(value.debts);
    if (value.monthlyBudget < minimumRequired) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `monthlyBudget must be >= minimum required ${minimumRequired}`,
      });
    }
  });
