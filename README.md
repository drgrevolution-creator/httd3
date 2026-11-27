# HTTD 3.0 — Hệ thống quản lý nhiệm vụ, chỉ tiêu và chỉ số đánh giá

UBND xã Phước Hải, Thành phố Hồ Chí Minh — Phòng Văn hóa – Xã hội.

Hệ thống thống nhất thay thế HTTD 2.0: một cơ sở dữ liệu (ba file Google Sheets), một mô hình tài khoản, danh mục dùng chung theo Khung kiến trúc dữ liệu Thành phố, các phân hệ Nhiệm vụ, Chỉ tiêu, Bộ chỉ số, Minh chứng, Báo cáo, Cổng Claude.

## Tài liệu

- Bản thiết kế (đã duyệt): `docs/superpowers/specs/2026-11-14-httd3-design.md`
- Kế hoạch giai đoạn 1: `docs/superpowers/plans/2026-11-15-httd3-giai-doan-1-nen-tang.md`
- Tài liệu vận hành: `docs/van-hanh/`

## Cấu trúc thư mục

```
gas/            Mã Apps Script (đẩy lên bằng clasp, rootDir = gas)
  Main.gs       Điểm vào doGet / doPost
  thuan/        Lớp THUẦN: không gọi dịch vụ Google, kiểm thử bằng Node
  ketnoi/       Lớp KẾT NỐI mỏng: Sheets, Drive, Cache, Mail, Trigger
  test/         Kiểm thử lớp thuần (node --test)
web/            Giao diện tĩnh một trang (GitHub Pages)
  test/         Kiểm thử giao diện bằng Playwright với máy chủ API giả
scripts/        Công cụ chạy từ máy người quản trị (kiểm tra API đã triển khai)
docs/           Thiết kế, kế hoạch, tài liệu vận hành
```

## Triển khai lần đầu (theo thứ tự)

1. `docs/van-hanh/01-google-cloud-client-id.md` — tạo Client ID đăng nhập Google (miễn phí, không cần thẻ).
2. `docs/van-hanh/02-trien-khai-apps-script.md` — đẩy mã lên Apps Script, chạy thiết lập lần đầu, lấy URL API.
3. `docs/van-hanh/03-github-pages.md` — bật GitHub Pages cho thư mục `web/`.
4. `docs/van-hanh/04-nghiem-thu-giai-doan-1.md` — bảng kiểm nghiệm thu.

## Giai đoạn 1b — Bộ chỉ tiêu

1. `docs/van-hanh/02-trien-khai-apps-script.md` Phần 6 — cập nhật Apps Script lên giai đoạn mới.
2. `docs/van-hanh/05-nhap-bo-chi-tieu.md` — nhập bốn bộ chỉ tiêu, duyệt và ghép nội hàm.
3. `docs/van-hanh/06-nghiem-thu-giai-doan-1b.md` — bảng kiểm nghiệm thu.
4. `docs/van-hanh/07-nghiem-thu-tu-so-mau-so.md` — nghiệm thu bổ sung tử số, mẫu số (27/11/2026).

Mẫu nhập chuẩn và cách sinh lại: `data/bo-chi-tieu/README.md`.

Kiểm tra nhanh bản API đã triển khai (chạy trên máy quản trị):

```bash
node scripts/kiem-tra-api.mjs "<URL .../exec>" quantri "<mật khẩu>"
```

## Chạy kiểm thử

```bash
npm install     # một lần: tải SheetJS cục bộ cho test màn Nhập
npm test        # lớp thuần
npm run test:web   # giao diện (cần Playwright và Chromium)
npm run test:py    # script chuyển đổi bộ chỉ tiêu (cần Python 3 + openpyxl)
```

Không cần cài gói nào: chỉ dùng Node 22 trở lên (giao diện cần thêm Playwright và Chromium).

## Quy ước mã

- Mỗi file Apps Script là một đối tượng toàn cục cùng tên (`var SoDo = {...}`), chú thích tiếng Việt đầu mỗi hàm.
- Lớp `gas/thuan/` không được gọi dịch vụ Google; mọi hàm mới ở đó phải có test trong `gas/test/`.
- API một cửa: `{phien, action, duLieu}` → `{ok, duLieu}` hoặc `{ok:false, loi:{ma, thongBao}}`; bảng quyền ở `gas/thuan/PhanQuyen.gs`.
- Không có bí mật trong kho: khóa và ID file nằm trong Script Properties của Apps Script.
