import "./style.css";
import { LensChart } from "./chart";
import { MONTHS, SERIES } from "./data";
import { QUIZ } from "./quiz";

type Tab = "learn" | "lens" | "quiz" | "record";

const STORAGE_KEY = "datascope:record:v1";

interface RecordState {
  attempts: number;
  correct: number;
  lastPlayedAt: string | null;
}

function loadRecord(): RecordState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { attempts: 0, correct: 0, lastPlayedAt: null };
    return JSON.parse(raw);
  } catch {
    return { attempts: 0, correct: 0, lastPlayedAt: null };
  }
}

function saveRecord(r: RecordState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
}

const app = document.querySelector<HTMLDivElement>("#app")!;

let currentTab: Tab = "lens";
let chart: LensChart | null = null;

function render() {
  app.innerHTML = `
    <header class="ds-header">
      <div class="ds-logo">
        <div class="ds-logo-mark">Data<span>Sco</span><span class="cross">pe</span></div>
        <div class="ds-tagline">同じデータを、時間で見るか時点で比べるか</div>
      </div>
      <nav class="ds-tabs">
        <button class="ds-tab" data-tab="learn">学ぶ</button>
        <button class="ds-tab" data-tab="lens">データを見る</button>
        <button class="ds-tab" data-tab="quiz">クイズ</button>
        <button class="ds-tab" data-tab="record">学習記録</button>
      </nav>
    </header>
    <main class="ds-main" id="ds-main"></main>
  `;

  app.querySelectorAll<HTMLButtonElement>(".ds-tab").forEach((btn) => {
    const tab = btn.dataset.tab as Tab;
    btn.classList.toggle("active", tab === currentTab);
    btn.addEventListener("click", () => {
      currentTab = tab;
      render();
    });
  });

  const main = document.querySelector<HTMLElement>("#ds-main")!;
  if (currentTab === "learn") renderLearn(main);
  if (currentTab === "lens") renderLens(main);
  if (currentTab === "quiz") renderQuiz(main);
  if (currentTab === "record") renderRecord(main);
}

// ---------------------------------------------------------------
// 学ぶ
// ---------------------------------------------------------------

