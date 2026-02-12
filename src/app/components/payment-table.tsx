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
  cumulativeInterest: number;
  paidOffDebts: string[];
};

type RangeMode = "paged" | "first12" | "last12" | "all";

const PAGE_SIZE = 12;

function toCurrency(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function PaymentTable({ monthlyPlans }: PaymentTableProps) {
  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({});
  const [rangeMode, setRangeMode] = useState<RangeMode>("paged");
  const [currentPage, setCurrentPage] = useState(1);

  const monthlyGroups = useMemo<MonthlyGroup[]>(() => {
    const grouped = new Map<number, MonthlyPlanItem[]>();

    for (const item of monthlyPlans) {
      const group = grouped.get(item.monthIndex) ?? [];
      group.push(item);
      grouped.set(item.monthIndex, group);
    }

    const sorted = Array.from(grouped.entries())
      .sort((left, right) => left[0] - right[0])
      .map(([monthIndex, items]) => ({
        monthIndex,
        items,
        totalPayment: items.reduce((sum, item) => sum + item.paymentAmount, 0),
        totalInterest: items.reduce((sum, item) => sum + item.interestAmount, 0),
        totalPrincipal: items.reduce((sum, item) => sum + item.principalAmount, 0),
        endingBalance: items.reduce((sum, item) => sum + item.remainingBalance, 0),
        cumulativeInterest: 0,
        paidOffDebts: items
          .filter((item) => item.remainingBalance === 0 && item.paymentAmount > 0)
          .map((item) => item.debtName),
      }));

    let runningInterest = 0;
    return sorted.map((group) => {
      runningInterest += group.totalInterest;
      return { ...group, cumulativeInterest: runningInterest };
    });
  }, [monthlyPlans]);

  const lastMonth = monthlyGroups.at(-1)?.monthIndex;
  const totalPages = Math.max(1, Math.ceil(monthlyGroups.length / PAGE_SIZE));

  const visibleGroups = useMemo(() => {
    if (rangeMode === "first12") {
      return monthlyGroups.slice(0, PAGE_SIZE);
    }

    if (rangeMode === "last12") {
      return monthlyGroups.slice(Math.max(0, monthlyGroups.length - PAGE_SIZE));
    }

    if (rangeMode === "all") {
      return monthlyGroups;
    }

    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return monthlyGroups.slice(start, start + PAGE_SIZE);
  }, [rangeMode, monthlyGroups, currentPage, totalPages]);

  const visibleInterestTotal = visibleGroups.reduce((sum, group) => sum + group.totalInterest, 0);
  const visiblePaymentTotal = visibleGroups.reduce((sum, group) => sum + group.totalPayment, 0);
  const totalPaymentOverall = monthlyGroups.reduce((sum, group) => sum + group.totalPayment, 0);
  const totalInterestOverall = monthlyGroups.reduce((sum, group) => sum + group.totalInterest, 0);

  if (monthlyGroups.length === 0) {
    return <p className="muted">표시할 월별 상환 데이터가 없습니다.</p>;
  }

  return (
    <>
      <nav className="payment-pagination" aria-label="월별표 탐색">
        <div className="range-actions">
          <button type="button" className="small" onClick={() => setRangeMode("first12")}>
            첫 12개월
          </button>
          <button type="button" className="small" onClick={() => setRangeMode("last12")}>
            마지막 12개월
          </button>
          <button type="button" className="small" onClick={() => setRangeMode("all")}>
            전체 보기
          </button>
          <button type="button" className="small" onClick={() => setRangeMode("paged")}>
            페이지 보기
          </button>
        </div>
        {rangeMode === "paged" ? (
          <div className="page-actions">
            <button
              type="button"
              className="small"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              이전
            </button>
            <span>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="small"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              다음
            </button>
          </div>
        ) : null}
        <p className="muted pagination-summary">
          선택 구간 합계 - 납입액 {toCurrency(visiblePaymentTotal)}, 이자 {toCurrency(visibleInterestTotal)}
        </p>
      </nav>

      <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>월</th>
            <th>납부 항목 수</th>
            <th>총 납입액</th>
            <th>총 이자</th>
            <th>누적 이자</th>
            <th>총 원금상환</th>
            <th>월말 잔액</th>
            <th>마일스톤</th>
            <th>상세</th>
          </tr>
        </thead>
        <tbody>
          {visibleGroups.map((group) => {
            const isExpanded = Boolean(expandedMonths[group.monthIndex]);
            const isFinalMonth = group.monthIndex === lastMonth;

            return (
              <Fragment key={`group-${group.monthIndex}`}>
                <tr key={`summary-${group.monthIndex}`} className={isFinalMonth ? "payoff-month" : ""}>
                  <td>{group.monthIndex}월</td>
                  <td>{group.items.length}</td>
                  <td>{toCurrency(group.totalPayment)}</td>
                  <td
                    className={
                      group.totalInterest > 0
                        ? group.totalInterest > visibleInterestTotal / Math.max(visibleGroups.length, 1)
                          ? "interest-heavy"
                          : "interest-light"
                        : ""
                    }
                  >
                    {toCurrency(group.totalInterest)}
                  </td>
                  <td>{toCurrency(group.cumulativeInterest)}</td>
                  <td>{toCurrency(group.totalPrincipal)}</td>
                  <td>{toCurrency(group.endingBalance)}</td>
                  <td>
                    {isFinalMonth ? <span className="milestone-badge">모든 채무 완납</span> : null}
                    {!isFinalMonth && group.paidOffDebts.length > 0 ? (
                      <span
                        className="milestone-badge"
                        aria-label={`${group.paidOffDebts.join(", ")} 채무 완납 월`}
                      >
                        {group.paidOffDebts.join(", ")} 완납
                      </span>
                    ) : null}
                  </td>
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
                    <td colSpan={9}>
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
        <tfoot>
          <tr>
            <th>총계</th>
            <th>-</th>
            <th>{toCurrency(totalPaymentOverall)}</th>
            <th>{toCurrency(totalInterestOverall)}</th>
            <th>{toCurrency(monthlyGroups.at(-1)?.cumulativeInterest ?? 0)}</th>
            <th>{toCurrency(totalPaymentOverall - totalInterestOverall)}</th>
            <th>{toCurrency(monthlyGroups.at(-1)?.endingBalance ?? 0)}</th>
            <th colSpan={2}>총 상환 기간: {lastMonth ?? 0}개월</th>
          </tr>
        </tfoot>
      </table>
      </div>
    </>
  );
}
