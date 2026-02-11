import type { StrategyResult, StrategyType } from "@/types/repayment";

type StrategyComparisonProps = {
  results: {
    avalanche: StrategyResult;
    snowball: StrategyResult;
  };
  selectedStrategy: StrategyType;
  onSelectStrategy: (strategy: StrategyType) => void;
};

function toCurrency(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function StrategyComparison({
  results,
  selectedStrategy,
  onSelectStrategy,
}: StrategyComparisonProps) {
  const interestWinner =
    results.avalanche.totalInterest <= results.snowball.totalInterest ? "avalanche" : "snowball";
  const durationWinner =
    results.avalanche.monthsToPayoff <= results.snowball.monthsToPayoff ? "avalanche" : "snowball";

  return (
    <>
      <div className="result-cards">
        <article className="result-card">
          <h3>Avalanche</h3>
          <p>총이자: {toCurrency(results.avalanche.totalInterest)}</p>
          {interestWinner === "avalanche" ? <p className="winner-badge">최저 이자 전략</p> : null}
          <p>완납 개월: {results.avalanche.monthsToPayoff}개월</p>
          {durationWinner === "avalanche" ? <p className="winner-badge">최단 기간 전략</p> : null}
          <p>완납 예정: {results.avalanche.payoffDate}</p>
        </article>
        <article className="result-card">
          <h3>Snowball</h3>
          <p>총이자: {toCurrency(results.snowball.totalInterest)}</p>
          {interestWinner === "snowball" ? <p className="winner-badge">최저 이자 전략</p> : null}
          <p>완납 개월: {results.snowball.monthsToPayoff}개월</p>
          {durationWinner === "snowball" ? <p className="winner-badge">최단 기간 전략</p> : null}
          <p>완납 예정: {results.snowball.payoffDate}</p>
        </article>
      </div>

      <div className="strategy-tabs" role="tablist" aria-label="전략별 월별 계획표">
        <button
          role="tab"
          aria-selected={selectedStrategy === "avalanche"}
          aria-controls="strategy-plan-table"
          type="button"
          className={selectedStrategy === "avalanche" ? "active" : ""}
          onClick={() => onSelectStrategy("avalanche")}
        >
          Avalanche 월별표
        </button>
        <button
          role="tab"
          aria-selected={selectedStrategy === "snowball"}
          aria-controls="strategy-plan-table"
          type="button"
          className={selectedStrategy === "snowball" ? "active" : ""}
          onClick={() => onSelectStrategy("snowball")}
        >
          Snowball 월별표
        </button>
      </div>
    </>
  );
}
