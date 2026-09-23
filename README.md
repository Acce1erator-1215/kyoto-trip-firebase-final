<div align="center">

# Kyoto Journey
### 京都旅遊規劃工具

**One trip. Everything in one place.**  
把行程、景點、美食與旅費，整理在同一個介面。

`React 18` · `TypeScript` · `Firebase` · `Vite`

[功能介紹 Features](#features--功能介紹) · [本機執行 Local setup](#local-setup--本機執行) · [專案結構 Structure](#structure--專案結構)

</div>

---

## Overview / 專案介紹

Kyoto Journey is a web travel companion with six dedicated views for planning and organizing a trip. A Japanese-inspired visual style, bottom navigation and mobile viewport handling keep the interface focused on everyday use.

以京都旅行為主題的網頁工具，將旅行資訊分成六個常用頁面。介面採和風色彩、底部分頁導覽與行動裝置版面，方便在旅途中快速切換資訊。

## Features / 功能介紹

| Module / 模組 | Purpose / 用途 |
| :--- | :--- |
| Itinerary / 每日行程 | Organize plans by day and time／依日期與時間整理行程 |
| Sightseeing / 景點 | Keep places, notes and map links together／整理景點、筆記與地圖連結 |
| Food / 美食 | Maintain a restaurant list／管理餐廳口袋名單 |
| Expenses / 記帳 | Track spending in Japanese yen／記錄日圓支出 |
| Shopping / 購物 | Manage items and purchase status／管理伴手禮與購買狀態 |
| Flights / 航班 | View flight information／集中查看航班資訊 |

Additional interface details include tab scroll-position memory, toast feedback and an interactive sakura animation.

其他介面細節包含分頁捲動位置記憶、操作提示與互動櫻花動畫。

## Stack / 技術

- **Interface:** React 18 + TypeScript
- **Styling:** Tailwind CSS and custom Japanese-inspired styles
- **Application services:** Firebase
- **Development & build:** Vite
- **Organization:** Context providers, reusable hooks and separate tab components

## Local setup / 本機執行

Prerequisites: Node.js and npm.  
請先安裝 Node.js 與 npm。

```bash
git clone https://github.com/Acce1erator-1215/kyoto-trip-firebase-final.git
cd kyoto-trip-firebase-final
npm install
```

Before running a personal copy, review `firebase.ts` and configure your own Firebase project. The application depends on that project's database access configuration; installing packages alone does not create the backend.

執行自己的副本前，請先檢查 `firebase.ts` 並設定自己的 Firebase 專案。應用程式需要對應的資料庫存取設定；安裝套件不會自動建立後端。

```bash
npm run dev
```

Open the local URL printed by Vite.  
開啟終端機中 Vite 顯示的網址。

| Command / 指令 | Purpose / 用途 |
| :--- | :--- |
| `npm run dev` | Start the development server／啟動開發伺服器 |
| `npm run build` | Create a production bundle／產生正式環境建置 |
| `npm run preview` | Preview the built bundle locally／在本機預覽建置結果 |

## Structure / 專案結構

```text
index.tsx              Application entry / 程式進入點
components/
  App.tsx              App shell and providers / 主介面與狀態容器
  tabs/                Six feature views / 六個功能頁面
context/               Shared state / 共用狀態
hooks/                 Reusable interaction logic / 共用互動邏輯
services/              Service helpers / 服務工具
firebase.ts            Firebase configuration / Firebase 設定
types.ts               Shared TypeScript models / 共用資料型別
vite.config.ts         Vite configuration / 建置設定
```

The entry point loads `components/App.tsx`. A separate root-level `App.tsx` also exists; start with the entry point when following the active UI.

進入點載入的是 `components/App.tsx`。根目錄另有同名檔案，閱讀目前使用的介面時請由進入點追蹤。

## Related version / 相關版本

[kyoto-trip-firebase](https://github.com/Acce1erator-1215/kyoto-trip-firebase) keeps more of the main state and tab logic in one application component. This repository separates those responsibilities into Context, Hooks and tab components.

另一個版本將較多狀態與分頁邏輯集中於主元件；本版本拆分為 Context、Hooks 與獨立分頁，方便閱讀與維護。

<details>
<summary>Project origin / 專案來源</summary>

This repository was generated from the Google AI Studio repository template.  
本專案起始於 Google AI Studio 儲存庫範本。

[Original AI Studio project / 原始 AI Studio 專案](https://ai.studio/apps/drive/1zUPMR8VJkQJIE-Ho9kPcq5RuCn1qfwbP) — access may require permission／可能需要存取權限。

</details>
