import { Fragment, useMemo, useState } from "react";

import type { MonthlyPlanItem } from "@/types/repayment";

type PaymentTableProps = {
  monthlyPlans: MonthlyPlanItem[];
};

type MonthlyGroup = {
  monthIndex: number;
  items: MonthlyPlanItem[];
  totalPayment: number;
  totalInterest: number;
  totalPrincipal: number;
  endingBalance: number;
};

function toCurrency(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function PaymentTable({ monthlyPlans }: PaymentTableProps) {
  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({});

  const monthlyGroups = useMemo<MonthlyGroup[]>(() => {
    const grouped = new Map<number, MonthlyPlanItem[]>();

    for (const item of monthlyPlans) {
      const group = grouped.get(item.monthIndex) ?? [];
      group.push(item);
      grouped.set(item.monthIndex, group);
    }

    return Array.from(grouped.entries())
      .sort((left, right) => left[0] - right[0])
      .map(([monthIndex, items]) => ({
        monthIndex,
        items,
        totalPayment: items.reduce((sum, item) => sum + item.paymentAmount, 0),
        totalInterest: items.reduce((sum, item) => sum + item.interestAmount, 0),
        totalPrincipal: items.reduce((sum, item) => sum + item.principalAmount, 0),
        endingBalance: items.reduce((sum, item) => sum + item.remainingBalance, 0),
      }));
  }, [monthlyPlans]);

  const lastMonth = monthlyGroups.at(-1)?.monthIndex;

  if (monthlyGroups.length === 0) {
    return <p className="muted">표시할 월별 상환 데이터가 없습니다.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>월</th>
            <th>총 납입액</th>
            <th>총 이자</th>
            <th>총 원금상환</th>
            <th>월말 잔액</th>
            <th>상세</th>
          </tr>
        </thead>
        <tbody>
          {monthlyGroups.map((group) => {
            const isExpanded = Boolean(expandedMonths[group.monthIndex]);
            const isFinalMonth = group.monthIndex === lastMonth;

            return (
              <Fragment key={`group-${group.monthIndex}`}>
                <tr key={`summary-${group.monthIndex}`} className={isFinalMonth ? "payoff-month" : ""}>
                  <td>{group.monthIndex}월</td>
                  <td>{toCurrency(group.totalPayment)}</td>
                  <td>{toCurrency(group.totalInterest)}</td>
                  <td>{toCurrency(group.totalPrincipal)}</td>
                  <td>{toCurrency(group.endingBalance)}</td>
                  <td>
                    <button
                      type="button"
                      className="small"
                      onClick={() =>
                        setExpandedMonths((prev) => ({ ...prev, [group.monthIndex]: !isExpanded }))
                      }
                      aria-expanded={isExpanded}
                      aria-controls={`month-detail-${group.monthIndex}`}
                    >
                      {isExpanded ? "접기" : "펼치기"}
                    </button>
                  </td>
                </tr>
                {isExpanded ? (
                  <tr id={`month-detail-${group.monthIndex}`} key={`detail-${group.monthIndex}`}>
                    <td colSpan={6}>
                      <table className="nested-table">
                        <thead>
                          <tr>
                            <th>채무</th>
                            <th>납입액</th>
                            <th>이자</th>
                            <th>원금상환</th>
                            <th>월말잔액</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((item, index) => (
                            <tr key={`${group.monthIndex}-${item.debtName}-${index}`}>
                              <td>{item.debtName}</td>
                              <td>{toCurrency(item.paymentAmount)}</td>
                              <td>{toCurrency(item.interestAmount)}</td>
                              <td>{toCurrency(item.principalAmount)}</td>
                              <td>{toCurrency(item.remainingBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
