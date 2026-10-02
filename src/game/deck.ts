// お題を出す順番。全部を1回ずつ出し切ってから、混ぜ直す。
import type { Rng } from '../kit/rng';

export interface Deck {
  /** 次のお題の番号 */
  next(): number;
}

export function createDeck(size: number, rng: Rng): Deck {
  let order: number[] = [];
  let index = 0;

  const shuffle = () => {
    order = Array.from({ length: size }, (_, i) => i);
    for (let i = size - 1; i > 0; i--) {
      const j = rng.int(i + 1);
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }
    index = 0;
  };
  shuffle();

  return {
    next() {
      if (index >= order.length) shuffle();
      return order[index++];
    },
  };
}
