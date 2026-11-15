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

## Chạy kiểm thử

```bash
npm test        # lớp thuần
npm run test:web   # giao diện (cần Playwright và Chromium)
```

Không cần cài gói nào: chỉ dùng Node 22 trở lên.
