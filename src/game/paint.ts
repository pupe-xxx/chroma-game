// 塗る面。マス目ごとに、5色の絵の具の量を持つ。
// 位置はマス目の番号（列 c・行 r）で受け取る。画面の座標はここでは扱わない。
import { colorSimilarityDetail, mixPaint, PIGMENTS, type Amounts, type Rgb, type SimilarityDetail } from './color';
import type { Zone } from './patterns';

/** 筆の半径（マス目の数） */
export const BRUSH_RADIUS = 5.0;
/** 1回の操作で、筆の中心のマスに足す量 */
export const STRENGTH = 8;
/** 1マスに入る量の上限。超えた分は、新しい絵の具が古い絵の具を押し出す */
export const TOTAL_CAP = 320;

const N = PIGMENTS.length;

export interface PaintGrid {
  readonly cols: number;
  readonly rows: number;
  /** 1マスにつき N 個（PIGMENTS の順） */
  readonly data: Float32Array;
}

/** マス目の範囲。c1・r1 は含まない */
export interface CellRect {
  c0: number;
  r0: number;
  c1: number;
  r1: number;
}

/** 画面に出す色。alpha は 0〜1（薄く塗った所は透ける） */
export interface Shown extends Rgb {
  alpha: number;
}

export interface Sample {
  /** 絵の具の割合（合計1）。この色で塗る時に使う */
  ryb: Amounts;
  /** 目に見える色 */
  rgb: Rgb;
}

export function createGrid(cols: number, rows: number): PaintGrid {
  return { cols, rows, data: new Float32Array(cols * rows * N) };
}

function toAmounts(v: ArrayLike<number>, offset = 0): Amounts {
  return { red: v[offset], yellow: v[offset + 1], blue: v[offset + 2], white: v[offset + 3], black: v[offset + 4] };
}

export function amountsAt(grid: PaintGrid, c: number, r: number): Amounts {
  return toAmounts(grid.data, (r * grid.cols + c) * N);
}

/** (cx, cy) を中心に、筆の形で絵の具を足す。brush は絵の具の割合（合計1）。変わった範囲を返す */
export function paintAt(grid: PaintGrid, cx: number, cy: number, brush: Amounts): CellRect {
  const R = Math.ceil(BRUSH_RADIUS);
  const ratios = PIGMENTS.map((k) => brush[k]);
  const d = grid.data;

  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      const c = cx + dx, r = cy + dy;
      if (c < 0 || c >= grid.cols || r < 0 || r >= grid.rows) continue;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > BRUSH_RADIUS) continue;

      // 中心ほど多く、端ほど少なく
      const t = 1 - dist / BRUSH_RADIUS;
      const amount = t * t * STRENGTH;
      const i = (r * grid.cols + c) * N;
      let total = 0;
      for (let k = 0; k < N; k++) {
        d[i + k] += ratios[k] * amount;
        total += d[i + k];
      }
      if (total > TOTAL_CAP) {
        const s = TOTAL_CAP / total;
        for (let k = 0; k < N; k++) d[i + k] *= s;
      }
    }
  }

  return {
    c0: Math.max(0, cx - R),
    r0: Math.max(0, cy - R),
    c1: Math.min(grid.cols, cx + R + 1),
    r1: Math.min(grid.rows, cy + R + 1),
  };
}

/** 絵の具の量から、画面に出す色を決める。ほぼ何も無ければ null */
export function shownColor(a: Amounts): Shown | null {
  if (a.red + a.yellow + a.blue + a.white + a.black < 0.3) return null;
  const paint = mixPaint(a);
  // 薄く塗った所は白に近く、濃く塗るほど本来の色になる
  const density = Math.min(1, Math.max(a.red, a.yellow, a.blue, a.white, a.black) / 25);
  return {
    r: Math.round(255 + density * (paint.r - 255)),
    g: Math.round(255 + density * (paint.g - 255)),
    b: Math.round(255 + density * (paint.b - 255)),
    alpha: Math.min(1, density * 2.5),
  };
}

/** 透けた分を白で埋めた、目に見える色 */
function seenColor(a: Amounts): Rgb {
  const s = shownColor(a);
  if (!s) return { r: 255, g: 255, b: 255 };
  const over = (v: number) => Math.round(255 * (1 - s.alpha) + v * s.alpha);
  return { r: over(s.r), g: over(s.g), b: over(s.b) };
}

/** (cx, cy) の周りの色を吸い取る。塗られていなければ null */
export function sampleAt(grid: PaintGrid, cx: number, cy: number): Sample | null {
  const R = 2;
  const acc = [0, 0, 0, 0, 0];
  let weight = 0;

  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      const c = cx + dx, r = cy + dy;
      if (c < 0 || c >= grid.cols || r < 0 || r >= grid.rows) continue;
      const w = 1 / (1 + Math.sqrt(dx * dx + dy * dy));
      const i = (r * grid.cols + c) * N;
      for (let k = 0; k < N; k++) acc[k] += grid.data[i + k] * w;
      weight += w;
    }
  }
  if (weight > 0) for (let k = 0; k < N; k++) acc[k] /= weight;

  const total = acc.reduce((sum, v) => sum + v, 0);
  if (total <= 0.5) return null;
  return { ryb: toAmounts(acc.map((v) => v / total)), rgb: seenColor(toAmounts(acc)) };
}

/** 模様の1区画に塗られた色（区画全体の平均） */
export function sampleZone(grid: PaintGrid, zone: Zone): Rgb {
  const c0 = Math.max(0, Math.floor(zone.x * grid.cols));
  const r0 = Math.max(0, Math.floor(zone.y * grid.rows));
  const c1 = Math.min(grid.cols, Math.ceil((zone.x + zone.w) * grid.cols));
  const r1 = Math.min(grid.rows, Math.ceil((zone.y + zone.h) * grid.rows));

  const acc = [0, 0, 0, 0, 0];
  let count = 0;
  for (let r = r0; r < r1; r++) {
    for (let c = c0; c < c1; c++) {
      const i = (r * grid.cols + c) * N;
      for (let k = 0; k < N; k++) acc[k] += grid.data[i + k];
      count++;
    }
  }
  if (count > 0) for (let k = 0; k < N; k++) acc[k] /= count;
  return seenColor(toAmounts(acc));
}

/** 模様のお題の判定。区画ごとの近さを平均する。colors は区画ごとに塗られていた色 */
export function judgeZones(grid: PaintGrid, zones: readonly Zone[]): { colors: Rgb[]; detail: SimilarityDetail } {
  const colors = zones.map((zone) => sampleZone(grid, zone));
  const details = zones.map((zone, i) => colorSimilarityDetail(colors[i], mixPaint(zone.recipe)));
  const average = (pick: (d: SimilarityDetail) => number) =>
    Math.round(details.reduce((sum, d) => sum + pick(d), 0) / details.length);
  return {
    colors,
    detail: {
      overall: average((d) => d.overall),
      lightness: average((d) => d.lightness),
      chroma: average((d) => d.chroma),
    },
  };
}

/** 今の塗りの写し（元に戻す用） */
export function snapshot(grid: PaintGrid): Float32Array {
  return grid.data.slice();
}

export function restore(grid: PaintGrid, saved: Float32Array): void {
  grid.data.set(saved);
}

export function clearGrid(grid: PaintGrid): void {
  grid.data.fill(0);
}
