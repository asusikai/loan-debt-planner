import { useCallback, useState } from "react";

import type { EditableDebt } from "@/types/repayment";

export function useDebts(initialDebts: EditableDebt[]) {
  const [debts, setDebts] = useState<EditableDebt[]>(initialDebts);

  const upsertDebt = useCallback((debt: EditableDebt) => {
    setDebts((prev) => {
      const index = prev.findIndex((item) => item.id === debt.id);
      if (index < 0) {
        return [...prev, debt];
      }

      const next = [...prev];
      next[index] = debt;
      return next;
    });
  }, []);

  const removeDebt = useCallback((id: string) => {
    setDebts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    debts,
    setDebts,
    upsertDebt,
    removeDebt,
  };
}
