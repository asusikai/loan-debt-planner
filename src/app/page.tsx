"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
import { recommendLowestInterestStrategy } from "@/lib/repayment/recommendation";
import { calculateMinimumRequiredMonthlyBudget } from "@/lib/repayment/required-payment";
import type { EditableDebt, RecommendationResult, StrategyResult } from "@/types/repayment";

const initialDebts: EditableDebt[] = [];

const emptyForm: DebtFormValues = {
  name: "",
  balance: "",
  annualRatePercent: "",
  repaymentType: "equalInstallment",
  maturityMonths: "",
  graceMonths: "",
  prepaymentFeeRatePercent: "",
};

function toNumber(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return parsed;
}

function HomePageContent() {
  const { pushToast } = useToast();
  const { debts, setDebts, upsertDebt, removeDebt } = useDebts(initialDebts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusDebtId, setFocusDebtId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [extraPayment, setExtraPayment] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState<"avalanche" | "snowball">(
    "avalanche",
  );
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [debtPendingDeletion, setDebtPendingDeletion] = useState<EditableDebt | null>(null);
  const [deleteTriggerButton, setDeleteTriggerButton] = useState<HTMLButtonElement | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetTriggerButton, setResetTriggerButton] = useState<HTMLButtonElement | null>(null);
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
  }, [loadDebts, setDebts]);

  useEffect(() => {
    const storedBudgetConfig = loadBudgetConfig();
    if (!storedBudgetConfig) {
      return;
    }

    setExtraPayment(storedBudgetConfig.extraPayment);
  }, [loadBudgetConfig]);

  useEffect(() => {
    saveDebts(debts);
  }, [debts, saveDebts]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      saveBudgetConfig({ extraPayment });
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [extraPayment, saveBudgetConfig]);

  useEffect(() => {
    if (debts.length === 0) {
      clearBudgetConfig();
    }
  }, [debts.length, clearBudgetConfig]);

  useEffect(() => {
    if (!focusDebtId) {
      return;
    }

    const desktopAnchor = document.getElementById(`debt-anchor-${focusDebtId}`) as HTMLElement | null;
    const mobileAnchor = document.getElementById(`debt-anchor-mobile-${focusDebtId}`) as HTMLElement | null;
    const anchor = desktopAnchor ?? mobileAnchor;

    if (!anchor) {
      return;
    }

    anchor.scrollIntoView({ behavior: "smooth", block: "center" });
    anchor.focus();
    setFocusDebtId(null);
  }, [debts, focusDebtId]);

  const totalMinimum = useMemo(
    () => calculateMinimumRequiredMonthlyBudget(debts),
    [debts],
  );

  const activePlan =
    selectedStrategy === "avalanche"
      ? results?.avalanche.monthlyPlans
      : results?.snowball.monthlyPlans;
  const extraPaymentAmount = Math.floor(toNumber(extraPayment));
  const canCompareStrategies = debts.length > 0 && extraPaymentAmount >= 0;

  const editingDebt = useMemo(
    () => debts.find((debt) => debt.id === editingId) ?? null,
    [debts, editingId],
  );

  const formInitialValues = useMemo<DebtFormValues>(() => {
    if (formMode !== "edit" || !editingDebt) {
      return emptyForm;
    }

    return {
      name: editingDebt.name,
      balance: String(editingDebt.balance),
      annualRatePercent: (editingDebt.annualRate * 100).toFixed(2),
      repaymentType: editingDebt.repaymentType,
      maturityMonths: editingDebt.maturityMonths !== undefined ? String(editingDebt.maturityMonths) : "",
      graceMonths:
        editingDebt.repaymentType === "bullet"
          ? ""
          : editingDebt.graceMonths !== undefined
            ? String(editingDebt.graceMonths)
            : "",
      prepaymentFeeRatePercent:
        editingDebt.prepaymentFeeRate !== undefined
          ? (editingDebt.prepaymentFeeRate * 100).toFixed(2)
          : "",
    };
  }, [editingDebt, formMode]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setFormMode(null);
  }, []);

  const handleSubmitDebt = useCallback((formValues: DebtFormValues) => {
    const name = formValues.name.trim();
    const balance = Math.floor(toNumber(formValues.balance));
    const annualRatePercent = toNumber(formValues.annualRatePercent);
    const repaymentType = formValues.repaymentType;
    const maturityMonthsInput = formValues.maturityMonths.trim();
    const maturityMonths =
      maturityMonthsInput === "" ? undefined : Math.floor(toNumber(maturityMonthsInput));
    const graceMonthsInput = formValues.graceMonths.trim();
    const graceMonths = graceMonthsInput === "" ? undefined : Math.floor(toNumber(graceMonthsInput));
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

    if (balance <= 0 || annualRatePercent < 0) {
      setErrorMessage("잔액은 1 이상, 금리는 0 이상이어야 합니다.");
      pushToast("잔액/금리 입력을 확인해 주세요.", "warning");
      return;
    }

    if (repaymentType === "bullet" && maturityMonths === undefined) {
      setErrorMessage("원금만기일시상환은 만기 잔여 개월 수가 필요합니다.");
      pushToast("원금만기일시상환은 만기를 입력해 주세요.", "warning");
      return;
    }

    if (repaymentType === "bullet" && graceMonths !== undefined && graceMonths > 0) {
      setErrorMessage("원금만기일시상환은 거치 기간을 설정할 수 없습니다.");
      pushToast("원금만기일시상환에서는 거치 기간을 비워 주세요.", "warning");
      return;
    }

    if (graceMonths !== undefined && graceMonths < 0) {
      setErrorMessage("거치 기간은 0 이상이어야 합니다.");
      pushToast("거치 기간 입력을 확인해 주세요.", "warning");
      return;
    }

    if (maturityMonths !== undefined && graceMonths !== undefined && graceMonths >= maturityMonths) {
      setErrorMessage("거치 기간은 만기 잔여 개월 수보다 작아야 합니다.");
      pushToast("거치 기간/만기 입력을 확인해 주세요.", "warning");
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
      repaymentType,
      maturityMonths,
      graceMonths: repaymentType === "bullet" ? undefined : graceMonths,
      prepaymentFeeRate:
        prepaymentFeeRatePercent !== undefined
          ? prepaymentFeeRatePercent / 100
          : undefined,
    };

    const isCreating = editingId === null;

    upsertDebt(payload);
    if (isCreating) {
      setFocusDebtId(payload.id);
    }

    setErrorMessage("");
    resetForm();
  }, [editingId, pushToast, resetForm, upsertDebt]);

  const handleEditDebt = useCallback((id: string) => {
    const target = debts.find((debt) => debt.id === id);
    if (!target) {
      return;
    }

    setEditingId(target.id);
    setFormMode("edit");
    setErrorMessage("");
  }, [debts]);

  const requestDeleteDebt = useCallback((debt: EditableDebt, trigger: HTMLButtonElement) => {
    setDebtPendingDeletion(debt);
    setDeleteTriggerButton(trigger);
  }, []);

  const cancelDeleteDebt = useCallback(() => {
    setDebtPendingDeletion(null);
    setDeleteTriggerButton(null);
  }, []);

  const confirmDeleteDebt = useCallback(() => {
    if (!debtPendingDeletion) {
      return;
    }

    removeDebt(debtPendingDeletion.id);
    if (editingId === debtPendingDeletion.id) {
      setEditingId(null);
      setFormMode(null);
    }

    setDebtPendingDeletion(null);
    setDeleteTriggerButton(null);
  }, [debtPendingDeletion, editingId, removeDebt]);

  const handleAddDebt = useCallback(() => {
    setEditingId(null);
    setFormMode("create");
    setErrorMessage("");
  }, []);

  const executeResetState = useCallback(() => {
    setDebts(initialDebts);
    setFocusDebtId(null);
    setFormMode(null);
    setExtraPayment("");
    setResults(null);
    setRecommendation(null);
    setErrorMessage("");
    setDebtPendingDeletion(null);
    setDeleteTriggerButton(null);
    setErrorModal({ open: false, title: "", message: "" });
    clearBudgetConfig();
    pushToast("입력 상태가 초기화되었습니다.", "success");
  }, [clearBudgetConfig, pushToast, setDebts]);

  const requestResetState = useCallback((trigger: HTMLButtonElement) => {
    setResetTriggerButton(trigger);
    setIsResetConfirmOpen(true);
  }, []);

  const cancelResetState = useCallback(() => {
    setIsResetConfirmOpen(false);
  }, []);

  const confirmResetState = useCallback(() => {
    setIsResetConfirmOpen(false);
    executeResetState();
  }, [executeResetState]);

  const handleCalculate = useCallback(() => {
    try {
      if (debts.length === 0) {
        setErrorMessage("채무를 1개 이상 입력해 주세요.");
        pushToast("먼저 채무를 1개 이상 추가해 주세요.", "warning");
        setResults(null);
        setRecommendation(null);
        return;
      }

      if (extraPaymentAmount < 0) {
        setErrorMessage("추가 상환 금액은 0 이상이어야 합니다.");
        pushToast("추가 상환 금액을 확인해 주세요.", "warning");
        setResults(null);
        setRecommendation(null);
        return;
      }

      const scenario = {
        extraPayment: extraPaymentAmount,
        debts: debts.map(({ id: _, ...debt }) => debt),
      };

      const avalanche = simulateStrategy(scenario, "avalanche");
      const snowball = simulateStrategy(scenario, "snowball");
      const nextRecommendation = recommendLowestInterestStrategy({ avalanche, snowball });

      setResults({ avalanche, snowball });
      setRecommendation(nextRecommendation);
      setSelectedStrategy(nextRecommendation.strategy);
      setErrorMessage("");
      pushToast("전략 계산이 완료되었습니다.", "success");
    } catch (error) {
      setErrorMessage("시뮬레이션 중 오류가 발생했습니다.");
      pushToast("시뮬레이션 중 오류가 발생했습니다.", "error");
      setErrorModal({
        open: true,
        title: "오류 발생",
        message: "입력값을 확인한 뒤 다시 계산해 주세요.",
      });
      setResults(null);
      setRecommendation(null);
    }
  }, [debts, extraPaymentAmount, pushToast]);

  return (
    <main>
      <h1>DebtPilot</h1>
      <p className="muted">채무 입력 후 상환 전략을 비교해 총이자와 완납 기간을 확인하세요.</p>
      <button
        type="button"
        className="ghost small"
        onClick={(event) => requestResetState(event.currentTarget)}
      >
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
        <section className="card debt-section-card">
          <h2>채무 목록</h2>
          <DebtList
            debts={debts}
            onEdit={handleEditDebt}
            onDelete={requestDeleteDebt}
            onAddNew={handleAddDebt}
            focusDebtId={focusDebtId}
          />

          {formMode ? (
            <div className="debt-form-dropdown" style={{ marginTop: 16 }}>
              <div className="debt-form-dropdown-header">
                <h3>{formMode === "edit" ? "채무 수정" : "채무 추가"}</h3>
                <button type="button" className="ghost small" onClick={resetForm}>
                  닫기
                </button>
              </div>
              <DebtForm
                mode={formMode}
                initialValues={formInitialValues}
                onSubmit={handleSubmitDebt}
                onCancel={resetForm}
              />
            </div>
          ) : null}
        </section>

        <section className="card strategy-section-card">
          <h2>전략 결과</h2>
          <BudgetForm
            extraPayment={extraPayment}
            minimumRequired={totalMinimum}
            hasDebts={debts.length > 0}
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
                : "추가 상환 금액(0 이상)을 입력하면 활성화됩니다"
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
                recommendation={recommendation}
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
      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        title="상태 초기화 확인"
        description="모든 데이터가 초기화 됩니다"
        confirmLabel="예"
        cancelLabel="아니오"
        onConfirm={confirmResetState}
        onCancel={cancelResetState}
        restoreFocusTo={resetTriggerButton}
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
