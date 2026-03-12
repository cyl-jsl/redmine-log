# Field Mapping Reference

## CLI 欄位 → Redmine API 欄位

| CLI 欄位 | CLI 選項 | Redmine API 欄位 | 型別 | 說明 |
|----------|----------|-------------------|------|------|
| hours | 位置參數 | `hours` | number | 小數小時 |
| project | 位置參數 | `project_id` | number | 專案 ID（需從名稱/代碼查詢） |
| activity | 位置參數 | `activity_id` | number | 活動類型 ID（需從名稱查詢） |
| issue | `#123` 位置參數 | `issue_id` | number | Issue 編號（選填） |
| date | `-d, --date` | `spent_on` | string | YYYY-MM-DD 格式 |
| comment | `-c, --comment` | `comments` | string | 工作內容說明 |
| dept | `--dept` | `custom_fields[].value` | string | 歸屬部門（自訂欄位） |

## 活動類型 (Activities)

常見活動類型（實際清單依 Redmine 設定而異，可透過 `redmine-log sync` 或 MCP `list_activities` 取得）：

| 名稱 | 說明 |
|------|------|
| 開發 | 程式開發、coding |
| 會議 | 會議、meeting |
| QA | 測試、品質保證 |
| 設計 | UI/UX 設計、系統設計 |
| 文件 | 文件撰寫、documentation |
| 管理 | 專案管理、行政作業 |
| 支援 | 技術支援、客戶服務 |

## 部門 (Dept) 格式

- 部門值為 Redmine 自訂欄位的可選值
- 透過 `redmine-log sync` 同步後存於本地 cache
- 支援模糊匹配（fuzzy match）

## 日期格式

| 格式 | 範例 | 說明 |
|------|------|------|
| `today` | `today` | 今天（預設值） |
| `yesterday` | `yesterday` | 昨天 |
| `MM/DD` | `03/04` | 當年的月/日 |
| `YYYY-MM-DD` | `2026-03-04` | 完整日期 |

自然語言對應：
- 「今天」→ `today`
- 「昨天」→ `yesterday`
- 「3月4日」、「3/4」 → `03/04`

## 工時格式

| 格式 | 範例 | 轉換結果 |
|------|------|----------|
| `Nh` | `4h` | 4.00 小時 |
| `Nm` | `30m` | 0.50 小時 |
| 小數 | `1.5` | 1.50 小時 |
| 整數 | `2` | 2.00 小時 |

## Batch CSV 格式

```
# date, project, issue, hours, activity, dept, comment
03/04, MyProject, #123, 4h, 開發, 研發部, 實作登入功能
03/04, MyProject, , 1h, 會議, , Sprint planning
```

欄位順序：`date, project, issue, hours, activity, dept, comment`
- 以逗號分隔
- `#` 開頭的行為註解
- issue 和 dept 可留空
