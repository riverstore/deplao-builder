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

**Danh sách hội thoại & Tìm kiếm**
- Tab **Đã ghim** (ghim trên Zalo + ghim trong app).
- Tab **Chưa đọc** tự thêm hội thoại mới có tin chưa đọc.
- **Tìm kiếm đa từ không cạnh nhau** (multi-token search): không phân biệt dấu và hoa thường, tìm cả biệt danh lẫn tên gốc. Ví dụ: gõ `"an tha"` sẽ tìm thấy ngay `"An (THCS Vĩnh Thạnh)"`, highlight đồng thời các từ khóa con; áp dụng đồng bộ cho danh sách hội thoại, tìm kiếm toàn cục, chọn thành viên nhóm và nhắc tên (@mention).
- Rê chuột vào biểu cảm của tin nhắn để xem tên người đã thả; biệt danh được hiển thị đúng ngay cả với người ngoài danh sách hội thoại đang tải.
- Tin file hiện icon SVG theo loại file (đúng màu Word / Excel / PowerPoint / PDF), tên file dài xuống dòng và có tooltip; nút **Lưu về máy…** cho file đính kèm; **Lưu cả album** (menu chuột phải) và nút **Tải về** khi chọn nhiều tin để lưu nhiều ảnh / file vào một thư mục.
- Khắc phục triệt để lỗi không tải được ảnh album Zalo: trích xuất URL ảnh toàn diện, tự động đổi JXL sang JPG và sửa lỗi cookie khiến máy chủ CDN từ chối (403).

**Hội thoại ẩn Zalo (mã PIN)**
- Gõ 4 số PIN vào ô tìm kiếm để mở danh sách hội thoại ẩn; tự động xóa PIN khỏi màn hình và đóng bảng tìm kiếm chung khi mở khóa thành công.
- Kính lúp ô tìm kiếm chuẩn hóa bảo mật: bình thường hiển thị màu xám trung tính (không làm lộ việc có hội thoại ẩn); **chỉ chuyển màu đỏ và nhấp nháy chấm đỏ khi có tin nhắn mới chưa đọc** từ hội thoại ẩn; khi đang xem hội thoại ẩn thì kính lúp có nền đỏ, bấm vào để khóa lại ngay.
- Bảo toàn cờ ẩn trong cơ sở dữ liệu máy tính, không bị mất cờ khi Zalo API tạm thời lỗi hoặc chưa đồng bộ.

