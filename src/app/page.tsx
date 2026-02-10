"use client";

import { useMemo, useState } from "react";

import { DebtForm, type DebtFormValues } from "@/app/components/debt-form";
import { simulateStrategy } from "@/lib/repayment/engine";
import type { Debt, StrategyResult } from "@/types/repayment";

type EditableDebt = Debt & { id: string };

const initialDebts: EditableDebt[] = [
  {
    id: "debt-1",
    name: "신용대출A",
    balance: 5000000,
    annualRate: 0.082,
    minimumPayment: 200000,
  },
  {
    id: "debt-2",
    name: "카드리볼빙",
    balance: 1200000,
    annualRate: 0.149,
    minimumPayment: 120000,
  },
];

const emptyForm: DebtFormValues = {
  name: "",
  balance: "",
  annualRatePercent: "",
  minimumPayment: "",
  maturityDate: "",
  prepaymentFeeRatePercent: "",
};

function toNumber(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return parsed;
}

function toCurrency(value: number): string {
  return `${value.toLocaleString()}원`;
}

export default function HomePage() {
  const [debts, setDebts] = useState<EditableDebt[]>(initialDebts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState("700000");
  const [extraPayment, setExtraPayment] = useState("100000");
  const [selectedStrategy, setSelectedStrategy] = useState<"avalanche" | "snowball">(
    "avalanche",
  );
  const [results, setResults] = useState<{
    avalanche: StrategyResult;
    snowball: StrategyResult;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const totalMinimum = useMemo(
    () => debts.reduce((sum, debt) => sum + debt.minimumPayment, 0),
    [debts],
  );

  const activePlan =
    selectedStrategy === "avalanche"
      ? results?.avalanche.monthlyPlans
      : results?.snowball.monthlyPlans;

  const editingDebt = useMemo(
    () => debts.find((debt) => debt.id === editingId) ?? null,
    [debts, editingId],
  );

  const formInitialValues = useMemo<DebtFormValues>(() => {
    if (!editingDebt) {
      return emptyForm;
    }

    return {
      name: editingDebt.name,
      balance: String(editingDebt.balance),
      annualRatePercent: (editingDebt.annualRate * 100).toFixed(2),
      minimumPayment: String(editingDebt.minimumPayment),
      maturityDate: editingDebt.maturityDate ?? "",
      prepaymentFeeRatePercent:
        editingDebt.prepaymentFeeRate !== undefined
          ? (editingDebt.prepaymentFeeRate * 100).toFixed(2)
          : "",
    };
  }, [editingDebt]);

  function resetForm() {
    setEditingId(null);
  }

  function handleSubmitDebt(formValues: DebtFormValues) {
    const name = formValues.name.trim();
    const balance = Math.floor(toNumber(formValues.balance));
    const annualRatePercent = toNumber(formValues.annualRatePercent);
    const minimumPayment = Math.floor(toNumber(formValues.minimumPayment));
    const maturityDate = formValues.maturityDate.trim();
    const prepaymentFeeRatePercentInput = formValues.prepaymentFeeRatePercent.trim();
    const prepaymentFeeRatePercent =
      prepaymentFeeRatePercentInput === ""
        ? undefined
        : toNumber(prepaymentFeeRatePercentInput);

    if (!name) {
      setErrorMessage("채무명은 필수입니다.");
      return;
    }

    if (balance <= 0 || annualRatePercent < 0 || minimumPayment < 0) {
      setErrorMessage("잔액은 1 이상, 금리/최소납입액은 0 이상이어야 합니다.");
      return;
    }

    if (prepaymentFeeRatePercent !== undefined && prepaymentFeeRatePercent < 0) {
      setErrorMessage("중도상환수수료율은 0 이상이어야 합니다.");
      return;
    }

    const payload: EditableDebt = {
      id: editingId ?? `debt-${Date.now()}`,
      name,
      balance,
      annualRate: annualRatePercent / 100,
      minimumPayment,
      maturityDate: maturityDate || undefined,
      prepaymentFeeRate:
        prepaymentFeeRatePercent !== undefined
          ? prepaymentFeeRatePercent / 100
          : undefined,
    };

    setDebts((prev) => {
      if (editingId) {
        return prev.map((debt) => (debt.id === editingId ? payload : debt));
      }
      return [...prev, payload];
    });

    setErrorMessage("");
    resetForm();
  }

  function handleEditDebt(id: string) {
    const target = debts.find((debt) => debt.id === id);
    if (!target) {
      return;
    }

    setEditingId(target.id);
    setErrorMessage("");
  }

  function handleDeleteDebt(id: string) {
    setDebts((prev) => prev.filter((debt) => debt.id !== id));
    if (editingId === id) {
      resetForm();
    }
  }

  function handleCalculate() {
    try {
      if (debts.length === 0) {
        setErrorMessage("채무를 1개 이상 입력해 주세요.");
        setResults(null);
        return;
      }

      const scenario = {
        monthlyBudget: Math.floor(toNumber(monthlyBudget)),
        extraPayment: Math.floor(toNumber(extraPayment)),
        debts: debts.map(({ id: _, ...debt }) => debt),
      };

      const avalanche = simulateStrategy(scenario, "avalanche");
      const snowball = simulateStrategy(scenario, "snowball");

      setResults({ avalanche, snowball });
      setErrorMessage("");
    } catch (error) {
      if (error instanceof Error && error.message === "BUDGET_BELOW_MINIMUM") {
        setErrorMessage(
          `월 상환 예산이 최소납입 합계(${toCurrency(totalMinimum)})보다 작습니다.`,
        );
      } else {
        setErrorMessage("시뮬레이션 중 오류가 발생했습니다.");
      }
      setResults(null);
    }
  }

  return (
    <main>
      <h1>DebtPilot</h1>
      <p className="muted">채무 입력 후 상환 전략을 비교해 총이자와 완납 기간을 확인하세요.</p>

      <div className="layout-grid">
        <section className="card">
          <h2>채무 입력/수정/삭제</h2>
          <DebtForm
            mode={editingId ? "edit" : "create"}
            initialValues={formInitialValues}
            onSubmit={handleSubmitDebt}
            onCancel={resetForm}
          />

          <div className="table-wrap" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>채무명</th>
                  <th>잔액</th>
                  <th>연이율</th>
                  <th>최소납입액</th>
                  <th>만기</th>
                  <th>중도상환수수료율</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {debts.length === 0 ? (
                  <tr>
                    <td colSpan={7}>채무가 없습니다.</td>
                  </tr>
                ) : (
                  debts.map((debt) => (
                    <tr key={debt.id}>
                      <td>{debt.name}</td>
                      <td>{toCurrency(debt.balance)}</td>
                      <td>{(debt.annualRate * 100).toFixed(2)}%</td>
                      <td>{toCurrency(debt.minimumPayment)}</td>
                      <td>{debt.maturityDate ?? "-"}</td>
                      <td>
                        {debt.prepaymentFeeRate !== undefined
                          ? `${(debt.prepaymentFeeRate * 100).toFixed(2)}%`
                          : "-"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="small"
                          onClick={() => handleEditDebt(debt.id)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="small danger"
                          onClick={() => handleDeleteDebt(debt.id)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h2>전략 결과</h2>
          <div className="budget-grid">
            <label>
              월 상환 예산(원)
              <input
                type="number"
                value={monthlyBudget}
                onChange={(event) => setMonthlyBudget(event.target.value)}
              />
            </label>
            <label>
              추가 상환(원)
              <input
                type="number"
                value={extraPayment}
                onChange={(event) => setExtraPayment(event.target.value)}
              />
            </label>
          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            최소납입 합계: {toCurrency(totalMinimum)}
          </p>
          <button type="button" onClick={handleCalculate} style={{ marginTop: 10 }}>
            결과 계산
          </button>

          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

          {results ? (
            <>
              <div className="result-cards">
                <article className="result-card">
                  <h3>Avalanche</h3>
                  <p>총이자: {toCurrency(results.avalanche.totalInterest)}</p>
                  <p>완납 개월: {results.avalanche.monthsToPayoff}개월</p>
                </article>
                <article className="result-card">
                  <h3>Snowball</h3>
                  <p>총이자: {toCurrency(results.snowball.totalInterest)}</p>
                  <p>완납 개월: {results.snowball.monthsToPayoff}개월</p>
                </article>
              </div>

              <div className="strategy-tabs">
                <button
                  type="button"
                  className={selectedStrategy === "avalanche" ? "active" : ""}
                  onClick={() => setSelectedStrategy("avalanche")}
                >
                  Avalanche 월별표
                </button>
                <button
                  type="button"
                  className={selectedStrategy === "snowball" ? "active" : ""}
                  onClick={() => setSelectedStrategy("snowball")}
                >
                  Snowball 월별표
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>월</th>
                      <th>채무</th>
                      <th>납입액</th>
                      <th>이자</th>
                      <th>원금상환</th>
                      <th>월말잔액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePlan?.slice(0, 120).map((item, index) => (
                      <tr key={`${item.monthIndex}-${item.debtName}-${index}`}>
                        <td>{item.monthIndex}</td>
                        <td>{item.debtName}</td>
                        <td>{toCurrency(item.paymentAmount)}</td>
                        <td>{toCurrency(item.interestAmount)}</td>
                        <td>{toCurrency(item.principalAmount)}</td>
                        <td>{toCurrency(item.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
