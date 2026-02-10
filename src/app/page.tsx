const sampleDebts = [
  {
    name: "신용대출A",
    balance: 5000000,
    annualRate: 0.082,
    minimumPayment: 200000,
  },
  {
    name: "카드리볼빙",
    balance: 1200000,
    annualRate: 0.149,
    minimumPayment: 120000,
  },
];

export default function HomePage() {
  return (
    <main>
      <h1>DebtPilot</h1>
      <p className="muted">
        다중 채무 상환 전략(Avalanche/Snowball) 비교를 위한 초기 스캐폴딩입니다.
      </p>

      <section className="card" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>샘플 입력 데이터</h2>
        <ul>
          {sampleDebts.map((debt) => (
            <li key={debt.name}>
              {debt.name} - 잔액 {debt.balance.toLocaleString()}원 / 연이율{" "}
              {(debt.annualRate * 100).toFixed(1)}% / 최소납입{" "}
              {debt.minimumPayment.toLocaleString()}원
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
