# Deplao (bản chỉnh sửa)

Đây là **bản chỉnh sửa (fork)** của [Deplao](https://github.com/babyvibe/deplao-builder) do [babyvibe](https://github.com/babyvibe) phát triển — phần mềm desktop quản lý Zalo, Facebook & Telegram đa tài khoản (CRM · ERP · POS · Workflow · Trợ lý AI). Toàn bộ công sức nền tảng thuộc về tác giả gốc; fork này chỉ thêm một số cải tiến nhỏ trên nhánh **`custom`** và luôn bám theo bản mới của tác giả.

- Dự án gốc: https://github.com/babyvibe/deplao-builder · Website: https://deplaoapp.com
- README đầy đủ của dự án gốc (tính năng, cài đặt, hướng dẫn): [README.md](../README.md) · [English](../README.en.md)
- Giấy phép: MIT, giữ nguyên bản quyền của tác giả gốc ([LICENSE](../LICENSE)). Bộ icon loại file lấy từ [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme) (MIT, xem `src/assets/file-icons/LICENSE`).
- Đây **không phải** bản chính thức. Lỗi xảy ra với bản này, vui lòng báo tại fork này thay vì làm phiền tác giả gốc.

## Khác gì bản gốc

**Nhận tin ổn định hơn (Zalo)**
- Tự phát hiện kết nối "chết lặng" (không còn dữ liệu) và kết nối lại; kết nối lại tối đa 10 lần, mỗi lần chờ tối đa 2 phút.
- Tự tải các tin bị lỡ khi mở lại app và sau khi kết nối lại.
- Khi tài khoản đang mở ở nơi khác (Zalo Web) thì không tranh phiên, báo rõ để người dùng đóng Zalo Web.

**Danh sách hội thoại**
- Tab **Đã ghim** (ghim trên Zalo + ghim trong app).
- Tab **Chưa đọc** tự thêm hội thoại mới có tin chưa đọc.
- Tìm người / nhóm **không phân biệt dấu, hoa thường**, tìm cả biệt danh lẫn tên gốc, và tìm toàn cục thấy cả nhóm / bạn bè ngoài danh sách đang tải.
- Rê chuột vào biểu cảm của tin nhắn để xem tên người đã thả; biệt danh được hiển thị đúng ngay cả với người ngoài danh sách hội thoại đang tải.
- Tin file hiện icon SVG theo loại file (đúng màu Word / Excel / PowerPoint / PDF), tên file dài xuống dòng và có tooltip; nút **Lưu về máy…** cho file đính kèm; **Lưu cả album** (menu chuột phải) và nút **Tải về** khi chọn nhiều tin để lưu nhiều ảnh / file vào một thư mục.

**Giao diện** (lấy ý tưởng từ [ZaDark](https://github.com/ncdai/zadark), tự viết lại, không chép mã)
- Giao diện Sáng / Tối / **Theo hệ thống**; bảng màu Xanh dương, Xanh lá, Tím, Đen tuyền (AMOLED), ZaDark.
- Nút **Tùy chỉnh nhanh** trên thanh trên cùng: giao diện, bảng màu, phông chữ Google Fonts (tải một lần rồi lưu trên máy), cỡ chữ tin nhắn.
- Riêng tư: làm mờ tin nhắn / ảnh đại diện / tên hội thoại (rê chuột để xem), ẩn trạng thái "đang soạn" và "đã xem".
- Cài đặt giao diện lưu trong cơ sở dữ liệu của app nên **dùng chung giữa `npm run dev` và bản build**, đi theo thư mục dữ liệu (portable).

**Thông báo**
- Đồng bộ danh sách tắt thông báo đặt trên điện thoại / Zalo PC; tùy chọn nháy taskbar với hội thoại đã tắt thông báo.

## Nhật ký thay đổi (so với bản gốc)

Dựa trên Deplao v26.10.2.

- **Cài đặt giao diện lưu vào DB**: không còn mất khi đổi giữa chạy thử (`npm run dev`) và bản build.
- **Tải nhiều ảnh / file cùng lúc** (Lưu cả album, Tải về khi chọn nhiều tin) vào một thư mục; **Lưu về máy…** cho file đính kèm (bong bóng chat và panel đính kèm); icon file lớn hơn, đặt trên nền trắng ở giao diện Tối, tên file dài xuống dòng có tooltip.
- **Tùy chỉnh nhanh** gộp nút Sáng/Tối cũ: giao diện, bảng màu, phông chữ, cỡ chữ tin nhắn, riêng tư.
- **Bảng màu ZaDark**, đồng bộ tắt thông báo từ Zalo, tùy chọn nháy taskbar cho hội thoại đã tắt thông báo.
- Tab **Đã ghim**, sửa tab **Chưa đọc**; ổn định kết nối nhận tin Zalo, tự tải tin bị lỡ khi mở lại app.
- **Tìm kiếm** không dấu và tìm cả biệt danh / tên gốc; **tooltip tên người react**; sửa biệt danh bị hiện lại tên gốc.

## Chạy và build

Yêu cầu: Node.js, Go (để build bridge Facebook E2EE). Làm việc trên nhánh `custom`.

```bash
git submodule update --init --recursive
npm install
npm run dev          # chạy thử
npm run production   # build bộ cài Windows → dist-electron-build/
```

> Bộ cài không có chữ ký số nên Windows SmartScreen có thể cảnh báo ("More info" → "Run anyway"). **Đừng bấm "Cập nhật" trong app**: nút này tải bản chính thức của tác giả và sẽ ghi đè các chỉnh sửa ở đây.

## Cập nhật theo tác giả

```bash
git fetch origin
git rebase origin/main   # đặt các commit của nhánh custom lên code mới
```

Chi tiết quy trình, các điểm thường xung đột và kiến thức đã kiểm chứng nằm trong [GEMINI.md](../GEMINI.md).
