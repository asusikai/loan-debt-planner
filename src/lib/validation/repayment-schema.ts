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
  graceMonths: z.number().int().nonnegative().optional().default(0),
}).superRefine((value, ctx) => {
  if (value.repaymentType === "bullet" && value.maturityMonths === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["maturityMonths"],
      message: "원금만기일시상환은 만기 잔여 개월 수가 필요합니다.",
    });
  }

  if (value.repaymentType === "bullet" && value.graceMonths > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["graceMonths"],
      message: "원금만기일시상환은 거치 기간을 설정할 수 없습니다.",
    });
  }

  if (value.maturityMonths !== undefined && value.graceMonths >= value.maturityMonths) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["graceMonths"],
      message: "거치 기간은 만기 잔여 개월 수보다 작아야 합니다.",
    });
  }
});

export const scenarioSchema = z
  .object({
    extraPayment: z.number().int().nonnegative(),
    debts: z.array(debtSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const minimumRequired = calculateMinimumRequiredMonthlyBudget(value.debts);
    if (!Number.isFinite(minimumRequired) || minimumRequired < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "invalid required payment calculation",
      });
    }
  });
