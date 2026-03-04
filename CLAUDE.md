# Redmine 工時自動化工具

CLI 工具 + Claude MCP/Skill 整合，快速登打 Redmine 工時。

## 技術棧

- Node.js v23, TypeScript ESM
- commander (CLI framework)
- chalk (terminal styling)
- fastest-levenshtein (fuzzy matching)
- vitest (testing)

## 開發指令

```bash
npm test          # 跑測試 (vitest run)
npm run build     # 編譯 TypeScript (tsc)
npm run dev       # 開發模式執行 (tsx src/index.ts)
npm run test:watch # 監聽模式測試
```

## 架構

```
src/
├── index.ts              # CLI 入口 (commander)
├── types.ts              # 共用型別定義
├── lib/                  # 核心模組
│   ├── config.ts         # Config 讀寫 (~/.config/redmine-log/)
│   ├── cache.ts          # 專案/活動快取 (TTL)
│   ├── alias-resolver.ts # 別名 + 模糊匹配
│   ├── redmine-client.ts # Redmine REST API client
│   └── parse-utils.ts    # 時數/日期解析
├── commands/             # CLI 子指令
│   ├── init.ts           # 初始化設定
│   ├── add.ts            # 單筆登打
│   ├── batch.ts          # CSV 批次登打
│   ├── view.ts           # 查看工時
│   ├── sync.ts           # 同步專案/活動快取
│   └── alias.ts          # 管理別名
└── __tests__/            # 測試檔案
```

## Config 路徑

`~/.config/redmine-log/` (遵循 XDG_CONFIG_HOME)

- `config.json` — Redmine URL、API Key、自訂欄位 ID
- `cache.json` — 專案/活動/部門快取
- `aliases.json` — 別名對照表

## 重要慣例

- ESM：import 路徑必須加 `.js` 副檔名
- 測試框架：vitest
- TypeScript：strict mode
- 所有 API 呼叫使用 native `fetch`（Node.js 內建）
