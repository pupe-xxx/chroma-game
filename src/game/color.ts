// 絵の具の混色（赤・黄・青 + 白・黒）と、色の近さの判定。
//
// 混色の考え方:
//   二次色（橙・緑・紫）が現れるには、少ない方の色が「十分に溜まっている」ことが前提。
//   わずかな量を混ぜても色はほぼ変わらず、両方の色が増えるにつれて徐々に変わる。
//
// 二次色の強さ = smoothstep(少ない方の量 / しきい値) × smoothstep(少ない方 / 多い方)
//   1つ目: 少ない方の量がしきい値に届くまで抑える（0〜1）
//   2つ目: 比率が半々に近いほど強くなる S 字の曲線（0〜1）

export const PIGMENTS = ['red', 'yellow', 'blue', 'white', 'black'] as const;
export type Pigment = (typeof PIGMENTS)[number];

/** 絵の具ごとの量 */
export type Amounts = Record<Pigment, number>;

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface SimilarityDetail {
  overall: number;
  lightness: number;
  chroma: number;
}

type Vec3 = readonly [number, number, number];

// 一次色（RGB 0〜1）
const C_RED: Vec3 = [1.0, 0.05, 0.05];
const C_YELLOW: Vec3 = [0.99, 0.93, 0.0];
const C_BLUE: Vec3 = [0.05, 0.12, 0.88];

// 二次色（半々に混ぜた時に目指す色、RGB 0〜1）
const C_ORANGE: Vec3 = [1.0, 0.38, 0.0]; // 橙：赤+黄
const C_GREEN: Vec3 = [0.04, 0.72, 0.04]; // 緑：黄+青
const C_PURPLE: Vec3 = [0.42, 0.0, 0.7]; // 紫：赤+青

/** 単純に足して割った色からのずれ */
function shift(target: Vec3, a: Vec3, b: Vec3): Vec3 {
  return [target[0] - 0.5 * (a[0] + b[0]), target[1] - 0.5 * (a[1] + b[1]), target[2] - 0.5 * (a[2] + b[2])];
}
const dOR = shift(C_ORANGE, C_RED, C_YELLOW);
const dGR = shift(C_GREEN, C_YELLOW, C_BLUE);
const dPU = shift(C_PURPLE, C_RED, C_BLUE);

// S 字の曲線（Ken Perlin の smoothstep）
function smoothstep(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t);
}

// 少ない方の色がこの量まで溜まると、二次色が最も強く出る（約10回塗った量）
const SECONDARY_THRESHOLD = 90;

function secondaryStrength(amtA: number, amtB: number): number {
  if (amtA <= 0 || amtB <= 0) return 0;
  const minor = Math.min(amtA, amtB);
  const major = Math.max(amtA, amtB);
  return smoothstep(minor / SECONDARY_THRESHOLD) * smoothstep(minor / major);
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** 赤・黄・青の割合（合計1）→ RGB（0〜1）。chromTotal は実際の量の合計 */
function ryb2rgb(r: number, y: number, b: number, chromTotal: number): Vec3 {
  const ct = chromTotal || 200;
  const sOR = secondaryStrength(r * ct, y * ct);
  const sGR = secondaryStrength(y * ct, b * ct);
  const sPU = secondaryStrength(r * ct, b * ct);
  const channel = (i: 0 | 1 | 2) =>
    clamp01(r * C_RED[i] + y * C_YELLOW[i] + b * C_BLUE[i] + sOR * dOR[i] + sGR * dGR[i] + sPU * dPU[i]);
  return [channel(0), channel(1), channel(2)];
}

/** 絵の具の量から、混ざった色を出す。何も無ければ白 */
export function mixPaint(amounts: Amounts): Rgb {
  const chromTotal = amounts.red + amounts.yellow + amounts.blue;
  const total = chromTotal + amounts.white + amounts.black;
  if (total === 0) return { r: 255, g: 255, b: 255 };

  const chromFrac = chromTotal / total;
  const whiteFrac = amounts.white / total;
  const base: Vec3 =
    chromTotal > 0
      ? ryb2rgb(amounts.red / chromTotal, amounts.yellow / chromTotal, amounts.blue / chromTotal, chromTotal)
      : [1, 1, 1];

  const to255 = (v: number) => Math.round(Math.min(255, Math.max(0, (v * chromFrac + whiteFrac) * 255)));
  return { r: to255(base[0]), g: to255(base[1]), b: to255(base[2]) };
}

export function toHex({ r, g, b }: Rgb): string {
  const hex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** 人の目の感じ方に近い色の表し方（Lab）に直す */
function rgbToLab({ r, g, b }: Rgb): Vec3 {
  const toLinear = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const X = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) / 0.95047;
  const Y = (lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175) / 1.0;
  const Z = (lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X), fy = f(Y), fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** 2色の近さ（0〜100）。全体・明るさ・色みに分けて返す */
export function colorSimilarityDetail(c1: Rgb, c2: Rgb): SimilarityDetail {
  const [L1, a1, b1] = rgbToLab(c1);
  const [L2, a2, b2] = rgbToLab(c2);
  const score = (distance: number) => Math.max(0, Math.round(100 - distance));
  return {
    overall: score(Math.sqrt((L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2)),
    lightness: score(Math.abs(L1 - L2)),
    chroma: score(Math.sqrt((a1 - a2) ** 2 + (b1 - b2) ** 2)),
  };
}
