# Discord Speaker
Discordで特定のチャンネルを監視し、そのチャンネルに投稿されたメッセージをvoicevoxの音声で読み上げます

# コマンド
- `/join` - コマンドを使用したユーザが接続しているVCに参加し、`/join`コマンドを打ったチャンネルに投稿されたメッセージの読み上げを行います
- `/bye` - VCから切断します
- `/set-speaker` - 番号を指定することでvoicevoxの読み上げるキャラクターを変更します
- `/set-speed` - 読み上げスピードを変更します

# How to start server
botを起動する
discord botに接続するために，`.env`をトップに置いて下さい
```config.json
DISCORD_TOKEN=
CLIENT_ID=
```
```
$ git clone https://github.com/tora-tora-tiger/discord-speaker.git
$ cd discord-speaker
$ docker compose --profile voicevox up -d
```