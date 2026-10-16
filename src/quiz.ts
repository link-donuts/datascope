export interface QuizQuestion {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ: QuizQuestion[] = [
  {
    prompt: "東京の2020〜2025年の平均気温",
    choices: ["時系列データ", "横断面データ"],
    correctIndex: 0,
    explanation:
      "時間の流れに沿って同じ対象（東京）の変化を追跡しているので、時系列データです。",
  },
  {
    prompt: "2026年9月1日の全国の気温",
    choices: ["未来予測", "複数地域の比較", "時間的変化"],
    correctIndex: 1,
    explanation:
      "1つの時点（9月1日）で複数の地域を比べているので、横断面データが分かることは「複数地域の比較」です。",
  },
  {
    prompt: "商品の売上が1年間でどう変化したか知りたい",
    choices: ["時系列で見る", "横断面で見る"],
    correctIndex: 0,
    explanation:
      "「変化」を追いたいので時間の流れで見る＝時系列データが適しています。",
  },
  {
    prompt: "今日、どの商品が一番売れているか比較したい",
    choices: ["時系列で見る", "横断面で見る"],
    correctIndex: 1,
    explanation:
      "1つの時点（今日）で複数の商品を比べたいので横断面データが適しています。",
  },
  {
    prompt: "来月の売上を予測したい",
    choices: ["時系列で見る", "横断面で見る"],
    correctIndex: 0,
    explanation:
      "未来の変化を予測するには、過去からの推移＝時系列データが必要です。",
  },
  {
    prompt: "9月1日時点で店舗ごとの売上を比較したい",
    choices: ["時系列で見る", "横断面で見る"],
    correctIndex: 1,
    explanation:
      "特定の1時点で複数の対象（店舗）を比べるので横断面データです。",
  },
];
