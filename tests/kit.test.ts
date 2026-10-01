import { describe, expect, it } from 'vitest';
import { createRng } from '../src/kit/rng';
import { createSave, type StorageLike } from '../src/kit/save';

function fakeStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('乱数', () => {
  it('同じ種なら同じ並びになる', () => {
    const a = createRng(7), b = createRng(7);
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(Array.from({ length: 20 }, () => b.next()));
  });

  it('種が違えば並びが違う', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });

  it('int は範囲内の整数、pick は配列の要素を返す', () => {
    const rng = createRng(3);
    for (let i = 0; i < 500; i++) {
      const n = rng.int(6);
      expect(Number.isInteger(n) && n >= 0 && n < 6).toBe(true);
      expect(['a', 'b', 'c']).toContain(rng.pick(['a', 'b', 'c']));
    }
  });
});

describe('セーブ', () => {
  it('保存した内容を読み戻せる', () => {
    const storage = fakeStorage();
    createSave('k', { wins: 0 }, storage).save({ wins: 3 });
    expect(createSave('k', { wins: 0 }, storage).load()).toEqual({ wins: 3 });
  });

  it('保存が無ければ既定値、後から足した項目も既定値で埋まる', () => {
    const storage = fakeStorage();
    expect(createSave('k', { wins: 0 }, storage).load()).toEqual({ wins: 0 });
    storage.setItem('k', JSON.stringify({ wins: 2 }));
    expect(createSave('k', { wins: 0, muted: false }, storage).load()).toEqual({ wins: 2, muted: false });
  });

  it('壊れたデータでも既定値で動く', () => {
    const storage = fakeStorage();
    storage.setItem('k', '{こわれた');
    expect(createSave('k', { wins: 0 }, storage).load()).toEqual({ wins: 0 });
  });

  it('保存できない環境でもエラーにならない', () => {
    const broken: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    const save = createSave('k', { wins: 0 }, broken);
    expect(() => save.save({ wins: 1 })).not.toThrow();
    expect(save.load()).toEqual({ wins: 0 });
    expect(() => save.clear()).not.toThrow();
  });
});
