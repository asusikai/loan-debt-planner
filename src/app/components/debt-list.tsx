import type { EditableDebt } from "@/types/repayment";

type DebtListProps = {
  debts: EditableDebt[];
  onEdit: (id: string) => void;
  onDelete: (debt: EditableDebt, trigger: HTMLButtonElement) => void;
  onAddNew?: () => void;
};

function formatCurrency(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatRate(value?: number): string {
  if (value === undefined) {
    return "-";
  }

  return `${(value * 100).toFixed(2)}%`;
}

function formatMaturityMonths(value?: number): string {
  if (value === undefined) {
    return "-";
  }

  return `${value}개월`;
}

function formatRepaymentType(value: EditableDebt["repaymentType"]): string {
  if (value === "bullet") {
    return "원금만기일시상환";
  }

  if (value === "equalPrincipal") {
    return "원금균등상환";
  }

  return "원리금균등상환";
}

export function DebtList({ debts, onEdit, onDelete, onAddNew }: DebtListProps) {
  if (debts.length === 0) {
    return (
      <div className="debt-empty-state" style={{ marginTop: 16 }}>
        <p className="muted">채무가 없습니다. 첫 채무를 추가해 시작하세요.</p>
        {onAddNew ? (
          <button type="button" onClick={onAddNew}>
            채무 추가
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="debt-list-actions" style={{ marginTop: 16 }}>
        {onAddNew ? (
          <button type="button" onClick={onAddNew}>
            채무 추가
          </button>
        ) : null}
      </div>
      <div className="table-wrap debt-table-desktop" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>채무명</th>
              <th>잔액</th>
              <th>연이율</th>
              <th>상환 방식</th>
              <th>만기 잔여 개월</th>
              <th>거치 기간</th>
              <th>중도상환수수료율</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {debts.map((debt) => (
              <tr key={debt.id}>
                <td>{debt.name}</td>
                <td>{formatCurrency(debt.balance)}</td>
                <td>{formatRate(debt.annualRate)}</td>
                <td>{formatRepaymentType(debt.repaymentType)}</td>
                <td>{formatMaturityMonths(debt.maturityMonths)}</td>
                <td>{formatMaturityMonths(debt.graceMonths)}</td>
                <td>{formatRate(debt.prepaymentFeeRate)}</td>
                <td>
                  <button type="button" className="small" onClick={() => onEdit(debt.id)}>
                    수정
                  </button>
                  <button
                    type="button"
                    className="small danger"
                    onClick={(event) => onDelete(debt, event.currentTarget)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="debt-cards-mobile" style={{ marginTop: 16 }}>
        {debts.map((debt) => (
          <article className="debt-card" key={`card-${debt.id}`}>
            <h3>{debt.name}</h3>
            <p>
              잔액: <strong>{formatCurrency(debt.balance)}</strong>
            </p>
            <p>연이율: {formatRate(debt.annualRate)}</p>
            <p>상환 방식: {formatRepaymentType(debt.repaymentType)}</p>
            <p>만기 잔여 개월: {formatMaturityMonths(debt.maturityMonths)}</p>
            <p>거치 기간: {formatMaturityMonths(debt.graceMonths)}</p>
            <p>중도상환수수료율: {formatRate(debt.prepaymentFeeRate)}</p>
            <div className="debt-card-actions">
              <button type="button" onClick={() => onEdit(debt.id)}>
                수정
              </button>
              <button
                type="button"
                className="danger"
                onClick={(event) => onDelete(debt, event.currentTarget)}
              >
                삭제
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