function renderLearn(main: HTMLElement) {
  main.innerHTML = `
    <h2 class="ds-panel-title">時系列データと横断面データ</h2>
    <p class="ds-panel-sub">同じ表から、2種類の見方が生まれる仕組みを理解する</p>

    <div class="ds-cards">
      <div class="ds-card">
        <h3 style="color:#3B4B9E">⏱ 時系列データ</h3>
        <p>同じ対象を、時間の流れに沿って追いかけたデータ。</p>
        <ul>
          <li>1月 → 2月 → 3月 → …と並ぶ</li>
          <li>「変化・トレンド」を知りたいときに使う</li>
          <li>未来予測の土台になる</li>
        </ul>
      </div>
      <div class="ds-card">
        <h3 style="color:#C98A2B">📍 横断面データ</h3>
        <p>ある1つの時点で、複数の対象を比べたデータ。</p>
        <ul>
          <li>商品A・商品B・商品C…と並ぶ</li>
          <li>「状態・分布・違い」を知りたいときに使う</li>
          <li>対象どうしの比較に向いている</li>
        </ul>
      </div>
    </div>

    <div class="ds-insight">
      <strong>重要なポイント：</strong>同じ売上データでも「どこを切り取るか」によって時系列データにも横断面データにもなります。「データを見る」タブでスライダーを動かして、実際に切り替えを体験してみましょう。
    </div>

    <h3 style="margin-top:32px;">時系列データの活用の流れ</h3>
    <div class="ds-flow">
      <div class="ds-flow-step">
        <div class="num">01</div>
        <h4>🔍 パターン発見</h4>
        <p>「毎年12月に売上が増えている」など、推移の中の規則性に気づく。</p>
      </div>
      <div class="ds-flow-step">
        <div class="num">02</div>
        <h4>📊 分析</h4>
        <p>「クリスマスキャンペーンが影響しているのでは？」と背景を考える。</p>
      </div>
      <div class="ds-flow-step">
        <div class="num">03</div>
        <h4>🔮 未来予測</h4>
        <p>「今年12月も増加する可能性が高い」と、次の一手につなげる。</p>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// データを見る（レンズ／メイン体験）
// ---------------------------------------------------------------

function renderLens(main: HTMLElement) {
  main.innerHTML = `
    <h2 class="ds-panel-title">同じデータ、どこを見る？</h2>
    <p class="ds-panel-sub">スライダーで「時系列」⇄「横断面」を行き来し、下のボタンで切り取る月を選べます</p>

    <div class="ds-lens">
      <div class="ds-lens-axis">
        <span class="ds-lens-axis-label time">⏱ 時間で見る</span>
        <input type="range" min="0" max="100" value="0" class="ds-slider" id="ds-slider" />
        <span class="ds-lens-axis-label cross">📍 時点で見る</span>
      </div>
      <div class="ds-canvas-wrap"><canvas id="ds-canvas"></canvas></div>

      <div class="ds-month-picker">
        <span class="ds-month-picker-label">切り取る月：</span>
        ${MONTHS.map(
          (m, i) => `<button class="ds-month-btn${i === 0 ? " active" : ""}" data-month="${i}">${m}</button>`
        ).join("")}
      </div>

      <div class="ds-legend">
        ${SERIES.map(
          (s) => `<div class="ds-legend-item"><span class="ds-legend-swatch" style="background:${s.color}"></span>${s.label}</div>`
        ).join("")}
      </div>

      <div class="ds-insight" id="ds-lens-insight"></div>
    </div>
  `;

  const canvas = main.querySelector<HTMLCanvasElement>("#ds-canvas")!;
  chart?.destroy();
  chart = new LensChart(canvas);

  const slider = main.querySelector<HTMLInputElement>("#ds-slider")!;
  const insight = main.querySelector<HTMLDivElement>("#ds-lens-insight")!;
  let selectedMonth = 0;

  function updateInsight(t: number) {
    if (t < 0.15) {
      insight.innerHTML =
        "<strong>時系列データ：</strong>各商品が月を追うごとにどう変化したかが見えます。商品Aは右肩上がり、商品Bはほぼ横ばいです。";
    } else if (t > 0.85) {
      insight.innerHTML = `<strong>横断面データ：</strong>${MONTHS[selectedMonth]}という1時点で、3つの商品の売上を比較できます。この瞬間、どの商品が最も売れているかが一目で分かります。`;
    } else {
      insight.innerHTML =
        "<strong>切り替え中：</strong>同じ数値が、時間の中の1点から、比較のための1本の棒へと姿を変えています。";
    }
  }

  slider.addEventListener("input", () => {
    const t = Number(slider.value) / 100;
    chart?.setT(t);
    updateInsight(t);
  });

  main.querySelectorAll<HTMLButtonElement>(".ds-month-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedMonth = Number(btn.dataset.month);
      main
        .querySelectorAll<HTMLButtonElement>(".ds-month-btn")
        .forEach((b) => b.classList.toggle("active", b === btn));
      chart?.setSelectedMonth(selectedMonth);
      updateInsight(Number(slider.value) / 100);
    });
  });

  updateInsight(0);
}

// ---------------------------------------------------------------
// クイズ
// ---------------------------------------------------------------

function renderQuiz(main: HTMLElement) {
  let index = 0;
  let correctCount = 0;
  let answered = false;

  function draw() {
    if (index >= QUIZ.length) {
      const record = loadRecord();
      record.attempts += QUIZ.length;
      record.correct += correctCount;
      record.lastPlayedAt = new Date().toISOString();
      saveRecord(record);

      main.innerHTML = `
        <div class="ds-quiz-card ds-quiz-result">
          <p class="ds-panel-sub">お疲れさまでした</p>
          <div class="score">${correctCount} / ${QUIZ.length}</div>
          <p>時系列データと横断面データの使い分けを、体感できましたか？</p>
          <button class="ds-quiz-next" id="ds-retry">もう一度挑戦する</button>
        </div>
      `;
      main.querySelector("#ds-retry")?.addEventListener("click", () => {
        index = 0;
        correctCount = 0;
        draw();
      });
      return;
    }

    const q = QUIZ[index];
    answered = false;
    main.innerHTML = `
      <h2 class="ds-panel-title">これはどっち？</h2>
      <p class="ds-panel-sub">全${QUIZ.length}問で、時系列と横断面の使い分けを確認します</p>
      <div class="ds-quiz-card">
        <div class="ds-quiz-progress">Q${index + 1} / ${QUIZ.length}</div>
        <div class="ds-quiz-prompt">${q.prompt}</div>
        <div class="ds-quiz-choices">
          ${q.choices
            .map((c, i) => `<button class="ds-choice" data-i="${i}">${c}</button>`)
            .join("")}
        </div>
        <div id="ds-quiz-feedback"></div>
      </div>
    `;

    main.querySelectorAll<HTMLButtonElement>(".ds-choice").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        const i = Number(btn.dataset.i);
        const isCorrect = i === q.correctIndex;
        if (isCorrect) correctCount++;

        main.querySelectorAll<HTMLButtonElement>(".ds-choice").forEach((b, bi) => {
          if (bi === q.correctIndex) b.classList.add("correct");
          else if (bi === i) b.classList.add("incorrect");
        });

        const feedback = main.querySelector<HTMLDivElement>("#ds-quiz-feedback")!;
        feedback.innerHTML = `
          <div class="ds-quiz-explanation">${isCorrect ? "🎉 正解！" : "△ 惜しい。"} ${q.explanation}</div>
          <button class="ds-quiz-next" id="ds-next">次へ</button>
        `;
        feedback
          .querySelector("#ds-next")
          ?.addEventListener("click", () => {
            index++;
            draw();
          });
      });
    });
  }

  draw();
}

// ---------------------------------------------------------------
// 学習記録
// ---------------------------------------------------------------

function renderRecord(main: HTMLElement) {
  const r = loadRecord();
  const accuracy = r.attempts === 0 ? 0 : Math.round((r.correct / r.attempts) * 100);
  const last = r.lastPlayedAt
    ? new Date(r.lastPlayedAt).toLocaleString("ja-JP")
    : "まだありません";

  main.innerHTML = `
    <h2 class="ds-panel-title">学習記録</h2>
    <p class="ds-panel-sub">クイズの成績はこの端末に保存されます</p>
    <div class="ds-record-grid">
      <div class="ds-stat">
        <div class="label">正答率</div>
        <div class="value">${accuracy}%</div>
      </div>
      <div class="ds-stat">
        <div class="label">総回答数</div>
        <div class="value">${r.attempts}</div>
      </div>
      <div class="ds-stat">
        <div class="label">最終プレイ</div>
        <div class="value" style="font-size:16px;">${last}</div>
      </div>
    </div>
    <button class="ds-reset" id="ds-reset">記録をリセットする</button>
  `;

  main.querySelector("#ds-reset")?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    renderRecord(main);
  });
}

render();
