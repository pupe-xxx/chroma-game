import { describe, expect, it } from 'vitest';
import { colorSimilarityDetail, mixPaint, PIGMENTS, toHex, type Amounts } from '../src/game/color';
import { createDeck } from '../src/game/deck';
import {
  amountsAt, clearGrid, createGrid, judgeZones, paintAt, restore, sampleAt, sampleZone, shownColor, snapshot, TOTAL_CAP,
} from '../src/game/paint';
import { MULTI_ZONE_PATTERNS, PATTERNS, RECIPES } from '../src/game/patterns';
import { createRng } from '../src/kit/rng';

const none: Amounts = { red: 0, yellow: 0, blue: 0, white: 0, black: 0 };
const only = (part: Partial<Amounts>): Amounts => ({ ...none, ...part });
const total = (a: Amounts) => PIGMENTS.reduce((sum, k) => sum + a[k], 0);

describe('混色', () => {
  it('何も無ければ白、白だけなら白、黒だけなら黒', () => {
    expect(mixPaint(none)).toEqual({ r: 255, g: 255, b: 255 });
    expect(mixPaint(only({ white: 50 }))).toEqual({ r: 255, g: 255, b: 255 });
    expect(mixPaint(only({ black: 50 }))).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('1色だけなら、量に関係なくその色', () => {
    expect(mixPaint(only({ red: 10 }))).toEqual(mixPaint(only({ red: 300 })));
    expect(toHex(mixPaint(only({ red: 100 })))).toBe('#ff0d0d');
  });

  it('黄と青を同じだけ混ぜると緑になり、量が多いほど緑が強く出る', () => {
    const thin = mixPaint(only({ yellow: 10, blue: 10 }));
    const thick = mixPaint(only({ yellow: 100, blue: 100 }));
    expect(thick.g).toBeGreaterThan(thick.r);
    expect(thick.g).toBeGreaterThan(thick.b);
    expect(thick.g - thick.r).toBeGreaterThan(thin.g - thin.r);
  });

  it('白を足すと明るく、黒を足すと暗くなる', () => {
    const base = mixPaint(only({ blue: 100 }));
    const lighter = mixPaint(only({ blue: 100, white: 100 }));
    const darker = mixPaint(only({ blue: 100, black: 100 }));
    expect(lighter.r + lighter.g + lighter.b).toBeGreaterThan(base.r + base.g + base.b);
    expect(darker.r + darker.g + darker.b).toBeLessThan(base.r + base.g + base.b);
  });
});

describe('色の近さ', () => {
  it('同じ色は100、白と黒は0', () => {
    const c = { r: 120, g: 40, b: 200 };
    expect(colorSimilarityDetail(c, c)).toEqual({ overall: 100, lightness: 100, chroma: 100 });
    expect(colorSimilarityDetail({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 }).overall).toBe(0);
  });

  it('明るさだけが違う灰色どうしは、色みは満点のまま', () => {
    const d = colorSimilarityDetail({ r: 100, g: 100, b: 100 }, { r: 160, g: 160, b: 160 });
    expect(d.chroma).toBe(100);
    expect(d.lightness).toBeLessThan(100);
  });
});

describe('お題', () => {
  it('名前が重複していない', () => {
    const names = PATTERNS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('単色と模様を合わせた数になっている', () => {
    expect(PATTERNS).toHaveLength(RECIPES.length + MULTI_ZONE_PATTERNS.length);
  });

  it('模様の区画は塗る面の中に収まり、面積の合計が全体と同じ', () => {
    for (const pattern of MULTI_ZONE_PATTERNS) {
      let area = 0;
      for (const z of pattern.zones) {
        expect(z.x).toBeGreaterThanOrEqual(0);
        expect(z.y).toBeGreaterThanOrEqual(0);
        expect(z.x + z.w).toBeLessThanOrEqual(1 + 1e-9);
        expect(z.y + z.h).toBeLessThanOrEqual(1 + 1e-9);
        area += z.w * z.h;
      }
      expect(area).toBeCloseTo(1, 6);
    }
  });

  it('同じ種なら同じ順番で出る', () => {
    const a = createDeck(PATTERNS.length, createRng(5));
    const b = createDeck(PATTERNS.length, createRng(5));
    expect(Array.from({ length: 30 }, () => a.next())).toEqual(Array.from({ length: 30 }, () => b.next()));
  });

  it('全部を1回ずつ出し切ってから、次の周に入る', () => {
    const size = 12;
    const deck = createDeck(size, createRng(1));
    for (let round = 0; round < 3; round++) {
      const seen = Array.from({ length: size }, () => deck.next());
      expect([...seen].sort((x, y) => x - y)).toEqual(Array.from({ length: size }, (_, i) => i));
    }
  });
});

describe('塗る面', () => {
  it('塗った所に絵の具が入り、中心ほど多い。筆の外は変わらない', () => {
    const grid = createGrid(40, 40);
    const rect = paintAt(grid, 20, 20, only({ red: 1 }));
    expect(amountsAt(grid, 20, 20).red).toBeGreaterThan(amountsAt(grid, 23, 20).red);
    expect(amountsAt(grid, 23, 20).red).toBeGreaterThan(0);
    expect(total(amountsAt(grid, 27, 20))).toBe(0);
    expect(rect).toEqual({ c0: 15, r0: 15, c1: 26, r1: 26 });
  });

  it('端で塗っても範囲からはみ出さない', () => {
    const grid = createGrid(40, 40);
    expect(paintAt(grid, 0, 39, only({ blue: 1 }))).toEqual({ c0: 0, r0: 34, c1: 6, r1: 40 });
    expect(paintAt(grid, -50, -50, only({ blue: 1 }))).toBeDefined();
  });

  it('1マスの量は上限を超えず、新しい色が古い色を押し出す', () => {
    const grid = createGrid(20, 20);
    for (let i = 0; i < 60; i++) paintAt(grid, 10, 10, only({ red: 1 }));
    const before = amountsAt(grid, 10, 10);
    expect(total(before)).toBeCloseTo(TOTAL_CAP, 2);
    for (let i = 0; i < 10; i++) paintAt(grid, 10, 10, only({ blue: 1 }));
    const after = amountsAt(grid, 10, 10);
    expect(total(after)).toBeCloseTo(TOTAL_CAP, 2);
    expect(after.red).toBeLessThan(before.red);
    expect(after.blue).toBeGreaterThan(0);
  });

  it('薄く塗った所は透け、濃く塗ると本来の色になる', () => {
    expect(shownColor(none)).toBeNull();
    const thin = shownColor(only({ red: 2 }))!;
    const thick = shownColor(only({ red: 100 }))!;
    expect(thin.alpha).toBeLessThan(thick.alpha);
    expect(thick).toEqual({ ...mixPaint(only({ red: 100 })), alpha: 1 });
  });

  it('塗っていない所は吸い取れない。塗った所は、塗った割合で吸い取れる', () => {
    const grid = createGrid(40, 40);
    expect(sampleAt(grid, 20, 20)).toBeNull();
    for (let i = 0; i < 20; i++) paintAt(grid, 20, 20, only({ red: 0.75, white: 0.25 }));
    const sample = sampleAt(grid, 20, 20)!;
    expect(sample.ryb.red).toBeCloseTo(0.75, 4);
    expect(sample.ryb.white).toBeCloseTo(0.25, 4);
    expect(total(sample.ryb)).toBeCloseTo(1, 4);
  });

  it('元に戻せる。クリアすると空になる', () => {
    const grid = createGrid(20, 20);
    paintAt(grid, 5, 5, only({ yellow: 1 }));
    const saved = snapshot(grid);
    paintAt(grid, 5, 5, only({ black: 1 }));
    expect(amountsAt(grid, 5, 5).black).toBeGreaterThan(0);
    restore(grid, saved);
    expect(amountsAt(grid, 5, 5).black).toBe(0);
    expect(amountsAt(grid, 5, 5).yellow).toBeGreaterThan(0);
    clearGrid(grid);
    expect(total(amountsAt(grid, 5, 5))).toBe(0);
  });
});

describe('模様の判定', () => {
  const fill = (grid: ReturnType<typeof createGrid>, zone: { x: number; y: number; w: number; h: number }, a: Amounts) => {
    for (let r = Math.floor(zone.y * grid.rows); r < Math.ceil((zone.y + zone.h) * grid.rows); r++) {
      for (let c = Math.floor(zone.x * grid.cols); c < Math.ceil((zone.x + zone.w) * grid.cols); c++) {
        PIGMENTS.forEach((k, n) => (grid.data[(r * grid.cols + c) * PIGMENTS.length + n] = a[k]));
      }
    }
  };

  it('何も塗っていない区画は白として扱う', () => {
    const grid = createGrid(60, 40);
    expect(sampleZone(grid, { x: 0, y: 0, w: 1, h: 1, recipe: none })).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('どの模様も、区画ごとにお題どおりの配合で塗れば満点近くになる', () => {
    for (const pattern of MULTI_ZONE_PATTERNS) {
      const grid = createGrid(120, 80);
      for (const zone of pattern.zones) fill(grid, zone, zone.recipe);
      const { colors, detail } = judgeZones(grid, pattern.zones);
      expect(colors).toHaveLength(pattern.zones.length);
      expect(detail.overall, pattern.name).toBeGreaterThanOrEqual(95);
    }
  });

  it('区画の色を入れ違いに塗ると点が下がる', () => {
    const pattern = MULTI_ZONE_PATTERNS.find((p) => p.name === 'ドイツ国旗')!;
    const grid = createGrid(120, 80);
    const [a, b, c] = pattern.zones;
    fill(grid, a, c.recipe);
    fill(grid, b, a.recipe);
    fill(grid, c, b.recipe);
    expect(judgeZones(grid, pattern.zones).detail.overall).toBeLessThan(60);
  });
});
