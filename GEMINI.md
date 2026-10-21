# Hướng dẫn cho AI agent làm việc với repo này

> File này viết cho AI agent (Gemini, Claude, …) tiếp quản. Đọc hết trước khi làm gì.
> File nằm trên nhánh `custom` (không có trên nhánh của tác giả). Cập nhật file khi quy trình hoặc phần sửa thay đổi.

## 1. Người dùng

- Trả lời bằng **tiếng Việt**, có dấu đầy đủ. Comment code, commit message, thông báo hiển thị cho người dùng: tiếng Việt. Tên biến/hàm/file/branch: tiếng Anh.
- Người dùng **không rành thuật ngữ git**: giải thích bằng lời đơn giản ("lấy code mới", "lưu phần sửa"), đưa đề xuất rõ ràng thay vì nhiều lựa chọn mơ hồ.
- "update repo" / "lấy code mới" = lấy code mới của tác giả về (xem mục 4), KHÔNG phải update dependency.
- **Phải hỏi trước khi**: `git commit`, `git push`, xóa file/thư mục, format/thao tác ổ đĩa, thêm dependency. Không bao giờ `git push --force` lên nhánh của tác giả, không `git reset --hard` lên phần sửa chưa lưu.
- Commit KHÔNG thêm `Co-Authored-By` hay dòng quảng cáo AI.
- Sau khi sửa code phải chạy typecheck (mục 3) rồi mới báo xong. Nói rõ phần nào đã kiểm chứng, phần nào chưa.

## 2. Repo & môi trường

- Repo làm việc: `D:\Code\deplao-builder` (SSD NVMe, NTFS). App: **Deplao** — Electron + React + TypeScript, quản lý Zalo/Facebook/Telegram đa tài khoản. Có bridge Facebook E2EE viết bằng Go (`src/bridge-e2ee`, submodule `src/bridge-e2ee/meta`).
- Máy: Windows 11, PowerShell 7, Node 24, Go 1.25. Ổ C: và D: gần đầy (D: còn ~12 GB) — đừng tạo file lớn bừa bãi.
- Remote:
  - `origin` = https://github.com/babyvibe/deplao-builder (tác giả, chỉ lấy code về)
  - `myfork` = https://github.com/riverstore/deplao-builder (fork của người dùng)
- Nhánh:
  - `main` = giống hệt `origin/main`, không sửa trực tiếp.
  - `custom` = code tác giả + phần sửa của người dùng (các commit `fix(...)` / `feat(...)` / `docs(...)`, xem mục 5). Đã push lên `myfork/custom`. **Chạy app trên nhánh này.**

### TUYỆT ĐỐI tránh

- **Không làm việc với code trên ổ E:** (HDD Seagate USB, exFAT, có mã hóa phần cứng). Git checkout trên exFAT lỗi ngẫu nhiên `unable to create file ...: File exists`.
- **Không dùng ổ ảo VHDX trên ổ E:** (`E:\DevDisk\dev.vhdx`). Đã thử: `npm install` gây I/O timeout (Event Log `vhdmp` ID 129) và **treo cả Windows**.
- Người dùng không muốn lưu dữ liệu vào ổ C:.
- Repo cũ `E:\Code\Javascript\deplao-builder` không còn dùng (bị lỗi `dubious ownership`; nếu buộc phải chạy git ở đó thì thêm `-c safe.directory=E:/Code/Javascript/deplao-builder`).

## 3. Lệnh hay dùng (chạy trong `D:\Code\deplao-builder`)

| Việc | Lệnh |
|---|---|
| Chạy app dev | `npm run dev` (tự mở cửa sổ Electron; `http://localhost:27799` chỉ là dev server của Vite cho Electron, mở bằng trình duyệt sẽ không chạy) |
| Typecheck main process | `npx tsc -p tsconfig.electron.json --noEmit` (phải exit 0) |
| Typecheck renderer | `npx tsc -p tsconfig.json --noEmit` (code tác giả có thể có lỗi sẵn — chỉ cần không có lỗi ở file mình sửa) |
| Build bộ cài Windows | `npm run production` → `dist-electron-build\Deplao-Setup-<version>.exe` (chi tiết ở mục 4b) |
| Cài thư viện | `npm install` |
| Submodule | `git submodule update --init --recursive` |

