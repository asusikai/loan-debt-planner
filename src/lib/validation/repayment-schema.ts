import { z } from "zod";

export const debtSchema = z.object({
  name: z.string().min(1),
  balance: z.number().int().nonnegative(),
  annualRate: z.number().min(0),
  minimumPayment: z.number().int().nonnegative(),
  prepaymentFeeRate: z.number().min(0).optional().default(0),
  maturityMonths: z.number().int().positive().optional(),
});

export const scenarioSchema = z
  .object({
    monthlyBudget: z.number().int().nonnegative(),
    extraPayment: z.number().int().nonnegative(),
    debts: z.array(debtSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const minimumRequired = value.debts.reduce(
      (sum, debt) => sum + debt.minimumPayment,
      0,
    );
    if (value.monthlyBudget < minimumRequired) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `monthlyBudget must be >= minimum required ${minimumRequired}`,
      });
    }
  });
