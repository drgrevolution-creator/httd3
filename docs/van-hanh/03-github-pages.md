# 03. Đưa giao diện lên GitHub Pages

Giao diện là các file tĩnh trong thư mục `web/`. GitHub Pages phục vụ chúng miễn phí tại `https://<tên-github>.github.io/httd3/`.

## Bước 1. Tạo kho và đẩy mã (một lần)

1. Đăng nhập GitHub → góc trên phải **+** → **New repository**.
2. **Repository name**: `httd3`. Chọn **Public** (Pages miễn phí chỉ dùng được với kho công khai). **Không** tích thêm README hay .gitignore. Bấm **Create repository**.
3. Trên máy, trong thư mục kho mã:

```bash
git remote add origin https://github.com/<tên-github>/httd3.git
git push -u origin main
```

(Nếu Claude đã đẩy giúp từ phiên làm việc, bỏ qua bước này.)

## Bước 2. Bật Pages bằng GitHub Actions

1. Vào kho trên GitHub → **Settings** → **Pages** (menu trái).
2. Mục **Build and deployment** → **Source**: chọn **GitHub Actions**. Không cần chọn gì thêm; kho đã có sẵn workflow `.github/workflows/pages.yml` chỉ xuất bản thư mục `web/`.
3. Vào tab **Actions** → chọn workflow **Xuất bản giao diện lên GitHub Pages** → **Run workflow** → **Run workflow** (lần đầu chạy tay; về sau tự chạy mỗi khi `web/` thay đổi trên nhánh `main`).
4. Đợi 1–2 phút, vào lại **Settings** → **Pages**: hiện dòng "Your site is live at https://<tên-github>.github.io/httd3/". Bấm **Visit site**.

## Bước 3. Điền cấu hình và kiểm tra

1. `web/config.js` phải đã có `API_URL` (tài liệu 02) và `GOOGLE_CLIENT_ID` (tài liệu 01). Commit, đẩy lên `main`; Actions tự chạy lại.
2. Mở `https://<tên-github>.github.io/httd3/` trên điện thoại:
   - Màn đăng nhập hiện nút Google và ô tên, mật khẩu.
   - Đăng nhập bằng `quantri` + mật khẩu tạm → bị yêu cầu đổi mật khẩu → đổi xong vào Hôm nay.
3. Thêm trang vào màn hình chính điện thoại (Chrome: menu ⋮ → **Thêm vào màn hình chính**) để mở như ứng dụng.

## Lưu ý

- Kho công khai: mã nguồn ai cũng đọc được, nhưng **không có dữ liệu hay bí mật nào trong kho**. Dữ liệu nằm trong Sheets của bạn, khóa và mật khẩu nằm trong Apps Script.
- Muốn tên miền riêng (ví dụ `httd.phuochai.gov.vn`) thì Settings → Pages → **Custom domain** và nhờ đơn vị quản lý tên miền trỏ bản ghi CNAME; khi đó nhớ thêm origin mới vào Client ID (tài liệu 01, bước 3.5).
