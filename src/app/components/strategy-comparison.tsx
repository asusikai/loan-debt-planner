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
  return (
    <>
      <div className="result-cards">
        <article className="result-card">
          <h3>
            Avalanche
            <span className="help-tooltip-wrap" style={{ marginLeft: 6 }}>
              <button
                type="button"
                className="help-tooltip-trigger"
                aria-label="Avalanche 전략 설명 보기"
                aria-describedby="strategy-avalanche-tooltip"
              >
                ?
              </button>
              <span id="strategy-avalanche-tooltip" role="tooltip" className="help-tooltip-content">
                Avalanche는 이자율이 높은 채무부터 추가 상환해 총 이자 비용을 줄이는 데 유리합니다.
              </span>
            </span>
          </h3>
          <p>총이자: {toCurrency(results.avalanche.totalInterest)}</p>
          {interestWinner === "avalanche" ? <p className="winner-badge">최저 이자 전략</p> : null}
          <p>완납 개월: {results.avalanche.monthsToPayoff}개월</p>
          {durationWinner === "avalanche" ? <p className="winner-badge">최단 기간 전략</p> : null}
          <p>완납 예정: {results.avalanche.payoffDate}</p>
        </article>
        <article className="result-card">
          <h3>
            Snowball
            <span className="help-tooltip-wrap" style={{ marginLeft: 6 }}>
              <button
                type="button"
                className="help-tooltip-trigger"
                aria-label="Snowball 전략 설명 보기"
                aria-describedby="strategy-snowball-tooltip"
              >
                ?
              </button>
              <span id="strategy-snowball-tooltip" role="tooltip" className="help-tooltip-content">
                Snowball은 잔액이 작은 채무부터 추가 상환해 조기 완납 경험을 만들고 동기 부여에 유리합니다.
              </span>
            </span>
          </h3>
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
    </>
  );
}
