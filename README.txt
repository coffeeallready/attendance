
【全新考勤系統（本機就能用，雲端可選）】
- 直接打開 index.html → 已自動建立帳號：admin / admin123。
- 登入後可立刻打卡，資料存 localStorage（KEY: yihong_attendance_v1）。
- 若要雲端同步：在登入頁「同步設定」貼上 Firebase Web App 的 config JSON，按「儲存設定 → 啟用雲端」即可，無需改檔。

安全同步：打卡先寫本機 → push 到雲端，pull 只在雲端較新時合併，避免覆蓋本機新資料。
