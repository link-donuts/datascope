// 同じ1つのデータセットを「時間で見る」か「時点で比べる」かだけで
// 時系列データにも横断面データにもなる、という体験のための元データ。

export interface SeriesDef {
  key: string;
  label: string;
  color: string;
}

export const MONTHS = ["1月", "2月", "3月", "4月"] as const;

export const SERIES: SeriesDef[] = [
  { key: "a", label: "商品A", color: "#3B4B9E" },
  { key: "b", label: "商品B", color: "#C98A2B" },
  { key: "c", label: "商品C", color: "#5E8C61" },
];

// 行 = 月、列 = 商品
export const SALES: Record<string, number[]> = {
  a: [100, 120, 150, 180],
  b: [80, 90, 100, 95],
  c: [120, 110, 130, 160],
};
