// お題のデータ。単色（絵の具の配合）と、複数の色に分かれた模様。
import type { Amounts } from './color';

export interface Recipe extends Amounts {
  name: string;
}

/** x・y・w・h は塗る面に対する割合（0〜1） */
export interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
  recipe: Amounts;
}

export interface Pattern {
  name: string;
  zones: readonly Zone[];
}

export const RECIPES: readonly Recipe[] = [
  // ── 基本色
  { name: '赤',             red: 100, yellow:   0, blue:   0, white:   0, black:   0 },
  { name: '黄',             red:   0, yellow: 100, blue:   0, white:   0, black:   0 },
  { name: '青',             red:   0, yellow:   0, blue: 100, white:   0, black:   0 },

  // ── オレンジ・赤系
  { name: 'オレンジ',          red:  60, yellow:  40, blue:   0, white:   0, black:   0 },
  { name: '赤みオレンジ',       red:  75, yellow:  25, blue:   0, white:   0, black:   0 },
  { name: '深オレンジ',         red:  80, yellow:  20, blue:   0, white:   0, black:   0 },
  { name: '黄みオレンジ',       red:  45, yellow:  55, blue:   0, white:   0, black:   0 },
  { name: '黄オレンジ',         red:  25, yellow:  75, blue:   0, white:   0, black:   0 },
  { name: 'バーミリオン',        red:  90, yellow:  10, blue:   0, white:   0, black:   0 },
  { name: 'バーントオレンジ',    red:  55, yellow:  35, blue:  10, white:   0, black:  15 },
  { name: 'コーラル',           red:  75, yellow:  25, blue:   0, white:  20, black:   0 },
  { name: 'サーモンピンク',      red:  65, yellow:  25, blue:  10, white:  30, black:   0 },
  { name: 'アプリコット',        red:  55, yellow:  35, blue:   0, white:  35, black:   0 },
  { name: 'ピーチ',            red:  60, yellow:  40, blue:   0, white:  50, black:   0 },
  { name: 'チェリーレッド',      red:  90, yellow:  10, blue:   0, white:   0, black:  15 },
  { name: 'カーミン',           red:  80, yellow:   0, blue:  20, white:   0, black:   5 },
  { name: '朱色',              red:  88, yellow:  12, blue:   0, white:   0, black:   3 },
  { name: '緋色',              red: 100, yellow:   5, blue:   0, white:   0, black:   8 },
  { name: 'ボルドー',           red:  70, yellow:  10, blue:  20, white:   0, black:  30 },

  // ── ブラウン・アース系
  { name: '茶色',              red:  60, yellow:  40, blue:   0, white:   0, black:  40 },
  { name: 'ダークブラウン',      red:  55, yellow:  35, blue:  10, white:   0, black:  35 },
  { name: 'タン',              red:  50, yellow:  30, blue:  20, white:  20, black:   0 },
  { name: 'アンバー',           red:  50, yellow:  30, blue:  20, white:   0, black:  30 },
  { name: 'シエナ',            red:  55, yellow:  35, blue:  10, white:   5, black:  20 },
  { name: 'バーントシエナ',      red:  60, yellow:  30, blue:  10, white:   0, black:  30 },
  { name: 'オーカー',           red:  35, yellow:  50, blue:  15, white:   5, black:  20 },
  { name: 'セピア',            red:  40, yellow:  30, blue:  20, white:   0, black:  40 },
  { name: 'マロン',            red:  50, yellow:  30, blue:  20, white:  10, black:  30 },
  { name: 'マスタード',         red:  45, yellow:  45, blue:  10, white:   0, black:  30 },

  // ── 紫・バイオレット系
  { name: '紫',               red:  50, yellow:   0, blue:  50, white:   0, black:   0 },
  { name: '赤紫',              red:  65, yellow:   0, blue:  35, white:   0, black:   0 },
  { name: '青紫',              red:  35, yellow:   0, blue:  65, white:   0, black:   0 },
  { name: 'フューシャ',         red:  80, yellow:   0, blue:  20, white:  10, black:   0 },
  { name: 'ラベンダー',         red:  50, yellow:   0, blue:  50, white:  50, black:   0 },
  { name: '薄ラベンダー',        red:  40, yellow:   0, blue:  60, white:  45, black:   0 },
  { name: '藤色',              red:  55, yellow:   5, blue:  40, white:  40, black:   0 },
  { name: 'モーブ',            red:  55, yellow:  10, blue:  35, white:  30, black:   0 },
  { name: 'ロイヤルパープル',     red:  55, yellow:   0, blue:  45, white:   0, black:  20 },
  { name: 'ダークバイオレット',   red:  45, yellow:   5, blue:  50, white:   0, black:  35 },

  // ── 緑系
  { name: '緑',               red:   0, yellow:  50, blue:  50, white:   0, black:   0 },
  { name: '黄緑',              red:   5, yellow:  65, blue:  30, white:   0, black:   0 },
  { name: '若草色',            red:   5, yellow:  60, blue:  35, white:   5, black:   0 },
  { name: '草緑',              red:  10, yellow:  55, blue:  35, white:   0, black:   0 },
  { name: 'シャルトルーズ',      red:  15, yellow:  70, blue:  15, white:   0, black:   0 },
  { name: 'エメラルドグリーン',   red:   0, yellow:  60, blue:  40, white:   0, black:  10 },
  { name: 'ティール',           red:   0, yellow:  35, blue:  65, white:   0, black:   0 },
  { name: '青緑',              red:   0, yellow:  30, blue:  70, white:   0, black:   0 },
  { name: 'ターコイズ',         red:   0, yellow:  40, blue:  60, white:  10, black:   0 },
  { name: 'オリーブ',           red:  15, yellow:  55, blue:  30, white:   0, black:  10 },
  { name: 'セージ',            red:  10, yellow:  65, blue:  25, white:  30, black:   0 },
  { name: 'セージグリーン',      red:   0, yellow:  50, blue:  50, white:  50, black:   0 },
  { name: 'ミントグリーン',      red:   5, yellow:  40, blue:  55, white:  40, black:   0 },
  { name: '萌葱色',            red:   0, yellow:  55, blue:  45, white:   0, black:   5 },
  { name: '常磐色',            red:  10, yellow:  60, blue:  30, white:   0, black:  30 },
  { name: '深緑',              red:   0, yellow:  50, blue:  50, white:   0, black:  40 },
  { name: 'フォレストグリーン',   red:   5, yellow:  55, blue:  40, white:   0, black:  45 },
  { name: 'ハンターグリーン',    red:  10, yellow:  50, blue:  40, white:   0, black:  30 },
  { name: 'ダークオリーブ',      red:  15, yellow:  55, blue:  30, white:   0, black:  35 },

  // ── ピンク・ローズ系
  { name: 'ピンク',            red: 100, yellow:   0, blue:   0, white:  60, black:   0 },
  { name: '薄ピンク',           red: 100, yellow:   0, blue:   0, white:  80, black:   0 },
  { name: 'パウダーピンク',      red: 100, yellow:   5, blue:   0, white:  90, black:   0 },
  { name: 'ローズ',            red: 100, yellow:   0, blue:   0, white:  40, black:   0 },
  { name: 'くすみピンク',        red:  70, yellow:  10, blue:  20, white:  40, black:   0 },
  { name: 'ダスティローズ',      red:  60, yellow:  10, blue:  30, white:  35, black:   5 },
  { name: '鴇色',              red: 100, yellow:  10, blue:   0, white:  55, black:   0 },

  // ── 青・水色系
  { name: '水色',              red:   0, yellow:   0, blue: 100, white:  60, black:   0 },
  { name: '薄水色',             red:   0, yellow:   0, blue: 100, white:  80, black:   0 },
  { name: 'ベビーブルー',        red:   0, yellow:  10, blue:  90, white:  75, black:   0 },
  { name: 'アクアマリン',        red:   5, yellow:  25, blue:  70, white:  30, black:   0 },
  { name: 'コバルトブルー',      red:  10, yellow:   5, blue:  85, white:   0, black:  10 },
  { name: 'ロイヤルブルー',      red:  10, yellow:   5, blue:  85, white:   0, black:  20 },
  { name: 'ペリウィンクル',      red:  25, yellow:  10, blue:  65, white:  30, black:   0 },
  { name: '瑠璃色',            red:  15, yellow:   5, blue:  80, white:   0, black:   0 },
  { name: '濃紺',              red:   0, yellow:   0, blue: 100, white:   0, black:  50 },
  { name: 'ネイビー',           red:   5, yellow:   5, blue:  90, white:   0, black:  40 },
  { name: 'ミッドナイトブルー',   red:  10, yellow:   5, blue:  85, white:   0, black:  30 },
  { name: 'インディゴ',         red:  20, yellow:  10, blue:  70, white:  15, black:  15 },

  // ── グレー・ニュートラル系
  { name: 'グレー',            red:   0, yellow:   0, blue:   0, white:  50, black:  50 },
  { name: '薄グレー',           red:   0, yellow:   0, blue:   0, white:  75, black:  25 },
  { name: '濃グレー',           red:   0, yellow:   0, blue:   0, white:  25, black:  75 },
  { name: 'チャコール',         red:   0, yellow:   0, blue:   0, white:  10, black:  90 },
  { name: 'アッシュグレー',      red:  15, yellow:  10, blue:  20, white:  60, black:  15 },
  { name: 'ウォームグレー',      red:  10, yellow:   5, blue:   5, white:  70, black:  10 },
  { name: 'クールグレー',        red:   5, yellow:   5, blue:  10, white:  70, black:  10 },
  { name: 'ブルーグレー',        red:  15, yellow:  15, blue:  30, white:  60, black:   5 },
  { name: 'グリーングレー',      red:  10, yellow:  20, blue:  15, white:  60, black:   5 },

  // ── パステル系
  { name: 'クリーム',           red:  20, yellow:  20, blue:   0, white:  70, black:   0 },
  { name: 'アイボリー',         red:  15, yellow:  10, blue:   0, white:  75, black:   0 },
  { name: 'ペールイエロー',      red:   0, yellow: 100, blue:   0, white:  80, black:   0 },
  { name: 'ペールラベンダー',    red:  55, yellow:   0, blue:  45, white:  70, black:   0 },

  // ── 複合色（難）
  { name: 'くすみホワイト',      red:  30, yellow:  30, blue:  30, white:  10, black:   0 },
  { name: 'オフホワイト',        red:  10, yellow:  10, blue:   0, white:  90, black:   0 },
  { name: 'スレート',           red:  35, yellow:  25, blue:  40, white:  15, black:  10 },
  { name: 'テラコッタ（淡）',    red:  45, yellow:  30, blue:  25, white:  15, black:  10 },
  { name: 'テラコッタ（深）',    red:  50, yellow:  35, blue:  15, white:   0, black:  25 },
  { name: 'カーキ',            red:  20, yellow:  40, blue:  20, white:  15, black:  10 },
  { name: 'スチールブルー',      red:  25, yellow:  35, blue:  40, white:  10, black:  15 },
  { name: 'くすみ紫',           red:  40, yellow:  15, blue:  45, white:  10, black:  20 },
  { name: 'くすみティール',      red:  15, yellow:  45, blue:  40, white:  10, black:  20 },
  { name: 'くすみイエロー',      red:  20, yellow:  60, blue:  20, white:  10, black:  15 },
  { name: 'オリーブブラウン',    red:  35, yellow:  40, blue:  25, white:   5, black:  30 },
  { name: 'パープルグレー',      red:  30, yellow:  20, blue:  50, white:   0, black:  20 },
  { name: 'ローズウッド',        red:  55, yellow:  20, blue:  25, white:   0, black:  20 },
  { name: 'バーガンディ',        red:  60, yellow:  20, blue:  20, white:   0, black:  25 },
];

