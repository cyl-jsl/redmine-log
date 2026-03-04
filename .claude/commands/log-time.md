---
description: 快速登打 Redmine 工時
allowed-tools: mcp__redmine__*
user-invocable: true
---

# 登打工時

使用者想要登打工時。請依照以下步驟處理：

## 使用者輸入

$ARGUMENTS

## 步驟

1. **解析輸入**：從使用者的描述中擷取工時資訊（專案、時數、活動類型、日期、Issue、部門、備註）
2. **補問缺失欄位**：若缺少必填欄位（專案、時數、活動類型），一次詢問所有缺失項目
3. **查詢 ID**：
   - 透過 MCP `redmine` server 的 `list_projects` 找到專案 ID
   - 透過 `list_time_entry_activities` 找到活動類型 ID
4. **確認**：整理所有欄位，向使用者確認
5. **送出**：呼叫 MCP `create_time_entry` 建立工時記錄

## 日期格式

- 「今天」→ 今天日期
- 「昨天」→ 昨天日期
- 「3/4」→ 當年 03-04
- 直接指定 YYYY-MM-DD

## 時數格式

- `4h` → 4 小時
- `30m` → 0.5 小時
- `1.5` → 1.5 小時
