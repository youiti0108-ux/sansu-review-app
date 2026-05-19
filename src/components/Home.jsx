import RubyText from "./RubyText";

export default function Home({ onNavigate, users = [], currentUser, onUserChange, soundOn, onToggleSound }) {
  const cards = [
    ["grade", 1, "1年生", "たしざん・ひきざんからはじめよう"],
    ["grade", 2, "2年生", "九九と2けた計算にチャレンジ"],
    ["grade", 3, "3年生", "わり算と筆算をじっくり"],
    ["mix", "mix", "全学年ミックス", "いろいろな問題をまとめて復習"],
    ["weak", null, "苦手こくふく", "まちがえた問題だけもう一回"],
    ["stamps", null, "スタンプちょう", "集めたシールを見よう"],
    ["awards", null, "しょうじょう", "がんばった賞状を見よう"],
    ["parent", null, "おうちの人", "学習のようすを確認"]
  ];

  return (
    <main className="home page-shell">
      <section className="hero-band">
        <div>
          <p className="eyebrow">小学1〜3年生</p>
          <h1><RubyText>さんすう総復習</RubyText></h1>
          <p><RubyText>{`${currentUser?.name || "ゲスト"}の さんすう`}</RubyText></p>
          <p><RubyText>紙を使わず、計算・文章題・筆算をアプリで練習できます。</RubyText></p>
          <div className="user-switch" aria-label="ユーザーをえらぶ">
            <span><RubyText>ユーザー</RubyText></span>
            <div>
              {users.map((user) => (
                <button
                  className={user.id === currentUser?.id ? "active" : ""}
                  key={user.id}
                  onClick={() => onUserChange(user.id)}
                  type="button"
                >
                  <RubyText>{user.name}</RubyText>
                </button>
              ))}
            </div>
          </div>
          <button className="sound-toggle" onClick={onToggleSound}>
            <RubyText>{`音：${soundOn ? "オン" : "オフ"}`}</RubyText>
          </button>
        </div>
        <div className="hero-medal">100</div>
      </section>

      <section className="home-grid">
        {cards.map(([type, value, title, desc]) => (
          <button className={`home-card ${type}`} key={title} onClick={() => onNavigate(type, value)}>
            <strong><RubyText>{title}</RubyText></strong>
            <span><RubyText>{desc}</RubyText></span>
          </button>
        ))}
      </section>
    </main>
  );
}