// ── ゾーンヘルパー ────────────────────────────────────────────────
function zn(x: number, y: number, w: number, h: number, recipe: Amounts): Zone {
  return { x, y, w, h, recipe };
}

// ── マルチゾーンパターン ──────────────────────────────────────────
export const MULTI_ZONE_PATTERNS: readonly Pattern[] = [
  // 旗
  {
    name: 'フランス国旗',
    zones: [
      zn(0,     0, 1/3, 1, { red:  5, yellow:  5, blue:  90, white:  0, black: 40 }),
      zn(1/3,   0, 1/3, 1, { red:  0, yellow:  0, blue:   0, white:100, black:  0 }),
      zn(2/3,   0, 1/3, 1, { red:100, yellow:  0, blue:   0, white:  0, black:  0 }),
    ]
  },
  {
    name: 'イタリア国旗',
    zones: [
      zn(0,     0, 1/3, 1, { red:  5, yellow: 55, blue:  40, white:  0, black: 45 }),
      zn(1/3,   0, 1/3, 1, { red:  0, yellow:  0, blue:   0, white:100, black:  0 }),
      zn(2/3,   0, 1/3, 1, { red:100, yellow:  0, blue:   0, white:  0, black:  0 }),
    ]
  },
  {
    name: 'ドイツ国旗',
    zones: [
      zn(0, 0,     1, 1/3, { red:  0, yellow:  0, blue:   0, white:  0, black:100 }),
      zn(0, 1/3,   1, 1/3, { red:100, yellow:  0, blue:   0, white:  0, black:  0 }),
      zn(0, 2/3,   1, 1/3, { red:  0, yellow:100, blue:   0, white:  0, black:  0 }),
    ]
  },
  {
    name: 'ウクライナの空',
    zones: [
      zn(0, 0,   1, 0.5, { red:  0, yellow:  0, blue: 100, white: 20, black:  0 }),
      zn(0, 0.5, 1, 0.5, { red:  0, yellow:100, blue:   0, white:  0, black:  0 }),
    ]
  },
  // 自然
  {
    name: '空と草原',
    zones: [
      zn(0, 0,   1, 0.45, { red:  0, yellow:  5, blue: 100, white: 55, black:  0 }),
      zn(0, 0.45,1, 0.55, { red:  5, yellow: 55, blue:  40, white:  0, black: 45 }),
    ]
  },
  {
    name: '海と空',
    zones: [
      zn(0, 0,    1, 0.42, { red:  5, yellow: 25, blue:  70, white: 30, black:  0 }),
      zn(0, 0.42, 1, 0.58, { red:  0, yellow: 35, blue:  65, white:  0, black:  0 }),
    ]
  },
  {
    name: '夕焼け',
    zones: [
      zn(0, 0,    1, 0.35, { red: 25, yellow: 10, blue:  65, white:  0, black: 40 }),
      zn(0, 0.35, 1, 0.35, { red: 75, yellow: 25, blue:   0, white:  0, black:  0 }),
      zn(0, 0.7,  1, 0.30, { red: 20, yellow: 40, blue:  20, white: 15, black: 10 }),
    ]
  },
  {
    name: '朝焼け',
    zones: [
      zn(0, 0,    1, 1/3, { red: 65, yellow: 25, blue:  10, white: 30, black:  0 }),
      zn(0, 1/3,  1, 1/3, { red: 60, yellow: 40, blue:   0, white:  0, black:  0 }),
      zn(0, 2/3,  1, 1/3, { red:  0, yellow:100, blue:   0, white: 60, black:  0 }),
    ]
  },
  {
    name: '夜と大地',
    zones: [
      zn(0, 0,   1, 0.6, { red: 10, yellow:  5, blue:  85, white:  0, black: 30 }),
      zn(0, 0.6, 1, 0.4, { red:  5, yellow: 55, blue:  40, white:  0, black: 45 }),
    ]
  },
  {
    name: '砂漠と空',
    zones: [
      zn(0, 0,   1, 0.4, { red:  5, yellow: 25, blue:  70, white: 30, black:  0 }),
      zn(0, 0.4, 1, 0.6, { red: 50, yellow: 30, blue:  20, white: 20, black:  0 }),
    ]
  },
  {
    name: '秋の森',
    zones: [
      zn(0, 0,   1, 0.55, { red: 55, yellow: 35, blue:  10, white:  0, black: 15 }),
      zn(0, 0.55,1, 0.45, { red: 35, yellow: 40, blue:  25, white:  5, black: 30 }),
    ]
  },
  {
    name: '南国の海',
    zones: [
      zn(0, 0,    1, 0.35, { red:  5, yellow: 25, blue:  70, white: 30, black:  0 }),
      zn(0, 0.35, 1, 0.30, { red: 50, yellow: 30, blue:  20, white: 20, black:  0 }),
      zn(0, 0.65, 1, 0.35, { red:  0, yellow: 40, blue:  60, white: 10, black:  0 }),
    ]
  },
  // 色の課題
  {
    name: '虹4色',
    zones: [
      zn(0, 0,    1, 0.25, { red:100, yellow:  0, blue:   0, white:  0, black:  0 }),
      zn(0, 0.25, 1, 0.25, { red: 60, yellow: 40, blue:   0, white:  0, black:  0 }),
      zn(0, 0.5,  1, 0.25, { red:  0, yellow:100, blue:   0, white:  0, black:  0 }),
      zn(0, 0.75, 1, 0.25, { red:  0, yellow: 50, blue:  50, white:  0, black:  0 }),
    ]
  },
  {
    name: '四色分割',
    zones: [
      zn(0,   0,   0.5, 0.5, { red:100, yellow:  0, blue:   0, white:  0, black:  0 }),
      zn(0.5, 0,   0.5, 0.5, { red:  0, yellow:100, blue:   0, white:  0, black:  0 }),
      zn(0,   0.5, 0.5, 0.5, { red:  0, yellow:  0, blue: 100, white:  0, black:  0 }),
      zn(0.5, 0.5, 0.5, 0.5, { red:  0, yellow: 50, blue:  50, white:  0, black:  0 }),
    ]
  },
  {
    name: '二次色三分割',
    zones: [
      zn(0,     0, 1/3, 1, { red: 60, yellow: 40, blue:   0, white:  0, black:  0 }),
      zn(1/3,   0, 1/3, 1, { red:  0, yellow: 50, blue:  50, white:  0, black:  0 }),
      zn(2/3,   0, 1/3, 1, { red: 50, yellow:  0, blue:  50, white:  0, black:  0 }),
    ]
  },
];

/** 全部のお題（単色 + 模様） */
export const PATTERNS: readonly Pattern[] = [
  ...RECIPES.map((r) => ({ name: r.name, zones: [zn(0, 0, 1, 1, r)] })),
  ...MULTI_ZONE_PATTERNS,
];
