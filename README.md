# Discord Speaker
Discordで特定のチャンネルを監視し、そのチャンネルに投稿されたメッセージをvoicevoxの音声で読み上げます

# コマンド
- `/join` - コマンドを使用したユーザが接続しているVCに参加し、`/join`コマンドを打ったチャンネルに投稿されたメッセージの読み上げを行います
- `/bye` - VCから切断します
- `/set-speaker` - 番号を指定することでvoicevoxの読み上げるキャラクターを変更します
- `/set-speed` - 読み上げスピードを変更します

# 歌唱フォーマット
通常の文章はこれまで通りTTSで読み上げます。  
以下の形式で送ると、歌唱APIに切り替わります。

例:
```text
120
A3 あ, B3 い, D3 うおあ
```

- 1行目: BPM（例: `120`）
- 2行目以降: `音名+オクターブ 歌詞` をカンマ区切りで並べる（各要素は2トークン）
- 音名は `C D E F G A B`、シャープ/フラットは `#` / `b` に対応
- 休符は `R` / `REST` / `-`
- 歌詞は空白なし（空白を入れる場合は現状未対応）
- 歌詞が複数モーラの場合（例: `うおあ`）は内部で1モーラずつに自動分割して同じ音程に割り当てます
- 歌唱を使うときは、`/set-model` などで歌唱対応スタイルIDを設定してください

# How to start server
botを起動する
discord botに接続するために，`.env`をトップに置いて下さい
```config.json
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID= # 開発時は設定推奨（ギルド即時反映）
```
```
$ git clone https://github.com/tora-tora-tiger/discord-speaker.git
$ cd discord-speaker
$ pnpm install
$ pnpm deploy-commands
$ docker compose --profile voicevox up -d
$ pnpm dev
```
