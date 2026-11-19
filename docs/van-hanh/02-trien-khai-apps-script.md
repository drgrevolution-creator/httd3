# 02. Triển khai API Apps Script và thiết lập lần đầu

Kết quả cuối: một địa chỉ `https://script.google.com/macros/s/.../exec` là API của hệ thống; ba file Sheets, thư mục Drive `HTTD3/`, tài khoản `quantri` và lịch đêm đã được tạo.

Có hai cách đưa mã lên Apps Script. **Cách A** dùng công cụ `clasp` (khuyên dùng, lặp lại được). **Cách B** dán tay từng file (khi máy không cài được Node).

## Phần 1. Tạo dự án Apps Script (cả hai cách)

1. Đăng nhập Gmail của HTTD, vào `https://script.google.com` → **New project**.
2. Bấm vào tên "Untitled project" ở góc trên trái, đổi thành `HTTD3 API` → **Rename**.
3. Bấm biểu tượng bánh răng **Project Settings**:
   - Tích **Show "appsscript.json" manifest file in editor**.
   - Mục **Script ID**: bấm **Copy**. Dán vào file `.clasp.json` trong kho mã, thay `DIEN_SAU_KHI_TAO`.
   - Mục **Script Properties** → **Add script property**, thêm ba dòng rồi **Save**:
     - `EMAIL_QUAN_TRI` = Gmail của bạn (tài khoản quản trị đầu tiên sẽ gắn với Gmail này)
     - `HO_TEN_QUAN_TRI` = họ tên bạn
     - `GOOGLE_CLIENT_ID` = Client ID từ tài liệu 01 (nếu chưa có, thêm sau)

## Phần 2A. Đẩy mã bằng clasp (khuyên dùng)

Làm trên máy tính của bạn, trong cửa sổ dòng lệnh (Windows: PowerShell; macOS: Terminal).

1. Cài Node.js bản LTS từ `https://nodejs.org` (bấm Next đến hết). Đóng rồi mở lại cửa sổ dòng lệnh.
2. Cài clasp: `npm install -g @google/clasp`
3. Bật Apps Script API cho tài khoản: mở `https://script.google.com/home/usersettings` → bật **Google Apps Script API**.
4. Đăng nhập clasp: `clasp login` → trình duyệt mở ra → chọn Gmail của HTTD → **Allow**. (Chỉ làm một lần; thông tin lưu ở file `.clasprc.json` trong thư mục người dùng, đã nằm trong `.gitignore`.)
5. Tải kho mã về máy (nếu chưa): `git clone https://github.com/<tên-github>/httd3.git` rồi `cd httd3`.
6. Đẩy mã: `clasp push`. Lần đầu clasp hỏi có ghi đè manifest không → gõ `y`. Kết quả in danh sách file đã đẩy (phải thấy `thuan/SoDo.gs`, `ketnoi/KhoDuLieu.gs`, `Main.gs`...; **không** được thấy file `test/`).
7. Mở lại trang Apps Script (F5): các file đã xuất hiện ở cột trái.

Mỗi lần Claude cập nhật mã trên GitHub, bạn chỉ cần: `git pull` rồi `clasp push`, sau đó làm **Phần 5** để cập nhật bản triển khai.

## Phần 2B. Dán tay (không dùng clasp)

Trong trang Apps Script, với **từng file** trong thư mục `gas/` của kho mã, **theo đúng thứ tự trong `filePushOrder` của `.clasp.json`** (các file `thuan/` trước, rồi `ketnoi/KhoDuLieu`, rồi các file `ketnoi/` còn lại, cuối cùng `Main`): bấm **+** cạnh "Files" → **Script** → đặt tên đúng (ví dụ `thuan/SoDo`, bỏ đuôi `.gs`) → xóa nội dung mặc định → dán toàn bộ nội dung file → Ctrl+S. Riêng `appsscript.json`: mở file manifest có sẵn, thay toàn bộ bằng nội dung trong kho. **Không** dán các file trong `gas/test/`.

## Phần 3. Chạy thiết lập lần đầu

1. Trong trang Apps Script, ở thanh công cụ chọn file `ketnoi/ThietLap`, ô chọn hàm (cạnh nút Run) chọn **chayThietLapLanDau**.
2. Bấm **Run**. Lần đầu Google hỏi quyền: **Review permissions** → chọn Gmail → nếu hiện "Google hasn't verified this app": bấm **Advanced** → **Go to HTTD3 API (unsafe)** → **Allow**. (Đây là ứng dụng của chính bạn, chạy trên tài khoản của bạn.)
3. Đợi 1–2 phút. Mở **Execution log** (dưới cùng). Phải thấy các dòng: thư mục Drive, ba file, gieo danh mục, và dòng **MẬT KHẨU TẠM (chỉ hiện một lần)** của tài khoản `quantri`. **Chép mật khẩu này ra giấy ngay.**
4. Vào Google Drive: có thư mục `HTTD3` chứa `HTTD3_DanhMuc`, `HTTD3_DuLieu`, `HTTD3_NhatKy` và các thư mục con. Mở `HTTD3_DuLieu` → sheet `NhiemVu`: dòng 1 phải có đủ 47 cột tiêu đề (cột cuối `tinhTrang`).
5. Kiểm tra: chọn hàm **chayKiemTraThietLap** → Run → log phải in `{"thieu":[]}`. Nếu thiếu `GOOGLE_CLIENT_ID`, thêm ở Script Properties rồi chạy lại.

