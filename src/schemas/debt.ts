import { debtSchema, scenarioSchema } from "@/lib/validation/repayment-schema";

export { debtSchema, scenarioSchema };

export type DebtInput = Parameters<typeof debtSchema.parse>[0];
export type ScenarioInputSchema = Parameters<typeof scenarioSchema.parse>[0];
