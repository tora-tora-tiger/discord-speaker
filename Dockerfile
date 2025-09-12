# マルチステージビルド：ビルドステージ
FROM node:18-alpine as builder

# ワーキングディレクトリを設定
WORKDIR /app

# pnpmをグローバルにインストール
RUN npm install -g pnpm

# レイヤーキャシングのためにpackageファイルを先にコピー
COPY package.json pnpm-lock.yaml ./

# 依存関係をインストール
RUN pnpm install --frozen-lockfile

# ソースコードをコピー
COPY . .

# TypeScriptをビルド
RUN pnpm run build

# 実行ステージ：最終イメージ
FROM node:18-alpine

# ワーキングディレクトリを設定
WORKDIR /app

# pnpmをグローバルにインストール
RUN npm install -g pnpm

# ビルド成果物と依存関係のみをコピー
COPY --from=builder /app/package.json pnpm-lock.yaml ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules

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

# Botを起動（ビルド後のJSファイルを実行）
CMD ["node", "build/index.js"]