"use client";

import { useEffect, useMemo, useState } from "react";

import { ConfirmationDialog } from "@/app/components/confirmation-dialog";
import { BudgetForm } from "@/app/components/budget-form";
import { DebtList } from "@/app/components/debt-list";
import { DebtForm, type DebtFormValues } from "@/app/components/debt-form";
import { PaymentTable } from "@/app/components/payment-table";
import { StrategyComparison } from "@/app/components/strategy-comparison";
import { ErrorModal } from "@/components/common/error-modal";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { ToastProvider, useToast } from "@/components/common/toast";
import { useBudgetStorage } from "@/hooks/use-budget-storage";
import { useDebts } from "@/hooks/use-debts";
import { useDebtStorage } from "@/hooks/use-debt-storage";
import { simulateStrategy } from "@/lib/repayment/engine";
import type { EditableDebt, StrategyResult } from "@/types/repayment";

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
  maturityMonths: "",
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

function HomePageContent() {
  const { pushToast } = useToast();
  const { debts, setDebts, upsertDebt, removeDebt } = useDebts(initialDebts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState("700000");
  const [extraPayment, setExtraPayment] = useState("100000");
  const [selectedStrategy, setSelectedStrategy] = useState<"avalanche" | "snowball">(
    "avalanche",
  );
  const [debtPendingDeletion, setDebtPendingDeletion] = useState<EditableDebt | null>(null);
  const [deleteTriggerButton, setDeleteTriggerButton] = useState<HTMLButtonElement | null>(null);
  const [results, setResults] = useState<{
    avalanche: StrategyResult;
    snowball: StrategyResult;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  });
  const { loadBudgetConfig, saveBudgetConfig, clearBudgetConfig } = useBudgetStorage();
  const { storageWarning, clearStorageWarning, loadDebts, saveDebts } = useDebtStorage();

  useEffect(() => {
    const storedDebts = loadDebts();
    if (storedDebts.length > 0) {
    setDebts(storedDebts);
  }
  }, [loadDebts]);

  useEffect(() => {
    const storedBudgetConfig = loadBudgetConfig();
    if (!storedBudgetConfig) {
      return;
    }

    setMonthlyBudget(storedBudgetConfig.monthlyBudget);
    setExtraPayment(storedBudgetConfig.extraPayment);
  }, [loadBudgetConfig]);

  useEffect(() => {
    saveDebts(debts);
  }, [debts, saveDebts]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      saveBudgetConfig({ monthlyBudget, extraPayment });
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [monthlyBudget, extraPayment, saveBudgetConfig]);

  useEffect(() => {
    if (debts.length === 0) {
      clearBudgetConfig();
    }
  }, [debts.length, clearBudgetConfig]);

  const totalMinimum = useMemo(
    () => debts.reduce((sum, debt) => sum + debt.minimumPayment, 0),
    [debts],
  );

  const activePlan =
    selectedStrategy === "avalanche"
      ? results?.avalanche.monthlyPlans
      : results?.snowball.monthlyPlans;
  const monthlyBudgetAmount = Math.floor(toNumber(monthlyBudget));
  const canCompareStrategies = debts.length > 0 && monthlyBudgetAmount >= totalMinimum;

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
      maturityMonths: editingDebt.maturityMonths !== undefined ? String(editingDebt.maturityMonths) : "",
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
    const maturityMonthsInput = formValues.maturityMonths.trim();
    const maturityMonths =
      maturityMonthsInput === "" ? undefined : Math.floor(toNumber(maturityMonthsInput));
    const prepaymentFeeRatePercentInput = formValues.prepaymentFeeRatePercent.trim();
    const prepaymentFeeRatePercent =
      prepaymentFeeRatePercentInput === ""
        ? undefined
        : toNumber(prepaymentFeeRatePercentInput);

    if (!name) {
      setErrorMessage("채무명은 필수입니다.");
      pushToast("채무명은 필수입니다.", "warning");
      return;
    }

    if (balance <= 0 || annualRatePercent < 0 || minimumPayment < 0) {
      setErrorMessage("잔액은 1 이상, 금리/최소납입액은 0 이상이어야 합니다.");
      pushToast("잔액/금리/최소납입액 입력을 확인해 주세요.", "warning");
      return;
    }

    if (prepaymentFeeRatePercent !== undefined && prepaymentFeeRatePercent < 0) {
      setErrorMessage("중도상환수수료율은 0 이상이어야 합니다.");
      pushToast("중도상환수수료율은 0 이상이어야 합니다.", "warning");
      return;
    }

    const payload: EditableDebt = {
      id: editingId ?? `debt-${Date.now()}`,
      name,
      balance,
      annualRate: annualRatePercent / 100,
      minimumPayment,
      maturityMonths,
      prepaymentFeeRate:
        prepaymentFeeRatePercent !== undefined
          ? prepaymentFeeRatePercent / 100
          : undefined,
    };

    upsertDebt(payload);

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

  function requestDeleteDebt(debt: EditableDebt, trigger: HTMLButtonElement) {
    setDebtPendingDeletion(debt);
    setDeleteTriggerButton(trigger);
  }

  function cancelDeleteDebt() {
    setDebtPendingDeletion(null);
    setDeleteTriggerButton(null);
  }

  function confirmDeleteDebt() {
    if (!debtPendingDeletion) {
      return;
    }

    removeDebt(debtPendingDeletion.id);
    if (editingId === debtPendingDeletion.id) {
      resetForm();
    }

    setDebtPendingDeletion(null);
    setDeleteTriggerButton(null);
  }

  function handleAddDebt() {
    resetForm();
    setErrorMessage("");
  }

  function handleResetState() {
    setDebts(initialDebts);
    setMonthlyBudget("700000");
    setExtraPayment("100000");
    setResults(null);
    setErrorMessage("");
    setDebtPendingDeletion(null);
    setDeleteTriggerButton(null);
    setErrorModal({ open: false, title: "", message: "" });
    clearBudgetConfig();
    pushToast("입력 상태가 초기화되었습니다.", "success");
  }

  function handleCalculate() {
    try {
      if (!canCompareStrategies) {
        setErrorMessage("예산이 최소납입 합계를 충족해야 결과 계산이 가능합니다.");
        pushToast("월 예산이 최소납입 합계를 충족해야 합니다.", "warning");
        setErrorModal({
          open: true,
          title: "예산 부족",
          message: `월 예산을 최소 ${toCurrency(totalMinimum)} 이상으로 설정해 주세요.`,
        });
        setResults(null);
        return;
      }

      if (debts.length === 0) {
        setErrorMessage("채무를 1개 이상 입력해 주세요.");
        pushToast("먼저 채무를 1개 이상 추가해 주세요.", "warning");
        setResults(null);
        return;
      }

      const scenario = {
        monthlyBudget: monthlyBudgetAmount,
        extraPayment: Math.floor(toNumber(extraPayment)),
        debts: debts.map(({ id: _, ...debt }) => debt),
      };

      const avalanche = simulateStrategy(scenario, "avalanche");
      const snowball = simulateStrategy(scenario, "snowball");

      setResults({ avalanche, snowball });
      setErrorMessage("");
      pushToast("전략 계산이 완료되었습니다.", "success");
    } catch (error) {
      if (error instanceof Error && error.message === "BUDGET_BELOW_MINIMUM") {
        setErrorMessage(
          `월 상환 예산이 최소납입 합계(${toCurrency(totalMinimum)})보다 작습니다.`,
        );
        pushToast("월 상환 예산이 부족합니다.", "error");
        setErrorModal({
          open: true,
          title: "계산 불가",
          message: `월 상환 예산을 최소 ${toCurrency(totalMinimum)} 이상으로 입력해 주세요.`,
        });
      } else {
        setErrorMessage("시뮬레이션 중 오류가 발생했습니다.");
        pushToast("시뮬레이션 중 오류가 발생했습니다.", "error");
        setErrorModal({
          open: true,
          title: "오류 발생",
          message: "입력값을 확인한 뒤 다시 계산해 주세요.",
        });
      }
      setResults(null);
    }
  }

  return (
    <main>
      <h1>DebtPilot</h1>
      <p className="muted">채무 입력 후 상환 전략을 비교해 총이자와 완납 기간을 확인하세요.</p>
      <button type="button" className="ghost small" onClick={handleResetState}>
        상태 초기화
      </button>
      {storageWarning ? (
        <p className="storage-warning" role="status">
          {storageWarning}
          <button type="button" className="ghost small" onClick={clearStorageWarning}>
            닫기
          </button>
        </p>
      ) : null}

      <div className="layout-grid">
        <section className="card">
          <h2>채무 입력/수정/삭제</h2>
          <DebtForm
            mode={editingId ? "edit" : "create"}
            initialValues={formInitialValues}
            onSubmit={handleSubmitDebt}
            onCancel={resetForm}
          />

          <DebtList
            debts={debts}
            onEdit={handleEditDebt}
            onDelete={requestDeleteDebt}
            onAddNew={handleAddDebt}
          />
        </section>

        <section className="card">
          <h2>전략 결과</h2>
          <BudgetForm
            monthlyBudget={monthlyBudget}
            extraPayment={extraPayment}
            minimumRequired={totalMinimum}
            hasDebts={debts.length > 0}
            onChangeMonthlyBudget={setMonthlyBudget}
            onChangeExtraPayment={setExtraPayment}
          />
          <button
            type="button"
            onClick={handleCalculate}
            style={{ marginTop: 10 }}
            disabled={!canCompareStrategies}
            aria-disabled={!canCompareStrategies}
            title={
              canCompareStrategies
                ? ""
                : "최소납입 합계를 충족하는 예산을 입력하면 활성화됩니다"
            }
          >
            결과 계산
          </button>

          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

          {results ? (
            <>
              <StrategyComparison
                results={results}
                selectedStrategy={selectedStrategy}
                onSelectStrategy={setSelectedStrategy}
              />
              <div id="strategy-plan-table">
                <PaymentTable monthlyPlans={activePlan?.slice(0, 120) ?? []} />
              </div>
            </>
          ) : (
            <p className="muted result-empty">결과 계산을 실행하면 전략 비교 카드와 월별표가 표시됩니다.</p>
          )}
        </section>
      </div>
      <ConfirmationDialog
        isOpen={Boolean(debtPendingDeletion)}
        title="채무 삭제 확인"
        description={
          debtPendingDeletion
            ? `정말로 ${debtPendingDeletion.name} 채무를 삭제하시겠습니까?`
            : ""
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={confirmDeleteDebt}
        onCancel={cancelDeleteDebt}
        restoreFocusTo={deleteTriggerButton}
      />
      <ErrorModal
        open={errorModal.open}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal((prev) => ({ ...prev, open: false }))}
      />
    </main>
  );
}

export default function HomePage() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <HomePageContent />
      </ErrorBoundary>
    </ToastProvider>
  );
}
