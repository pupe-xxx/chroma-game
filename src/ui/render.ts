import { mixPaint, type Rgb } from '../game/color';
import { amountsAt, shownColor, type CellRect, type PaintGrid } from '../game/paint';
import type { Pattern, Zone } from '../game/patterns';

/** 1マスの大きさ（論理サイズ） */
export const CELL = 5;
export const GRID = { cols: 192, rows: 128 } as const;

// 論理サイズ。描画はすべてこの座標で書く（実際の大きさは kit/scale が合わせる）
export const VIEW = { width: GRID.cols * CELL, height: GRID.rows * CELL } as const;

/** お題・結果の小さな見本の大きさ（index.html の canvas の width・height と合わせる） */
export const PREVIEW = { width: 140, height: 92 } as const;

const css = ({ r, g, b }: Rgb, alpha = 1) => `rgba(${r},${g},${b},${alpha})`;

/** 塗った絵の具の絵。1マスを1点として持ち、描く時に引き伸ばす */
export interface PaintLayer {
  readonly image: HTMLCanvasElement;
  /** 塗る面の内容を絵に写す。rect を渡すと、その範囲だけ */
  update(grid: PaintGrid, rect?: CellRect): void;
}

export function createPaintLayer(): PaintLayer {
  const image = document.createElement('canvas');
  image.width = GRID.cols;
  image.height = GRID.rows;
  const ctx = image.getContext('2d')!;
  const pixels = ctx.createImageData(GRID.cols, GRID.rows);

  return {
    image,
    update(grid, rect = { c0: 0, r0: 0, c1: grid.cols, r1: grid.rows }) {
      for (let r = rect.r0; r < rect.r1; r++) {
        for (let c = rect.c0; c < rect.c1; c++) {
          const i = (r * GRID.cols + c) * 4;
          const shown = shownColor(amountsAt(grid, c, r));
          pixels.data[i] = shown?.r ?? 0;
          pixels.data[i + 1] = shown?.g ?? 0;
          pixels.data[i + 2] = shown?.b ?? 0;
          pixels.data[i + 3] = shown ? Math.round(shown.alpha * 255) : 0;
        }
      }
      ctx.putImageData(pixels, 0, 0, rect.c0, rect.r0, rect.c1 - rect.c0, rect.r1 - rect.r0);
    },
  };
}

/** 塗る面を描く。下から順に、紙・模様の区切り・絵の具 */
export function draw(ctx: CanvasRenderingContext2D, layer: PaintLayer, pattern: Pattern, guideMode: boolean): void {
  const { width: w, height: h } = VIEW;

  const paper = ctx.createRadialGradient(w * 0.35, h * 0.38, 60, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  paper.addColorStop(0, '#f4ece0');
  paper.addColorStop(0.5, '#ece0ca');
  paper.addColorStop(1, '#d8ccb4');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);

  if (pattern.zones.length > 1) {
    for (const zone of pattern.zones) {
      const x = zone.x * w, y = zone.y * h, zw = zone.w * w, zh = zone.h * h;
      if (guideMode) {
        ctx.fillStyle = css(mixPaint(zone.recipe), 0.28);
        ctx.fillRect(x, y, zw, zh);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, zw - 2, zh - 2);
    }
  }

  // 引き伸ばす時になめらかにつなぐので、マス目の角は見えない
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(layer.image, 0, 0, w, h);
}

/** 小さな見本に、区画ごとの色を描く。colors を渡さなければお題の色 */
export function drawPreview(canvas: HTMLCanvasElement, zones: readonly Zone[], colors?: readonly Rgb[]): void {
  const ctx = canvas.getContext('2d')!;
  const { width: w, height: h } = PREVIEW;
  ctx.clearRect(0, 0, w, h);
  zones.forEach((zone, i) => {
    ctx.fillStyle = css(colors?.[i] ?? mixPaint(zone.recipe));
    ctx.fillRect(zone.x * w, zone.y * h, zone.w * w + 0.5, zone.h * h + 0.5);
  });
}

/** 小さな見本を空にする。模様のお題では、区画の形だけ灰色で出す */
export function clearPreview(canvas: HTMLCanvasElement, zones: readonly Zone[]): void {
  const ctx = canvas.getContext('2d')!;
  const { width: w, height: h } = PREVIEW;
  ctx.clearRect(0, 0, w, h);
  if (zones.length <= 1) return;
  ctx.fillStyle = 'rgba(80,80,90,0.35)';
  for (const zone of zones) ctx.fillRect(zone.x * w, zone.y * h, zone.w * w + 0.5, zone.h * h + 0.5);
}
