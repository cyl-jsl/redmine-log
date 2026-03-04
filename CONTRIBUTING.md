# Contributing to redmine-log

感謝你有興趣為 redmine-log 做出貢獻！以下是參與開發的流程指南。

## 開發環境

- Node.js >= 22.0.0
- npm

```bash
git clone https://github.com/cyl-jsl/redmine-log.git
cd redmine-log
npm install
npm test
```

## 開發流程

1. Fork 或建立 feature branch：`git checkout -b feat/my-feature`
2. 撰寫測試（我們使用 vitest）
3. 實作功能
4. 確認測試通過：`npm test`
5. 確認 build 成功：`npm run build`
6. 提交 PR

## 程式碼風格

- TypeScript strict mode
- ESM：import 路徑必須加 `.js` 副檔名
- API 呼叫使用 Node.js 內建 `fetch`（不使用 axios 等第三方套件）
- 測試檔案放在 `src/__tests__/`

## Commit 訊息

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat:` 新功能
- `fix:` Bug 修復
- `docs:` 文件
- `chore:` 維護（CI、依賴更新等）
- `refactor:` 重構
- `test:` 測試

## 回報問題

請使用 GitHub Issues，描述：

1. 你的環境（Node.js 版本、OS）
2. 重現步驟
3. 預期行為 vs 實際行為

## 程式碼結構

```
src/
├── index.ts          # CLI 入口
├── types.ts          # 型別定義
├── lib/              # 核心邏輯
├── commands/         # CLI 子指令
└── __tests__/        # 測試
```