Chạy lại `chayThietLapLanDau` là an toàn: hàm chỉ tạo phần còn thiếu, không ghi đè dữ liệu, không tạo lại tài khoản.

## Phần 4. Triển khai thành web app (lần đầu)

1. Góc trên phải bấm **Deploy** → **New deployment**.
2. Bấm bánh răng cạnh "Select type" → **Web app**.
3. Điền **Description**: `Giai đoạn 1`. **Execute as**: **Me**. **Who has access**: **Anyone**. (Bắt buộc là Anyone để trang trên GitHub Pages gọi được; mọi thao tác vẫn phải đăng nhập trong hệ thống.)
4. Bấm **Deploy** → **Authorize access** nếu được hỏi → sao chép **Web app URL** (kết thúc bằng `/exec`).
5. Trong kho mã, mở `web/config.js`, thay `DIEN_SAU_KHI_TRIEN_KHAI` bằng URL này. Commit, đẩy lên GitHub.
6. Thử ngay trên máy: `node scripts/kiem-tra-api.mjs "<URL>" quantri "<mật khẩu tạm>"` → mọi dòng phải **ĐẠT**. (Nếu dòng đăng nhập báo tài khoản chưa có mật khẩu, kiểm tra lại Phần 3.)

## Phần 5. Cập nhật mã sau này (giữ nguyên URL)

Sau khi `clasp push` (hoặc dán tay) bản mới: **Deploy** → **Manage deployments** → bấm biểu tượng bút chì cạnh bản đang dùng → **Version**: chọn **New version** → **Deploy**. URL không đổi, trang web dùng được ngay.

Nếu quen dòng lệnh: `clasp deployments` (lấy ID bản triển khai) rồi `clasp deploy -i <ID> -d "mô tả"`.

## Phần 6. Cập nhật lên giai đoạn mới (ví dụ giai đoạn 1b — Bộ chỉ tiêu)

Mỗi giai đoạn mới có thể thêm bảng (sheet) hoặc cột mới. Vì vậy, ngoài đẩy mã, cần **chạy lại thiết lập** để hệ thống tạo phần còn thiếu. Thực hiện như sau.

1. **Tải mã mới.** Mở `https://github.com/drgrevolution-creator/httd3` → nút xanh **Code** → **Download ZIP**. Giải nén, ví dụ vào `C:\Users\User\httd3\httd3-main`. Có thể ghi đè thư mục cũ; file `.clasp.json` trong ZIP đã có sẵn mã dự án Apps Script. (Nếu máy đã cài git và đã `git clone`, chỉ cần `git pull`.)
2. **Đẩy mã lên Apps Script.** Mở cửa sổ dòng lệnh (`cmd`) tại thư mục vừa giải nén:

   ```bash
   cd C:\Users\User\httd3\httd3-main
   ```

   ```bash
   clasp push
   ```

   Khi được hỏi ghi đè manifest thì gõ `y`. Danh sách file đẩy lên phải có thêm `thuan/BoChiTieu.gs` và `ketnoi/ChiTieuGas.gs`.
3. **Chạy lại thiết lập.** Trong trang Apps Script, mở file `ketnoi/ThietLap`, chọn hàm **chayThietLapLanDau**, bấm **Run**. Đọc **Execution log**:
   - Phải thấy dòng `Gieo DM_BoChiTieu: 5 dòng` và dòng `Tài khoản quản trị đã có, không tạo lại`. Lần chạy lại này **không** in mật khẩu tạm mới; mật khẩu đang dùng giữ nguyên.
   - Mở file `HTTD3_DuLieu` trên Drive: có sheet mới `ChiTieu_TrongBo`; sheet cũ `ChiTieu_NguonQuyDinh` (trống) không còn. File `HTTD3_DanhMuc` có sheet mới `DM_BoChiTieu` gồm 5 bộ.
   - Nếu có dòng **"CẢNH BÁO <tên bảng>: tiêu đề hiện có khác sơ đồ, không ghi đè vì sheet đã có dữ liệu"**: hệ thống **chưa** thêm cột mới cho bảng đó, để bảo vệ dữ liệu đang có. Dừng lại, chụp log gửi Claude. Không tự sửa tiêu đề.
4. **Kiểm tra.** Chọn hàm **chayKiemTraThietLap** → **Run** → log phải in `{"thieu":[]}`.
5. **Triển khai phiên bản mới** theo Phần 5 (Manage deployments → bút chì → **New version** → Deploy). URL giữ nguyên.
6. **Trang web** trên GitHub Pages tự cập nhật sau khi Claude gộp mã vào nhánh `main`, thường trong 1–2 phút. Mở trang, bấm Ctrl+F5 (trên điện thoại: kéo xuống để tải lại). Menu phải có thêm mục **📊 Chỉ tiêu**.

Sau đó làm tiếp tài liệu 05 (nhập bộ chỉ tiêu) và 06 (nghiệm thu giai đoạn 1b).

## Sự cố thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| `clasp push` báo `User has not enabled the Apps Script API` | Làm lại Phần 2A bước 3, đợi 1 phút |
| Chạy hàm báo `CHUA_THIET_LAP` | Chạy `chayThietLapLanDau` trước |
| Trang web báo "Không kết nối được máy chủ" | URL trong `web/config.js` sai hoặc chưa deploy; thử mở `<URL>?action=heThong.sucKhoe` trên trình duyệt, phải thấy JSON |
| Email nhắc không gửi | Hạn mức 100 thư/ngày của Gmail; xem sheet `SaoLuu`, `NhatKy` |
