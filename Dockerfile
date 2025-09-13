FROM node:18-alpine

# ワーキングディレクトリを設定
WORKDIR /app

# pnpmをグローバルにインストール
RUN npm install -g pnpm

# FFmpegをインストール
RUN apk add --no-cache ffmpeg

# レイヤーキャシングのためにpackageファイルを先にコピー
COPY package.json pnpm-lock.yaml ./

# 依存関係をインストール
RUN pnpm install --prod --frozen-lockfile

# ソースコードをコピー
COPY . .

# セキュリティのために非rootユーザーを作成
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bot -u 1001

# アプリディレクトリの所有権を変更
RUN chown -R bot:nodejs /app
USER bot

# ポートを公開（ヘルスチェックや将来のHTTPエンドポイント用）
EXPOSE 3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1

# Botを起動
CMD ["pnpm", "run", "start:nobuild"]