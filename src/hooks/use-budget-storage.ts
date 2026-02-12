import { useCallback } from "react";

const STORAGE_KEY = "debtpilot_budget_config";

type BudgetConfig = {
  extraPayment: string;
};

type LegacyBudgetConfig = {
  monthlyBudget?: string;
  extraPayment?: string;
};

function isValidNumberString(value: string): boolean {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
}

export function useBudgetStorage() {
  const loadBudgetConfig = useCallback((): BudgetConfig | null => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as LegacyBudgetConfig;
      if (typeof parsed.extraPayment !== "string") {
        throw new Error("invalid budget storage format");
      }

      if (!isValidNumberString(parsed.extraPayment)) {
        throw new Error("invalid budget values");
      }

      return {
        extraPayment: parsed.extraPayment,
      };
    } catch (error) {
      console.warn("[BudgetStorage] load failed", error);
      return null;
    }
  }, []);

  const saveBudgetConfig = useCallback((config: BudgetConfig): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      return true;
    } catch (error) {
      console.warn("[BudgetStorage] save failed", error);
      return false;
    }
  }, []);

  const clearBudgetConfig = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("[BudgetStorage] clear failed", error);
    }
  }, []);

  return {
    loadBudgetConfig,
    saveBudgetConfig,
    clearBudgetConfig,
  };
}
