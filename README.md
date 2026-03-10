# Discord Speaker
Discordの特定チャンネルを監視し、投稿メッセージをVOICEVOXで読み上げるBotです。

# コマンド
- `/join` - 実行ユーザーが接続中のVCに参加し、実行チャンネルの投稿を読み上げ対象にします
- `/bye` - VCから切断します
- `/set-model` - 読み上げ話者IDを設定します（個人/サーバー）
- `/set-speaker` - 旧話者設定コマンド
- `/set-speed` - 読み上げ速度を設定します
- `/set-volume` - 読み上げ音量を設定します

# 歌唱入力フォーマット（ABC記法）
通常の文章はTTSで読み上げます。  
`K:` を含むABCテキストは歌唱APIに切り替えます。

有効例（`cc-docs/input.txt`）:
```abc
X:1
T:故郷(ふるさと)
M:3/4
L:1/4
C:高野辰之 作詞・ 岡野貞一 作曲
K:G
V:1
"G"G G G|"D"A > B A|"G"B B c|d3
w:う さ ぎ|お い し|か の や|ま
```

## 変換ルール（VOICEVOX）
- `abcjs` でABCをパースし、ノート列をVOICEVOX `notes[]` に変換
- `midiPitches` からMIDIキー（0-127）を取得
- ノート長は `abcjs` の `duration` / `getBpm()` / `getBeatLength()` から `frame_length` に変換
- 休符は `key: null, lyric: ""`
- 歌詞は `w:` 行を使用。空歌詞は自動で補完（`あ` または `ー`）

## 実装上の制約
- 現在は「最初に見つかったメロディ声部（1声部）」を歌唱対象にします
- 和音（同時複数音）は最高音を採用
- `K:` がない入力はABCとして扱いません

## 話者ID
- 歌唱は話者ID `6000`（波音リツ sing）固定
- `/set-model` や `/set-speaker` は通常TTS側のみへ適用

# How to start server
`.env` をプロジェクトルートに配置してください。

```config.json
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID= # 開発時は設定推奨（ギルド即時反映）
TTS_HOST= # pnpm devなら127.0.0.1 / botをdockerで動かすならvoicevox
TTS_PORT=50021
```

```bash
git clone https://github.com/tora-tora-tiger/discord-speaker.git
cd discord-speaker
pnpm install
pnpm deploy-commands

# voicevoxだけdocker
docker compose up -d voicevox
pnpm dev
```
