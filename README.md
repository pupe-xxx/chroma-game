# web-game-template

ブラウザで動くゲームの型。TypeScript + Vite + Canvas。ゲームエンジンは使わない。
見本として三目並べが入っている。新しいゲームは、この型をコピーして `src/game` と `src/ui` を書き換えて作る。

## 新しいゲームを始める

1. GitHub で、このリポジトリの「Use this template」から新しいリポジトリを作る（1つのゲームは1つのリポジトリ）
2. 手元に取ってくる: `git clone https://github.com/pupe-xxx/<名前>.git C:\dev\<名前>`
3. `npm install` → `npm run dev`
4. `package.json` の `name`、`index.html` の `<title>`、`src/main.ts` のセーブの名前（`createSave` の1つ目）をゲームの名前に変える
5. `src/game`（ルール）と `src/ui`（画面）を書き換える

## コマンド

| コマンド | すること |
|---|---|
| `npm run dev` | 手元で動かす（保存すると画面がすぐ変わる） |
| `npm test` | ルールの自動テスト |
| `npm run sim -- 1000` | 画面なしで CPU 同士を 1000 試合対戦させ、勝敗の内訳を出す |
| `npm run typecheck` | 型の検査（ルール側が画面に触れていないかも見る） |
| `npm run build` | 検査してから `dist/` に公開用のファイルを作る |
| `npm run preview` | `dist/` の中身を手元で開く |

## フォルダ

```
src/
  main.ts    入口。下の3つをつなぐ
  kit/       どのゲームでも使う共通部分
    rng.ts       種を固定できる乱数
    scale.ts     画面サイズの調整（論理サイズで描けば、実際の大きさは合わせてくれる）
    audio.ts     音（ファイルが無くても仮の効果音が鳴る）
    save.ts      セーブ（保存できない環境でも止まらない）
    platform/    ゲームサイトの広告 SDK の差し込み口
  game/      ルール。画面の処理に触れない
  ui/        描画と操作
tests/       ルールと共通部分のテスト
scripts/     画面なしの対戦
```

## 守ること

- **`src/game` は画面に触れない。** `document`・Canvas を使うと `npm run typecheck` がエラーになる。こうしておくと、ルールをテストでき、CPU 同士を画面なしで対戦させられる
- **ルール側で `Math.random` を使わない。** `kit/rng.ts` の乱数を引数で受け取る。同じ種なら同じ試合になるので、不具合を再現できる
- **CPU はどちらの番でも指せるように書く。** 片方専用にすると CPU 同士の対戦ができない
- **描画は論理サイズの座標で書く。** 画面の実寸や `devicePixelRatio` を描画のコードに持ち込まない
- **広告・計測は `kit/platform` の形を通して呼ぶ。** ゲーム本体に SDK を直接書かない

## 公開

- **GitHub Pages**: `main` に push すると、テスト → ビルド → 公開まで自動で進む（`.github/workflows/pages.yml`）。テストかビルドが失敗したら公開されない。初回だけ、リポジトリの Settings → Pages → Source を「GitHub Actions」にする
- **ゲームサイト（Poki・CrazyGames など）**: 今は差し込み口だけで、SDK は入っていない。載せると決めたら、公式の資料を見て `src/kit/platform/` にそのサイト用のファイルを足す（手順は `platform/index.ts` の説明）。ビルドは相対パスで出力するので、`dist/` の中身を zip にすればそのまま渡せる

## 共通部分を直した時

共通部分（`src/kit`）はゲームごとにコピーされる。直した内容は、既存のゲームには自動では届かない。
どのゲームにも効く修正は、この型にも入れておく。既存のゲームには、必要になった時に `src/kit` を上書きして取り込む。
