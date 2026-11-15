# 01. Tạo Client ID để đăng nhập bằng Google (không tốn phí, không cần thẻ)

Mục đích: cho phép người dùng bấm "Đăng nhập bằng Google" trên trang HTTD 3.0. Việc này chỉ làm **một lần**, mất khoảng 10 phút. Google **không yêu cầu thẻ thanh toán** cho bước này; nếu màn hình nào đòi bật "Billing" (thanh toán) thì bỏ qua, không bật.

Cần có trước: địa chỉ trang GitHub Pages của bạn, dạng `https://<tên-github>.github.io` (xem tài liệu 03). Nếu chưa có, cứ làm trước với địa chỉ dự kiến, sau này sửa lại được.

## Bước 1. Tạo dự án Google Cloud

1. Mở trình duyệt, đăng nhập đúng Gmail đang dùng cho HTTD (Gmail sở hữu các file Sheets).
2. Vào `https://console.cloud.google.com/projectcreate`.
3. Ô **Project name**: gõ `HTTD3` (tên gì cũng được). Ô **Location** để nguyên "No organization".
4. Bấm **Create**. Đợi vài giây, góc trên bên phải báo đã tạo. Bấm **Select project** (hoặc chọn `HTTD3` ở ô chọn dự án phía trên cùng).

## Bước 2. Khai báo màn hình đồng ý (OAuth consent screen)

1. Menu ba gạch (góc trên trái) → **APIs & Services** → **OAuth consent screen** (giao diện mới có thể gọi là **Google Auth Platform** → **Branding**).
2. Nếu hỏi **User Type**: chọn **External** → **Create**. (Gmail cá nhân chỉ có lựa chọn này.)
3. Điền:
   - **App name**: `HTTD 3.0 - UBND xã Phước Hải`
   - **User support email**: chọn Gmail của bạn
   - **Developer contact information**: Gmail của bạn
   - Các ô khác để trống. Bấm **Save and continue** cho đến hết (phần Scopes và Test users không cần thêm gì).
4. Quay lại trang **OAuth consent screen** (hoặc **Audience**). Nếu thấy trạng thái **Testing**, bấm **Publish app** → **Confirm**. Trạng thái phải là **In production** để mọi Gmail đăng nhập được (ở trạng thái Testing chỉ 100 người được liệt kê mới dùng được).
   - Vì ứng dụng chỉ xin ba phạm vi cơ bản (email, hồ sơ, openid), Google **không** yêu cầu xét duyệt; có thể hiện dòng "Needs verification" nhưng vẫn đăng nhập bình thường.

## Bước 3. Tạo Client ID

1. Menu → **APIs & Services** → **Credentials** (hoặc **Google Auth Platform** → **Clients**).
2. Bấm **+ Create credentials** → **OAuth client ID**.
3. **Application type**: chọn **Web application**.
4. **Name**: `HTTD3 web`.
5. Mục **Authorized JavaScript origins** → **+ Add URI**, thêm từng dòng:
   - `https://<tên-github>.github.io` (thay đúng tên GitHub của bạn; **không** có dấu `/` ở cuối, **không** có `/httd3`)
   - `http://localhost:8080` (để thử trên máy, tùy chọn)
6. Mục **Authorized redirect URIs**: để trống.
7. Bấm **Create**. Một hộp thoại hiện **Your Client ID**, dạng `1234567890-abc...xyz.apps.googleusercontent.com`. Bấm biểu tượng sao chép. (Client Secret không dùng đến, không cần lưu.)

## Bước 4. Dán Client ID vào hai chỗ

1. **Trong kho mã**, mở `web/config.js`, thay `DIEN_SAU_KHI_TAO` bằng Client ID vừa sao chép (giữ dấu nháy). Lưu, commit, đẩy lên GitHub.
2. **Trong Apps Script** (sau khi làm tài liệu 02): mở dự án Apps Script → biểu tượng bánh răng **Project Settings** → cuộn xuống **Script Properties** → **Add script property**: Property = `GOOGLE_CLIENT_ID`, Value = Client ID → **Save script properties**.

Client ID là giá trị **công khai** (ai xem mã nguồn trang cũng thấy), nên đặt trong kho GitHub công khai là bình thường.

## Kiểm tra

Mở trang HTTD 3.0 trên GitHub Pages: nút "Đăng nhập bằng Google" hiện ra (không còn dòng "chưa được cấu hình"). Bấm nút, chọn Gmail đã được quản trị cấp tài khoản → vào được màn Hôm nay.

Lỗi hay gặp:

| Thông báo | Nguyên nhân | Cách sửa |
|---|---|---|
| `The given origin is not allowed for the given client ID` | Địa chỉ trang khác với dòng đã khai ở Bước 3.5 | Thêm đúng origin (có `https://`, không có đường dẫn) rồi đợi 5 phút |
| `Email ... chưa được cấp tài khoản` | Gmail chưa có trong Người dùng | Quản trị vào Quản trị → Người dùng → Thêm, điền đúng Gmail |
| Nút không hiện, dòng "Không tải được thư viện Google" | Trình duyệt chặn `accounts.google.com` | Tắt tiện ích chặn, hoặc dùng đăng nhập bằng mật khẩu |
