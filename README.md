# Prompt Compare

プロンプトの変更前後（Before/After）を並べて比較できるWebアプリケーションです。

## 機能

- **CSVファイルのアップロード**: ドラッグ&ドロップまたはクリックでCSVファイルを読み込み
- **Side-by-Side比較**: BeforeとAfterを左右に並べて表示
- **Markdownレンダリング**: プロンプト内のMarkdownを適切にレンダリング
- **Raw表示モード**: 生のテキストとしても確認可能
- **複数プロンプト対応**: CSVに複数行あれば、左サイドバーから切り替え可能

## CSVフォーマット

```csv
before,after
"# 古いプロンプト...","# 新しいプロンプト..."
```

または列名に `before`/`after`（または `old`/`new`, `original`/`updated`）を含む任意の列名が使用可能です。

`label`/`name`/`id` を含む列があれば、サイドバーでの表示名として使用されます。

## Vercelへのデプロイ

### 方法1: Vercel CLIを使用

```bash
npm i -g vercel
vercel
```

### 方法2: GitHubリポジトリ連携

1. このプロジェクトをGitHubにpush
2. [Vercel](https://vercel.com) にログイン
3. "Add New..." → "Project" を選択
4. GitHubリポジトリをインポート
5. "Deploy" をクリック

## ローカル開発

```bash
npm install
npm run dev
```

http://localhost:3000 でアクセス可能です。

## 技術スタック

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- PapaParse (CSV解析)
- react-markdown (Markdownレンダリング)
