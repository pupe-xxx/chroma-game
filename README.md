# Chroma

お題の色を、絵の具を混ぜて再現するゲーム。赤・黄・青・白・黒を塗り重ねて色を作り、どれだけ近いかを判定する。

遊ぶ: https://pupe-xxx.github.io/chroma-game/

## 遊び方

1. 下の絵の具を選び、紙の上をなぞって塗る。重ねた所は混ざる
2. 🎯 を押してから紙の上の色を選ぶと、それが「あなたの色」になる
3. 「判定する」で、お題との近さが出る
4. 模様のお題（国旗・風景など）は、区切りごとに塗り分けて「判定する」

🔬 で紙の上の色をカスタムに保存でき、その色でも塗れる。Ctrl+Z で1つ戻す。

## 作り

TypeScript + Vite + Canvas。ゲームエンジンは使わない。[web-game-template](https://github.com/pupe-xxx/web-game-template) から作った。

| コマンド | すること |
|---|---|
| `npm run dev` | 手元で動かす（保存すると画面がすぐ変わる） |
| `npm test` | ルールの自動テスト |
| `npm run typecheck` | 型の検査（ルール側が画面に触れていないかも見る） |
| `npm run build` | 検査してから `dist/` に公開用のファイルを作る |
| `npm run preview` | `dist/` の中身を手元で開く |

```
src/
  main.ts    入口。下の3つをつなぐ
  kit/       どのゲームでも使う共通部分（乱数・画面サイズ・音・セーブ・広告の差し込み口）
  game/      ルール。画面の処理に触れない
    color.ts     混色と、色の近さの判定
    paint.ts     塗る面（マス目ごとの絵の具の量）
    patterns.ts  お題のデータ
    deck.ts      お題を出す順番
  ui/        描画と見た目
tests/       ルールと共通部分のテスト
```

## 守ること

- **`src/game` は画面に触れない。** `document`・Canvas を使うと `npm run typecheck` がエラーになる
- **ルール側で `Math.random` を使わない。** `kit/rng.ts` の乱数を引数で受け取る
- **描画は論理サイズの座標で書く。** 画面の実寸や `devicePixelRatio` を描画のコードに持ち込まない
- **広告・計測は `kit/platform` の形を通して呼ぶ。** ゲーム本体に SDK を直接書かない

## 公開

`main` に push すると、テスト → ビルド → GitHub Pages への公開まで自動で進む（`.github/workflows/pages.yml`）。テストかビルドが失敗したら公開されない。
