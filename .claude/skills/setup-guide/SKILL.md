---
name: setup-guide
description: Use when setting up redmine-log for the first time — clone, install, configure Redmine connection, set up MCP/Claude integration, and verify everything works. Also use when troubleshooting installation or configuration issues.
---

# redmine-log Setup Guide

## Overview

redmine-log 是 Node.js CLI 工具，快速登打 Redmine 工時。支援別名、模糊匹配、批次登打，並整合 Claude MCP。

**前置需求：** Node.js >= 22、Redmine 帳號 + API Key

## Quick Setup (5 分鐘)

```bash
# 1. Clone & Install
git clone https://github.com/cyl-jsl/redmine-log.git
cd redmine-log
npm install

# 2. Build & Register CLI
npm run build && npm link

# 3. Initialize (互動式設定 Redmine URL + API Key)
redmine-log init

# 4. Verify
redmine-log view
```

完成。以下為各步驟的詳細說明。

---

## Step 1: 取得 Redmine API Key

1. 登入你的 Redmine
2. 右上角「我的帳戶」
3. 頁面右側「API 存取金鑰」→ 點「顯示」→ 複製

## Step 2: Clone & Install

```bash
git clone https://github.com/cyl-jsl/redmine-log.git
cd redmine-log
```

確認 Node.js 版本：

```bash
node -v   # 須 >= 22.0.0
nvm use   # 若使用 nvm，專案有 .nvmrc
```

安裝依賴：

```bash
npm install
```

## Step 3: Build & Register CLI

```bash
npm run build    # TypeScript 編譯至 dist/
npm link         # 註冊全域指令 redmine-log 和 redmine-log-mcp
```

`npm link` 會同時註冊兩個全域指令：
- `redmine-log` — CLI 工具
- `redmine-log-mcp` — MCP Server（供 Claude Code 使用）

驗證：

```bash
redmine-log --version      # 應顯示 0.1.0
which redmine-log-mcp      # 應顯示路徑，確認 MCP 指令已註冊
```

## Step 4: Initialize

```bash
redmine-log init
```

會依序詢問：

1. **Redmine URL** — `https://redmine.example.com`（不含尾斜線）
2. **API Key** — Step 1 取得的金鑰

Init 自動完成：
- 驗證 API 連線
- 取得所有專案與活動類型
- 嘗試取得「歸屬部門」自訂欄位（非管理員會收到 403，不影響基本功能）
- 儲存配置到 `~/.config/redmine-log/`

```
~/.config/redmine-log/
├── config.json    # URL + API Key + 自訂欄位 ID
├── cache.json     # 專案/活動快取 (24h TTL)
└── aliases.json   # 別名對照表
```

**非管理員提示：** 若看到 `Cannot access custom fields (403)`，可輸入歸屬部門欄位 ID（問管理員），或直接 skip。

## Step 5: Verify

```bash
# 查看今天的工時
redmine-log view

# 查看本週工時
redmine-log view week

# 測試登打（替換為你的專案名和活動）
redmine-log add 0.5h MyProject 開發 -c "測試登打"

# 確認登打成功
redmine-log view
```

## Step 6: 設定別名（建議）

```bash
# 專案別名
redmine-log alias set projects fe FrontEnd
redmine-log alias set projects be BackEnd

# 活動別名
redmine-log alias set activities dev 開發
redmine-log alias set activities mtg 會議

# 部門別名
redmine-log alias set depts rd 研發部

# 之後可用短名稱
redmine-log add 4h fe dev -c "實作功能"
```

查看所有別名：

```bash
redmine-log alias list
```

## Step 7: Claude Code 整合（MCP + Skill）

讓 Claude 在任何目錄都能透過自然語言登打工時。

### MCP Server（全域）

```bash
claude mcp add redmine-log -s user -- redmine-log-mcp
```

> 需先完成 Step 3 的 `npm link`，確保 `redmine-log-mcp` 指令已註冊。

### Skill 安裝（全域 symlink）

```bash
ln -sf "$(pwd)/.claude/skills/redmine-log" ~/.claude/skills/redmine-log
```

> 使用 symlink 確保全域 Skill 始終與專案同步，不需手動更新。

### 驗證

1. **MCP：** 在 Claude Code 中請 AI 呼叫 `list_activities`，確認 MCP Server 正常回應
2. **Skill：** 說「幫我看這禮拜的工時」，確認 AI 能正確呼叫 `view_time_entries` 並回傳結果

> **開發者備註：** 專案內的 `.mcp.json` 僅供開發時使用。一般使用者請依上述全域指令安裝。

## CLI 指令速查

| 指令 | 用途 | 範例 |
|------|------|------|
| `init` | 初始化連接 | `redmine-log init` |
| `add` | 單筆登打 | `redmine-log add 4h fe dev -c "描述"` |
| `add` | 指定 Issue | `redmine-log add 2h fe #1234 dev` |
| `add` | 指定日期 | `redmine-log add 3h fe dev -d yesterday` |
| `add` | 指定部門 | `redmine-log add 4h fe dev --dept rd` |
| `batch` | CSV 批次登打 | `redmine-log batch file.csv` |
| `view` | 查看今天工時 | `redmine-log view` |
| `view` | 查看本週工時 | `redmine-log view week` |
| `view` | 查看日期範圍 | `redmine-log view 2026-03-01:2026-03-04` |
| `sync` | 更新專案/活動快取 | `redmine-log sync` |
| `alias` | 列出別名 | `redmine-log alias list` |
| `alias` | 設定別名 | `redmine-log alias set projects fe FrontEnd` |
| `alias` | 刪除別名 | `redmine-log alias rm projects fe` |

## Troubleshooting

| 症狀 | 原因 | 解法 |
|------|------|------|
| `Not initialized` | 無 config.json | `redmine-log init` |
| `No cache` | 無 cache.json | `redmine-log sync` |
| `401 Unauthorized` | API Key 無效 | 重新取得 API Key，再跑 `init` |
| `fetch failed` | 網路問題或 URL 錯誤 | 確認 URL、網路、VPN |
| `403 custom fields` | 非管理員帳號 | init 時手動輸入欄位 ID 或 skip |
| `Project not found` | 快取過期或名稱不匹配 | `redmine-log sync`，或設定別名 |
| `Activity not found` | 活動名稱不匹配 | `redmine-log sync` 確認活動列表 |
| `command not found: redmine-log` | 未 npm link | 重新 `npm run build && npm link` |

## 開發模式

不想全域安裝時，可直接開發模式執行：

```bash
npm run dev -- init          # 等同 redmine-log init
npm run dev -- add 4h fe dev # 等同 redmine-log add ...
npm run dev -- view week     # 等同 redmine-log view week
```

測試：

```bash
npm test             # 跑所有測試
npm run test:watch   # 監聽模式
```
