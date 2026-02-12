import type { RecommendationResult, StrategyResult, StrategyType } from "@/types/repayment";

type StrategyComparisonProps = {
  results: {
    avalanche: StrategyResult;
    snowball: StrategyResult;
  };
  selectedStrategy: StrategyType;
  recommendation: RecommendationResult | null;
  onSelectStrategy: (strategy: StrategyType) => void;
};

function toCurrency(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function StrategyComparison({
  results,
  selectedStrategy,
  recommendation,
  onSelectStrategy,
}: StrategyComparisonProps) {
  const interestWinner =
    results.avalanche.totalInterest <= results.snowball.totalInterest ? "avalanche" : "snowball";
  const durationWinner =
    results.avalanche.monthsToPayoff <= results.snowball.monthsToPayoff ? "avalanche" : "snowball";
  const strategyTip =
    selectedStrategy === "avalanche"
      ? "Avalanche는 총 이자 비용을 줄이는 데 유리한 전략입니다."
      : "Snowball은 작은 채무부터 정리해 심리적 동기 부여에 유리합니다.";

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
      {recommendation ? (
        <div className="strategy-recommendation">
          <p className="muted">
            자동 추천 전략: <strong>{recommendation.strategy === "avalanche" ? "Avalanche" : "Snowball"}</strong>
          </p>
          <p className="muted">
            추가 상환 우선순위: {recommendation.extraPaymentOrder.length > 0
              ? recommendation.extraPaymentOrder.join(" -> ")
              : "추가 상환 없음"}
          </p>
        </div>
      ) : null}
      <p className="muted strategy-recommendation">추천: {strategyTip}</p>
    </>
  );
}
