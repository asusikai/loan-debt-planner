import { useCallback, useState } from "react";

import type { EditableDebt } from "@/types/repayment";

const STORAGE_KEY = "debtpilot_debts";

function normalizeEditableDebt(value: unknown): EditableDebt | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const debt = value as Partial<EditableDebt>;
  if (
    typeof debt.id !== "string" ||
    typeof debt.name !== "string" ||
    typeof debt.balance !== "number" ||
    typeof debt.annualRate !== "number"
  ) {
    return null;
  }

  const repaymentType =
    debt.repaymentType === "bullet" ||
    debt.repaymentType === "equalPrincipal" ||
    debt.repaymentType === "equalInstallment"
      ? debt.repaymentType
      : "equalInstallment";

  return {
    id: debt.id,
    name: debt.name,
    balance: debt.balance,
    annualRate: debt.annualRate,
    repaymentType,
    maturityMonths: typeof debt.maturityMonths === "number" ? debt.maturityMonths : undefined,
    prepaymentFeeRate: typeof debt.prepaymentFeeRate === "number" ? debt.prepaymentFeeRate : undefined,
    feeExemptionMonths: typeof debt.feeExemptionMonths === "number" ? debt.feeExemptionMonths : undefined,
  };
}

export function useDebtStorage() {
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  const clearStorageWarning = useCallback(() => {
    setStorageWarning(null);
  }, []);

  const loadDebts = useCallback((): EditableDebt[] => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error("invalid debt storage format");
      }

      return parsed
        .map((item) => normalizeEditableDebt(item))
        .filter((item): item is EditableDebt => item !== null);
    } catch (error) {
      console.warn("[DebtStorage] load failed", error);
      setStorageWarning("저장된 채무 데이터를 불러오지 못했습니다. 기본 상태로 시작합니다.");
      return [];
    }
  }, []);

  const saveDebts = useCallback((debts: EditableDebt[]): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(debts));
      setStorageWarning(null);
      return true;
    } catch (error) {
      console.warn("[DebtStorage] save failed", error);
      setStorageWarning("브라우저 저장소에 저장하지 못했습니다. 새로고침 시 데이터가 사라질 수 있습니다.");
      return false;
    }
  }, []);

  const deleteDebt = useCallback(
    (debtId: string, debts: EditableDebt[]): EditableDebt[] => {
      const next = debts.filter((debt) => debt.id !== debtId);
      saveDebts(next);
      return next;
    },
    [saveDebts],
  );

  return {
    storageWarning,
    clearStorageWarning,
    loadDebts,
    saveDebts,
    deleteDebt,
  };
}
