import type { EditableDebt } from "@/types/repayment";

type DebtListProps = {
  debts: EditableDebt[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
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

function formatDate(value?: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
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
      <div className="table-wrap debt-table-desktop" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>채무명</th>
              <th>잔액</th>
              <th>연이율</th>
              <th>최소납입액</th>
              <th>만기</th>
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
                <td>{formatCurrency(debt.minimumPayment)}</td>
                <td>{formatDate(debt.maturityDate)}</td>
                <td>{formatRate(debt.prepaymentFeeRate)}</td>
                <td>
                  <button type="button" className="small" onClick={() => onEdit(debt.id)}>
                    수정
                  </button>
                  <button type="button" className="small danger" onClick={() => onDelete(debt.id)}>
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
            <p>최소납입액: {formatCurrency(debt.minimumPayment)}</p>
            <p>만기: {formatDate(debt.maturityDate)}</p>
            <p>중도상환수수료율: {formatRate(debt.prepaymentFeeRate)}</p>
            <div className="debt-card-actions">
              <button type="button" onClick={() => onEdit(debt.id)}>
                수정
              </button>
              <button type="button" className="danger" onClick={() => onDelete(debt.id)}>
                삭제
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
