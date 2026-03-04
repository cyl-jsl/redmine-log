---
name: redmine-time-log
description: 登打 Redmine 工時。觸發於使用者提及登打工時、記錄工時、log time 等關鍵字。
---

# Redmine 工時登打 Skill

## 觸發條件

使用者提及以下關鍵字時觸發：
- 登打工時、記錄工時、填工時、報工時
- log time、add time entry、track hours

## 流程

### 1. 解析使用者輸入

從自然語言中擷取以下欄位（參考 `references/field-mapping.md`）：

| 欄位 | 必填 | 範例 |
|------|------|------|
| 專案 (project) | 是 | "ABC 專案"、專案代碼 |
| 時數 (hours) | 是 | "4h"、"30m"、"1.5" |
| 活動類型 (activity) | 是 | "開發"、"會議" |
| 日期 (date) | 否（預設 today） | "今天"、"昨天"、"03/04" |
| Issue 編號 | 否 | "#1234" |
| 部門 (dept) | 否 | 歸屬部門名稱 |
| 備註 (comment) | 否 | 工作內容說明 |

### 2. 補問缺失必填欄位

若缺少必填欄位，向使用者詢問。一次補問所有缺失欄位。

### 3. 確認並送出

整理所有欄位，向使用者確認後，透過 MCP `redmine` server 呼叫 Redmine API 建立工時記錄：

```
使用 mcp redmine 的 create_time_entry 工具：
- project_id: 專案 ID（需先查詢）
- issue_id: Issue 編號（選填）
- spent_on: 日期 (YYYY-MM-DD)
- hours: 時數（小數）
- activity_id: 活動類型 ID（需先查詢）
- comments: 備註
- custom_fields: [{ id: <deptFieldId>, value: "部門名稱" }]（選填）
```

### 4. 查詢輔助

若使用者不確定專案名稱或活動類型，可透過 MCP 查詢：
- `list_projects` — 列出可用專案
- `list_time_entry_activities` — 列出活動類型

## 批次登打

若使用者提供多筆工時，逐筆建立，每筆確認後送出。

## 注意事項

- 日期格式參考 field-mapping.md
- 時數支援 `4h`、`30m`、`1.5` 格式，統一轉為小數小時
- 專案和活動類型支援模糊匹配
