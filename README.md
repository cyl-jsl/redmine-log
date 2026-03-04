# redmine-log

Redmine 工時自動化工具 — CLI + Claude MCP/Skill 整合，快速登打 Redmine 工時。

## 功能特色

- **CLI 快速登打** — 一行指令完成工時記錄
- **別名 + 模糊匹配** — 縮寫即可辨識專案與活動類型
- **批次匯入** — CSV 檔案一次登打多筆
- **查看工時** — 檢視今日、本週或指定範圍的工時
- **Claude 整合** — 透過 MCP Server + Skill 以自然語言登打工時
- **本地快取** — 24 小時 TTL，減少 API 呼叫

## 安裝

```bash
git clone <repo-url>
cd redmine-log
npm install
npm run build
```

全域使用：

```bash
npm link
```

## 快速開始

### 1. 初始化

```bash
redmine-log init
```

依提示輸入 Redmine URL 與 API Key，工具會自動同步專案和活動類型。

### 2. 登打工時

```bash
redmine-log add 4h MyProject 開發
redmine-log add 1.5h MyProject #1234 開發 -c "實作登入功能"
```

### 3. 查看工時

```bash
redmine-log view          # 今天
redmine-log view week     # 本週
```

## CLI 指令

### `redmine-log init`

連接 Redmine 伺服器並初始化本地配置。

### `redmine-log add <hours> <project> [#issue] <activity> [options]`

單筆登打工時。

**時數格式：** `4h`、`30m`、`1.5`

**選項：**

| 選項 | 說明 | 預設 |
|------|------|------|
| `-d, --date <date>` | 日期（`today`、`yesterday`、`MM/DD`、`YYYY-MM-DD`） | today |
| `--dept <dept>` | 歸屬部門 | — |
| `-c, --comment <text>` | 備註 | — |

```bash
# 基本用法
redmine-log add 4h MyProject 開發

# 帶 Issue、日期、備註
redmine-log add 2h MyProject #567 開發 -d 03/04 -c "修復 bug"

# Issue 位置可任意放
redmine-log add 4h #1234 MyProject 開發
```

### `redmine-log batch [-f, --file <path>]`

CSV 批次登打。不指定檔案時從 stdin 讀取。

**CSV 格式：**

```csv
# date, project, issue, hours, activity, dept, comment
03/04, MyProject, #123, 4h, 開發, 研發部, 實作登入
03/04, MyProject, , 1h, 會議, , Sprint planning
```

```bash
redmine-log batch -f timesheet.csv
cat timesheet.csv | redmine-log batch
```

### `redmine-log view [period]`

查看工時記錄。

| 參數 | 說明 |
|------|------|
| `today`（預設） | 今天 |
| `week` | 當週（週一至週五），並標示未登記日期 |
| `YYYY-MM-DD:YYYY-MM-DD` | 指定日期範圍 |

### `redmine-log sync`

手動同步專案、活動類型與部門快取。

### `redmine-log alias <subcommand>`

管理別名，加速日常輸入。

```bash
# 列出所有別名
redmine-log alias list

# 設定別名（類別：projects、activities、depts、issues）
redmine-log alias set projects fe FrontEnd
redmine-log alias set activities dev 開發
redmine-log alias set issues ticket 1234

# 移除別名
redmine-log alias rm projects fe
```

設定後即可使用：

```bash
redmine-log add 4h fe dev    # = 4h FrontEnd 開發
```

## 模糊匹配

輸入專案或活動名稱時，工具會自動以 Levenshtein 編輯距離進行模糊匹配。匹配順序：

1. 精確別名匹配
2. 精確名稱匹配
3. 模糊匹配（閾值 = `min(3, max(1, floor(input.length * 0.5)))`）

## 配置檔案

存放於 `~/.config/redmine-log/`（遵循 XDG 標準）：

| 檔案 | 說明 |
|------|------|
| `config.json` | Redmine URL、API Key、自訂欄位 ID |
| `cache.json` | 專案、活動、部門快取（24h TTL） |
| `aliases.json` | 別名對照表 |