**Giao diện & Đa ngôn ngữ** (lấy ý tưởng từ [ZaDark](https://github.com/ncdai/zadark), tự viết lại, không chép mã)
- Giao diện Sáng / Tối / **Theo hệ thống**; bảng màu Xanh dương, Xanh lá, Tím, Đen tuyền (AMOLED), ZaDark.
- Nút **Tùy chỉnh nhanh** trên thanh trên cùng: giao diện, bảng màu, phông chữ Google Fonts (tải một lần rồi lưu trên máy), cỡ chữ tin nhắn.
- Riêng tư: làm mờ tin nhắn / ảnh đại diện / tên hội thoại (rê chuột để xem), ẩn trạng thái "đang soạn" và "đã xem".
- **Hỗ trợ đa ngôn ngữ toàn diện (i18n)**: Mọi tính năng tùy biến đều hỗ trợ song ngữ Tiếng Việt, Tiếng Anh (English) và Tiếng Trung (中文).
- Cài đặt giao diện lưu trong cơ sở dữ liệu của app nên **dùng chung giữa `npm run dev` và bản build**, đi theo thư mục dữ liệu (portable).
- **Menu chuột phải (Context menu) cho textbox**: Đầy đủ tính năng Hoàn tác, Làm lại, Cắt, Sao chép, Dán, Dán thuần văn bản, Xóa, Chọn tất cả cho mọi ô nhập liệu (ô soạn tin nhắn, ô tìm kiếm, form...) và hỗ trợ sao chép nhanh khi bôi đen văn bản.

**Khoá ứng dụng & Bảo mật (Matrix Cyberpunk)**
- Màn hình khoá phong cách **Matrix Digital Rain** với hiệu ứng ánh sáng neon, độ tương phản cao và tối ưu CPU.
- Hỗ trợ 2 chế độ mở khoá: **các ô nhập PIN số** (tự động mở khoá khi nhập đủ số) hoặc **gõ chữ truyền thống**.
- Tuỳ chọn **Tự động khoá khi không hoạt động** (1, 2, 5, 10, 15, 30, 60 phút).
- Phím tắt khoá nhanh `Ctrl+Shift+L` và nút khoá trên thanh tiêu đề.

**Xem hồ sơ & Thành viên nhóm**
- Phân nhóm thành viên trực quan: **Trưởng & phó nhóm**, **Bạn bè**, **Chưa kết bạn**.
- Nút **Kết bạn trực tiếp** ngay trong danh sách thành viên nhóm Zalo.
- Xem ảnh đại diện, ảnh bìa kích thước lớn với bộ điều khiển phóng to / thu nhỏ (zoom), cuộn chuột và lưu về máy.

**Thông báo**
- Đồng bộ danh sách tắt thông báo đặt trên điện thoại / Zalo PC; tùy chọn nháy taskbar với hội thoại đã tắt thông báo.

## Nhật ký thay đổi (so với bản gốc)

Dựa trên Deplao v26.11.1 (chuẩn bị cập nhật v26.11.2).

- **Hỗ trợ đa ngôn ngữ hoàn thiện (i18n)**: Toàn bộ bảng Tùy chỉnh nhanh, Riêng tư, Màn hình khoá, Tải file/ảnh, Thành viên nhóm, Hồ sơ... đồng bộ với hệ thống i18n của Deplao, hiển thị chuẩn Tiếng Anh và Tiếng Trung.
- **Màn hình khoá Matrix Cyberpunk**: Hiệu ứng mưa số nhị phân Matrix, hỗ trợ nhập mã PIN tự động mở khoá, tự động khoá sau thời gian không hoạt động, phím tắt `Ctrl+Shift+L`.
- **Thành viên nhóm & Xem ảnh đại diện**: Phân nhóm Trưởng/Phó nhóm, Bạn bè, Chưa kết bạn; nút gửi lời mời kết bạn trong nhóm; trình xem ảnh đại diện/ảnh bìa hỗ trợ zoom và tải về máy.
- **Kéo thả tệp chờ gửi**: Kéo file/ảnh vào khung chat hiển thị khay chờ gửi xem trước (icon theo loại file, tên file, dung lượng) kèm nút xoá từng file hoặc xoá tất cả.
- **Menu chuột phải (Context menu) cho ô nhập liệu**: Khắc phục lỗi thiếu context menu trên các textbox; hỗ trợ đầy đủ Hoàn tác, Cắt, Sao chép, Dán, Dán thuần văn bản, Xóa, Chọn tất cả trên toàn bộ app.
- **Hội thoại ẩn Zalo (mã PIN)**: Sửa lỗi gõ PIN không mở được hội thoại ẩn; kính lúp ô tìm kiếm chuẩn hóa bảo mật theo Zalo (chỉ đỏ khi có tin mới chưa đọc từ hội thoại ẩn, bình thường xám); bảo toàn cờ ẩn trong DB máy tính.
- **Tìm kiếm đa từ không cạnh nhau**: Gõ các từ cách nhau không dấu (như `"an tha"`) tìm thấy ngay tên đầy đủ (như `"An (THCS Vĩnh Thạnh)"`), highlight đồng thời các từ tìm được trên toàn bộ các bộ lọc, chọn thành viên nhóm và nhắc tên.
- **Sửa lỗi ảnh album Zalo**: Trích xuất URL ảnh đa tầng, chuyển đổi JXL sang JPG, sửa lỗi so sánh tài khoản khiến cookie mất làm CDN trả 403.
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