- Sau khi đổi code main process (thư mục `electron/`, `src/services`, `src/utils`) phải tắt `npm run dev` (Ctrl+C) và chạy lại; renderer (`src/ui`) tự nạp lại.
- Log runtime xem trong app: tab **Nhật ký** (Settings → Nhật ký). Các dòng `[ZaloLoginHelper] ...` là của phần sửa nhận tin Zalo.
- `npm install` và `npm run production` thường làm thay đổi `package-lock.json` và `src/bridge-e2ee/build/*.exe` (file build có trong git). **Không commit chúng**; trước khi lấy code mới thì trả về bản gốc: `git checkout -- package-lock.json src/bridge-e2ee/build/`.
- Khi người dùng chạy lệnh bằng `! <lệnh>` thì lệnh chạy bằng **bash**: đường dẫn phải dùng `/` (`D:/Code/deplao-builder`), dùng `\` sẽ hỏng.

## 4. Quy trình "lấy code mới của tác giả"

```powershell
cd D:\Code\deplao-builder
git switch custom
git status                      # phải sạch; nếu chỉ có package-lock.json/.exe build thì: git checkout -- package-lock.json src/bridge-e2ee/build/
git fetch origin
git branch -f main origin/main  # cập nhật nhánh main (không cần checkout)
git rebase origin/main          # đặt các commit của người dùng lên trên code mới
# Nếu CONFLICT: sửa file, `git add <file>`, rồi `git -c core.editor=true rebase --continue`
# Nếu rối quá: `git rebase --abort` để quay về như trước khi rebase
git submodule update --init --recursive
npm install
npx tsc -p tsconfig.electron.json --noEmit
npx tsc -p tsconfig.json --noEmit
git push --force-with-lease myfork custom   # sau rebase lịch sử đổi nên cần --force-with-lease; HỎI người dùng trước
```

- Push cần đăng nhập GitHub (Git Credential Manager). Nếu báo `Invalid username or token`: người dùng tự chạy `! printf "protocol=https\nhost=github.com\n\n" | git credential-manager erase` rồi push lại (cửa sổ đăng nhập sẽ hiện).
- Khi gộp chỗ trùng: **giữ thay đổi mới của tác giả**, rồi thêm lại ý của phần sửa (mục 5). Nếu tác giả đã tự sửa đúng lỗi đó hoặc đã xóa hẳn tính năng liên quan → bỏ phần sửa tương ứng và báo người dùng.

## 4b. Build file cài đặt Windows (có phần sửa của người dùng)

Người dùng **không được bấm "Cập nhật" trong app**: auto-updater tải bản chính thức của tác giả và cài đè → mất phần sửa trên nhánh `custom`. Khi tác giả có bản mới: làm mục 4 (lấy code mới) rồi build lại theo mục này.

Yêu cầu: Node + Go đã cài (`go version`), ổ D: còn trống ≥ 3 GB (`dist-electron-build` vài trăm MB, cache Electron tải lần đầu ~150 MB).

```powershell
cd D:\Code\deplao-builder
git switch custom
git status                                  # chỉ được có package-lock.json / build exe thay đổi
git submodule update --init --recursive
npm install
npx tsc -p tsconfig.electron.json --noEmit  # phải sạch trước khi build
npm run production *> build.log             # chạy vài phút; xem log ở build.log
```

- `npm run production` làm lần lượt: build bridge Go (`scripts/build-bridge-e2ee.js`, có chạy `go test`), `tsc` main process, `strip-console`, `vite build`, rebuild native module (`better-sqlite3`), `electron-builder`.
- Kết quả: `dist-electron-build\Deplao-Setup-<version>.exe` (bộ cài, ~170 MB) và `dist-electron-build\win-unpacked\Deplao.exe` (chạy thẳng không cần cài).
- Kiểm tra build thành công: cuối `build.log` có dòng `building block map ... Deplao-Setup-<version>.exe.blockmap`; tìm `error` / `FAIL` trong log nếu thất bại.
- Bộ cài **không có chữ ký số** → Windows SmartScreen cảnh báo, bấm "More info" → "Run anyway". Cài đè lên bản cũ, dữ liệu app (tài khoản, tin nhắn) giữ nguyên.
- Build xong, file `src/bridge-e2ee/build/*.exe` và `package-lock.json` bị thay đổi → **không commit**, trả về bằng `git checkout -- package-lock.json src/bridge-e2ee/build/`.
- `build.log` không commit (đã thêm vào `.git/info/exclude`; clone mới thì thêm lại dòng `build.log` vào file đó).
- Có thể xóa `dist-electron-build\` sau khi đã cài để lấy lại chỗ trống (build lại sẽ tạo mới).
- Chỉ build được bản Windows trên máy này. Bản macOS/Linux phải build trên máy tương ứng hoặc qua GitHub Actions có sẵn (`.github/workflows/`) trên fork.

## 5. Phần sửa của người dùng trên nhánh `custom`

### Commit 1 — `fix(zalo): ổn định nhận tin nhắn` (file `src/utils/ZaloLoginHelper.ts`, `src/ui/hooks/useZaloEvents.ts`)

Bối cảnh: app nhận tin Zalo qua WebSocket của thư viện `zca-js` (giả lập Zalo Web). Trước đây tin đến chậm hoặc mất.

- Hằng số đầu file: `MAX_RECONNECT_ATTEMPTS = 10`, `RECONNECT_DELAY_MAX_MS = 120_000`, `WS_PING_INTERVAL_MS = 30_000`, `WS_IDLE_TIMEOUT_MS = 90_000`, `FATAL_CLOSE_CODES = {DuplicateConnection 3000, KickConnection 3003}`, `GROUP_INFO_WAIT_MS = 2_000`. Import `ThreadType` từ `zca-js`.
- **Watchdog** (`startWatchdog` / `stopWatchdog`, map `watchdogTimers`): lấy `listener.ws` (thư viện `ws`), gắn `ws.on('message')` + `ws.on('pong')` để ghi nhận hoạt động, mỗi 30s gửi `ws.ping()`; 90s không nhận gì → `ws.terminate()` → socket đóng mã 1006 → luồng reconnect bình thường chạy. Bắt đầu trong `listener.on("connected")`.
- **Không reconnect khi mã 3000/3003** (tài khoản đang mở trên Zalo Web; reconnect sẽ đá nhau qua lại): đánh dấu `listener_active=0`, `broadcastListenerDead(zaloId, 'duplicate_connection')`. `useZaloEvents.ts` hiển thị "Tài khoản đang được mở ở nơi khác (Zalo Web). Hãy đóng Zalo Web trước".
- **Tải tin bị lỡ sau reconnect**: set `pendingCatchUp`; khi `listener.on("cipher_key")` (cần cipher key mới gửi được) thì gọi `listener.requestOldMessages(ThreadType.User/Group, null)`.
- Backoff reconnect: `min(5s * 2^attempt, 120s)`, tối đa 10 lần.
- Tin nhóm: `await Promise.race([fetchGroupInfoIfMissing(...), timeout 2s])` thay vì chờ vô hạn.
- Bỏ `full_message` khỏi log `RAW message event` (nặng CPU).
- Chỉ đăng ký handler `listener.on("closed")` (không đăng ký `"disconnected"`), vì không dùng `retryOnClose` nên zca-js luôn phát cả hai → trước đây xử lý 2 lần. `stopWatchdog` + `pendingCatchUp.add` đặt **sau** đoạn kiểm tra "stale connection" để không dừng watchdog của connection mới.
- Khi gộp: tác giả đã đổi `broadcastConnected(zaloId, { zaloId, send2meId })` — giữ `send2meId`.

### Commit 2 — `fix(ui): hiện hội thoại mới trong tab Chưa đọc` (file `src/ui/components/chat/ConversationList.tsx`)

- Lỗi: tab "Chưa đọc" lấy danh sách từ DB một lần (snapshot `dbFilteredContacts`), badge thì đếm từ store sống → hội thoại mới chưa đọc làm tăng badge nhưng không hiện trong danh sách.
- Sửa trong `useMemo` `dbFilteredContactsWithLiveState`: sau khi overlay dữ liệu sống (`withLive`), nếu `filter === 'unread'` thì bổ sung các contact trong store có `unread_count > 0` mà chưa có trong snapshot, lọc theo `channelFilter` (`c.channel || 'zalo'`) và `search` (display_name/alias/contact_id/phone). Dependency thêm `filter, mergedInboxMode, mergedInboxAccounts, channelFilter, search`. Lọc thư mục "Khác" vẫn do bước `filtered`/`filteredMerged` phía sau.
- Tác giả đã thêm hàm `getLive` (map theo tài khoản) trong cùng `useMemo` — giữ nó, chỉ đổi `return dbFilteredContacts.map(...)` thành `const withLive = ...`.

### Commit 3 — `feat(ui): icon file theo loại và tab Đã ghim`

- `src/assets/file-icons/*.svg` + `LICENSE` + `README.md`: icon Material Icon Theme (MIT). Word/Excel/PowerPoint/PDF đã đổi màu thương hiệu (README ghi rõ). Phải giữ file LICENSE.
- `src/ui/lib/chat/fileTypeIcons.ts`: `fileTypeIconSrc(fileName, fileExt?)` chọn icon theo đuôi.
- `ConversationList.tsx`: `formatLastMessage` trả `string | FilePreview`; với tin file (kể cả `last_message` đã lưu dạng `📂 tên`) render `<img>` icon + tên. Chỗ gọi duy nhất ở dòng xem trước của hàng hội thoại.
- Tab "Đã ghim" (`FilterType` thêm `'pinned'`): ghim Zalo (`zaloPinsByAccount`) ∪ ghim trong app (`localPinsByAccount`, không giới hạn số lượng), lọc trong `filtered` và `filteredMerged`.

### Commit 4 — `feat(ui): giao diện theo hệ thống và bảng màu`

- `appStore.ts`: `themeMode` ('light' | 'dark' | 'system', lưu `app_theme`), `theme` = giá trị đã quy về sáng/tối (khoảng 35 component đọc `theme === 'dark'`, không sửa chúng), `palette` (`app_palette`: blue/green/purple/amoled), `syncSystemTheme`.
- `App.tsx`: `data-theme`, `data-palette` trên `<html>`; lắng nghe `matchMedia('(prefers-color-scheme: dark)')` khi chế độ Hệ thống.
- `index.css`: khối `html[data-theme=..][data-palette=..]` chỉ ghi đè màu nhấn; Đen tuyền chỉ cho giao diện Tối.
- `settings/AppearanceControls.tsx`: `ThemeModePicker`, `PalettePicker` dùng chung (Cài đặt → Giao diện + bảng tùy chỉnh nhanh).

### Commit 5 — `feat(ui): bảng tùy chỉnh nhanh, phông Google Fonts và cỡ chữ tin nhắn`

- `layout/QuickSettingsPanel.tsx` (nút trên `TopBar.tsx`, cạnh nút Sáng/Tối): giao diện, bảng màu, phông chữ, cỡ chữ tin nhắn, công tắc riêng tư. Mô phỏng popup của ZaDark (`src/web/popup.html`, MPL-2.0 — chỉ lấy ý tưởng, KHÔNG chép code).
- `src/services/font/FontCacheService.ts` + IPC `util:ensureGoogleFont` (`electron/ipc/utilIpc.ts`, `preload.ts`, `src/ui/lib/ipc.ts`): tải CSS từ `fonts.googleapis.com` + file từ `fonts.gstatic.com` (chỉ 2 host này), giữ bộ chữ latin/latin-ext/vietnamese, nhúng `data:` (CSP chỉ cho `font-src 'self' data: https:`), lưu `userData/fonts/<tên>.css`. App.tsx chèn `<style id="app-custom-font">` + `--app-font-family`.
- Cỡ chữ tin nhắn: `--chat-font-size` áp vào class `chat-msg-text` (gắn trong `ChatWindowBubbles.tsx`, `TextWithMentions` và chữ RTF).

### Commit 6 — `feat(privacy): chống nhìn trộm và ẩn trạng thái đang soạn / đã xem`

- `store/privacyStore.ts` (`app_privacy`): `blurLastMessage`, `blurMessages`, `blurAvatars`, `blurNames`, `hideTyping`, `hideSeen`.
- Làm mờ bằng CSS (`index.css`): `html[data-blur-*]` + class `privacy-last-message` / `privacy-name` / `privacy-avatar` / `privacy-reveal` (hàng hội thoại) trong `ConversationList.tsx`; tin nhắn dùng `[data-msg-ids]` có sẵn trên hàng tin của `ChatWindow.tsx`.
- `hideTyping`: chặn trong `sendTypingEvent` (`MessageInput.tsx`). `hideSeen`: chặn ở `sendSeenHelper.ts`, `markConversationRead.ts` (Zalo vẫn `removeUnreadMark`), `channelIpc.markAsRead`. Workflow/API vẫn gửi đã xem nếu được cấu hình (cố ý).
- Không có công tắc "Ẩn Đã nhận": app không tự gửi `sendDeliveredEvent`.

## 6. Kiến thức đã kiểm chứng (đỡ phải thử lại)

- `listener.requestOldMessages` của zca-js **chỉ trả các tin phiên web chưa nhận**, không phải API lịch sử; lật trang bằng `lastId` (kể cả gửi `first:false`) Zalo không trả lời. Đã bỏ hướng này.
- Tác giả (từ v26.10.1) đã bỏ nút/IPC `login:requestOldMessages` và làm tính năng **đồng bộ tin nhắn từ điện thoại** (`src/services/zalo/mobileSync/`, `MobileSyncButton.tsx`) — dùng tính năng đó khi cần lịch sử.
- Zalo chỉ cho 1 phiên web/tài khoản: mở `chat.zalo.me` cùng lúc với app sẽ làm app mất kết nối (mã 3000).
- `npm install` báo nhiều lỗ hổng (`npm audit`) — chưa xử lý, đừng chạy `npm audit fix --force` (dễ làm hỏng app).
- Ý tưởng app Android đã bàn: khả thi nhất là app client gọi REST/Socket tới máy Boss (chế độ employee có sẵn: `src/ui/lib/data/DataAccessor.ts`, `src/services/http/HttpRelayService.ts`), không chạy toàn bộ backend trên điện thoại.
