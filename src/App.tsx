import React from "react";

export default function App() {
  return (
    <div className="page">
      <header className="nav">
        <div className="container nav-inner">
          <div className="logo">CookLab AI</div>
          <nav className="nav-links">
            <a href="#lab">料理實驗室</a>
            <a href="#menu">省錢菜單</a>
            <a href="#reports">實驗報告</a>
            <a href="#subscribe" className="btn btn-ghost">加入等候名單</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-inner">
            <div>
              <div className="badge">料理實驗室 × 台灣食材週期</div>
              <h1>做菜，不再靠運氣</h1>
              <p className="lead">
                CookLab AI 用實驗驗證料理成功率，結合台灣當季食材與價格，
                給你真正省錢又穩定的每週菜單。
              </p>
              <div className="actions">
                <a href="#menu" className="btn btn-primary">免費看本週菜單</a>
                <a href="#reports" className="btn btn-secondary">看最新實驗報告</a>
              </div>
              <div className="hero-metrics">
                <div>
                  <div className="metric">5 道</div>
                  <div className="muted">每週菜單</div>
                </div>
                <div>
                  <div className="metric">可重現</div>
                  <div className="muted">實驗流程</div>
                </div>
                <div>
                  <div className="metric">少失敗</div>
                  <div className="muted">省錢省時間</div>
                </div>
              </div>
            </div>
            <div className="hero-card">
              <div className="card-title">本週亮點實驗</div>
              <div className="card-highlight">氣炸雞翅 170 vs 190</div>
              <p>同批雞翅、同時間、不同溫度，脆度與出油量完整對照。</p>
              <div className="card-footer">完整報告 →</div>
            </div>
          </div>
        </section>

        <section className="section" id="lab">
          <div className="container">
            <h2>你不缺食譜，你缺的是「可驗證的結果」</h2>
            <div className="pain-grid">
              <div className="pain">這個做法到底穩不穩？</div>
              <div className="pain">失敗是因為哪個變因？</div>
              <div className="pain">本週買什麼最划算？</div>
            </div>
          </div>
        </section>

        <section className="section split">
          <div className="container split-grid">
            <div className="feature-card">
              <div className="emoji">🧪</div>
              <h3>可驗證料理實驗室</h3>
              <p>每道菜都有成功版本＋失敗版本＋原因對照，重現率高。</p>
            </div>
            <div className="feature-card">
              <div className="emoji">📅</div>
              <h3>台灣食材週期菜單</h3>
              <p>把季節、價格、促銷放進菜單決策，少花錢還吃更好。</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2>CookLab AI 的 4 個關鍵特色</h2>
            <div className="features-grid">
              <div className="feature">
                <div className="emoji">🔬</div>
                <h4>實驗式食譜</h4>
                <p>變因、步驟、結果清楚可複製。</p>
              </div>
              <div className="feature">
                <div className="emoji">📉</div>
                <h4>省錢菜單</h4>
                <p>依台灣季節與市場價更新。</p>
              </div>
              <div className="feature">
                <div className="emoji">🧠</div>
                <h4>失敗也記錄</h4>
                <p>你不會再踩一樣的雷。</p>
              </div>
              <div className="feature">
                <div className="emoji">⚡</div>
                <h4>每週 5 道菜</h4>
                <p>少腦耗、直接照做。</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="menu">
          <div className="container">
            <h2>本週省錢菜單（示範）</h2>
            <div className="menu-list">
              <div className="menu-item">高麗菜三吃：清炒／味噌湯／煎餅</div>
              <div className="menu-item">氣炸雞翅 170 vs 190 實驗</div>
              <div className="menu-item">冷凍花枝快炒零失敗</div>
              <div className="menu-item">豬絞肉萬用醬一鍋三變</div>
              <div className="menu-item">便當級三菜一湯組合</div>
            </div>
            <div className="note">* 實際菜單會依季節與市場價格更新</div>
          </div>
        </section>

        <section className="section" id="reports">
          <div className="container">
            <h2>最新實驗報告</h2>
            <div className="reports-grid">
              <article className="report-card">
                <h4>氣炸雞翅 170 vs 190</h4>
                <p>脆度差異與出油量完整對照，找到穩定口感的溫度區間。</p>
                <span>閱讀 →</span>
              </article>
              <article className="report-card">
                <h4>乾煎鯖魚不破皮</h4>
                <p>關鍵是水分與鍋溫的臨界點，破皮率大幅下降。</p>
                <span>閱讀 →</span>
              </article>
              <article className="report-card">
                <h4>麻油雞不苦</h4>
                <p>薑先炸還是先煎？用實驗回答，風味差異明確。</p>
                <span>閱讀 →</span>
              </article>
            </div>
          </div>
        </section>

        <section className="section subscribe" id="subscribe">
          <div className="container subscribe-inner">
            <div>
              <h2>加入等候名單</h2>
              <p>每週收到菜單與最新實驗報告，少失敗、少花錢、吃更好。</p>
            </div>
            <div className="subscribe-form">
              <input type="email" placeholder="輸入 Email" aria-label="Email" />
              <button className="btn btn-primary">通知我</button>
            </div>
            <div className="note">目前為展示版，正式訂閱功能即將開放。</div>
          </div>
        </section>

        <section className="section about">
          <div className="container">
            <h2>CookLab AI 是誰</h2>
            <p>
              我們把料理當實驗做，把食材當資料處理。
              目標只有一個：讓你少失敗、少花錢、吃更好。
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>© 2026 CookLab AI</div>
          <div className="muted">料理實驗室 × 台灣食材週期</div>
        </div>
      </footer>
    </div>
  );
}
