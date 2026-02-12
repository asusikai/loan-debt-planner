import { z } from "zod";

export const budgetFormSchema = z
  .object({
    extraPayment: z.string(),
    hasDebts: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const extra = Number(value.extraPayment || "0");

    if (!Number.isFinite(extra) || extra < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["extraPayment"],
        message: "추가 상환 금액은 0 이상이어야 합니다.",
      });
    }

  });
