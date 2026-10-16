import { MONTHS, SALES, SERIES } from "./data";

const PADDING = { top: 28, right: 28, bottom: 44, left: 48 };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export class LensChart {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private t = 0; // 0 = 時系列（折れ線）, 1 = 横断面（棒グラフ）
  private displayT = 0; // イージングで追従する表示用の値
  private selectedMonth = 0;
  private raf = 0;
  private maxValue = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not available");
    this.ctx = ctx;
    this.maxValue = Math.max(...Object.values(SALES).flat()) * 1.15;
    window.addEventListener("resize", () => this.resize());
    this.resize();
    this.loop();
  }

  setT(t: number) {
    this.t = Math.min(1, Math.max(0, t));
  }

  setSelectedMonth(m: number) {
    this.selectedMonth = m;
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private loop = () => {
    this.displayT = lerp(this.displayT, this.t, 0.14);
    if (Math.abs(this.displayT - this.t) < 0.001) this.displayT = this.t;
    this.draw(this.displayT);
    this.raf = requestAnimationFrame(this.loop);
  };

  destroy() {
    cancelAnimationFrame(this.raf);
  }

  private draw(t: number) {
    const { ctx, canvas } = this;
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, w, h);

    const plotW = w - PADDING.left - PADDING.right;
    const plotH = h - PADDING.top - PADDING.bottom;
    const baseY = PADDING.top + plotH;

    const yForValue = (v: number) => baseY - (v / this.maxValue) * plotH;

    const nMonths = MONTHS.length;
    const nSeries = SERIES.length;

    // 時系列レイアウト：月を横軸に等間隔配置
    const xForMonth = (m: number) =>
      PADDING.left + (plotW * (m + 0.5)) / nMonths;

    // 横断面レイアウト：商品を横軸に等間隔配置
    const xForSeriesIdx = (i: number) =>
      PADDING.left + (plotW * (i + 0.5)) / nSeries;

    // --- 目盛線 ---
    ctx.strokeStyle = "rgba(28,28,26,0.08)";
    ctx.lineWidth = 1;
    const gridLines = 4;
    ctx.font = "11px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "rgba(28,28,26,0.45)";
    ctx.textAlign = "right";
    for (let i = 0; i <= gridLines; i++) {
      const v = (this.maxValue / gridLines) * i;
      const y = yForValue(v);
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(w - PADDING.right, y);
      ctx.stroke();
      ctx.fillText(Math.round(v).toString(), PADDING.left - 8, y + 4);
    }

    // --- 軸ラベル：月（時系列側）は t が小さいほど濃く ---
    ctx.textAlign = "center";
    ctx.fillStyle = `rgba(28,28,26,${(1 - t) * 0.75 + 0.1})`;
    ctx.font = "12px 'IBM Plex Sans', sans-serif";
    MONTHS.forEach((label, m) => {
      const highlight = m === this.selectedMonth;
      ctx.fillStyle = highlight
        ? `rgba(201,138,43,${(1 - t) * 0.9 + 0.1})`
        : `rgba(28,28,26,${(1 - t) * 0.7 + 0.05})`;
      ctx.fillText(label, xForMonth(m), baseY + 20);
    });

    // --- 軸ラベル：商品（横断面側）は t が大きいほど濃く ---
    SERIES.forEach((s, i) => {
      ctx.fillStyle = `rgba(28,28,26,${t * 0.8 + 0.05})`;
      ctx.font = "12px 'IBM Plex Sans', sans-serif";
      ctx.fillText(s.label, xForSeriesIdx(i), baseY + 20);
    });

    // 選ばれた月のキャプション
    ctx.fillStyle = `rgba(201,138,43,${t})`;
    ctx.font = "600 12px 'IBM Plex Sans', sans-serif";
    if (t > 0.05) {
      ctx.fillText(`${MONTHS[this.selectedMonth]}時点で比較`, w / 2, PADDING.top - 10);
    }

    // --- 各系列の描画 ---
    SERIES.forEach((s, si) => {
      const values = SALES[s.key];

      // 折れ線（時系列）：selectedMonth 以外の点をつなぐ線は t が増えるほど消える
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 1 - t;
      ctx.beginPath();
      values.forEach((v, m) => {
        const x = xForMonth(m);
        const y = yForValue(v);
        if (m === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;

      // 各月の点：選択中の月だけ、時系列位置→横断面位置へ移動する
      values.forEach((v, m) => {
        const xTime = xForMonth(m);
        const y = yForValue(v);
        if (m === this.selectedMonth) {
          const xCross = xForSeriesIdx(si);
          const x = lerp(xTime, xCross, t);

          // 棒（横断面）：t が増えるほど太く・濃く育つ
          const barWidth = lerp(0, plotW / nSeries - 24, t);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = t;
          ctx.fillRect(x - barWidth / 2, y, barWidth, baseY - y);
          ctx.globalAlpha = 1;

          // 点（時系列）：t が減るほどくっきり
          ctx.beginPath();
          ctx.arc(x, y, lerp(5, 3, t), 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.fill();

          // 値ラベル
          ctx.fillStyle = "#1C1C1A";
          ctx.font = "600 12px 'IBM Plex Mono', monospace";
          ctx.fillText(v.toString(), x, y - 10);
        } else {
          ctx.globalAlpha = (1 - t) * 0.9;
          ctx.beginPath();
          ctx.arc(xTime, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });
    });

    // --- ベースライン ---
    ctx.strokeStyle = "rgba(28,28,26,0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, baseY);
    ctx.lineTo(w - PADDING.right, baseY);
    ctx.stroke();
  }
}
