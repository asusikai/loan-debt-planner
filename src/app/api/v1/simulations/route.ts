import { NextResponse } from "next/server";

import { simulateStrategy } from "@/lib/repayment/engine";
import { scenarioSchema } from "@/lib/validation/repayment-schema";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = scenarioSchema.parse(payload);

    const avalanche = simulateStrategy(parsed, "avalanche");
    const snowball = simulateStrategy(parsed, "snowball");

    return NextResponse.json(
      {
        simulationId: `sim_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        results: {
          avalanche: {
            totalInterest: avalanche.totalInterest,
            monthsToPayoff: avalanche.monthsToPayoff,
          },
          snowball: {
            totalInterest: snowball.totalInterest,
            monthsToPayoff: snowball.monthsToPayoff,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 400 },
    );
  }
}