## Claude 整合

### MCP Server

專案內建 `.mcp.json`，配置 `@yonaka15/mcp-server-redmine`，讓 Claude 可直接操作 Redmine API。

需設定環境變數：

```bash
export REDMINE_URL=https://redmine.example.com
export REDMINE_API_KEY=your-api-key
```

### Skill：自然語言登打

在 Claude Code 中直接用自然語言描述工時：

> 「幫我登打今天 MyProject #1234 開發 4 小時，備註實作登入功能」

Skill 會自動解析、補問缺失欄位、確認後送出。

## 開發

```bash
npm run dev          # 開發模式執行 (tsx)
npm test             # 執行測試 (vitest)
npm run test:watch   # 監聽模式測試
npm run build        # 編譯 TypeScript
```

### 專案結構

```
src/
├── index.ts              # CLI 入口 (commander)
├── types.ts              # 共用型別定義
├── lib/
│   ├── config.ts         # 配置讀寫
│   ├── cache.ts          # 快取管理 (TTL)
│   ├── alias-resolver.ts # 別名 + 模糊匹配
│   ├── redmine-client.ts # Redmine REST API client
│   └── parse-utils.ts    # 時數/日期解析
├── commands/
│   ├── init.ts           # 初始化設定
│   ├── add.ts            # 單筆登打
│   ├── batch.ts          # CSV 批次登打
│   ├── view.ts           # 查看工時
│   ├── sync.ts           # 同步快取
│   └── alias.ts          # 別名管理
└── __tests__/            # 測試檔案
```

### 技術棧

- Node.js v23, TypeScript ESM (strict mode)
- commander (CLI)、chalk (終端著色)、fastest-levenshtein (模糊匹配)
- vitest (測試)
- 所有 API 呼叫使用 Node.js 內建 `fetch`

### 注意事項

- ESM：import 路徑必須加 `.js` 副檔名
- TypeScript strict mode 啟用

## 疑難排解

### `init` 時出現「無法連線到 Redmine：fetch failed」

**症狀：** 瀏覽器可以正常開啟 Redmine，但 CLI 工具連線失敗。

**原因：** macOS 的系統 DNS 解析器 (mDNSResponder) 可能快取了錯誤的 IP（例如外部 IP），導致 `curl`、Node.js `fetch` 等工具連到錯誤的位址。常見於 Redmine 部署在公司內網，且 DNS 紀錄曾經變更的情況。

**診斷步驟：**

```bash
# 1. 確認 DNS 解析結果
dig redminesrv.example.com +short          # 應該回傳內網 IP
node -e "require('dns').lookup('redminesrv.example.com', (e,a) => console.log(a))"
# 如果兩者 IP 不同，就是 DNS 快取問題

# 2. 確認內網 IP 可連通
ping <內網IP>

# 3. 確認強制指定 IP 後可連線
curl -sk --resolve "redminesrv.example.com:443:<內網IP>" https://redminesrv.example.com/
```

**解法：**

```bash
# 方法一：清除 macOS DNS 快取
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder

# 方法二：若清除快取無效，直接在 /etc/hosts 加上正確對應
sudo sh -c 'echo "<內網IP> redminesrv.example.com" >> /etc/hosts'
```

> 注意：使用 `/etc/hosts` 方式時，若伺服器 IP 日後變更需手動更新。

### 其他常見問題

| 錯誤訊息 | 可能原因 | 解法 |
|----------|---------|------|
| `Not initialized` | 尚未執行 init | 執行 `redmine-log init` |
| `Redmine API error: 401` | API Key 無效或過期 | 至 Redmine「我的帳戶」重新取得 API Key |
| `Redmine API error: 403` | 權限不足 | 確認帳號有該專案的工時登打權限 |
| `Cannot access custom fields` | 非管理員帳號 | init 時手動輸入歸屬部門的自訂欄位 ID |
| `Project not found` | 專案名稱不符或快取過期 | 執行 `redmine-log sync` 更新快取 |

## License

MIT
