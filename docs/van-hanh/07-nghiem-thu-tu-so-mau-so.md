# 07. Bảng kiểm nghiệm thu: Tử số, mẫu số cho chỉ tiêu tỷ lệ

Người nghiệm thu: Mr. Nobody. Thực hiện trên bản triển khai thật, sau khi:

- đã cập nhật Apps Script theo tài liệu 02 Phần 6 (chạy lại `chayThietLapLanDau`);
- đã nhập lại `TU-699.xlsx` có tử/mẫu đã duyệt theo tài liệu 05 mục 4b.

Ở cột **Kết quả** ghi ĐẠT hoặc LỖI. Năm mục dưới đây đúng với bản thiết kế `2026-11-24-httd3-tu-so-mau-so-design.md`, mục 8.

**Trước khi kiểm:**

- Log của lần chạy lại `chayThietLapLanDau` có dòng "Gieo DM_LoaiGiaTri: 4 dòng".
- Nếu bảng đã có dữ liệu, log có dòng "Đã bổ sung 4 cột cho ChiTieu_TrongBo / DM_ChiTieu (giữ nguyên dữ liệu)".
- `chayKiemTraThietLap` in `{"thieu":[]}`.

| # | Việc kiểm tra | Cách làm | Mong đợi | Kết quả | Ghi chú |
|---|---|---|---|---|---|
| 1 | Danh mục Loại giá trị mở rộng được | **Danh mục** → **Loại giá trị chỉ tiêu**. Bấm **Thêm**, nhập mã `THU`, tên "Thử", đánh dấu "Có tử số và mẫu số", rồi Lưu. Sau đó bấm **Ngừng** dòng `THU`, ghi lý do "thử" | Có đủ 4 loại `TY_LE`, `TOC_DO`, `SO_TUYET_DOI`, `XEP_HANG`; thêm được dòng thứ 5; ngừng được dòng đó | | |
| 2 | Cách tính hiện đúng | **Chỉ tiêu** → `TU-699`, mở "Tổng số hồ sơ đã giải quyết đúng hạn" | Mục **Cách tính**: loại "Tỷ lệ (tử số/mẫu số)", tử số và mẫu số đúng như file đã duyệt, dòng "Giá trị = Tử số ÷ Mẫu số × 100 (%)" | | |
| 3 | Ghép sao sang chỉ tiêu chuẩn | Trên dòng ở mục 2, bấm **Ghép nội hàm**, tạo mã mới (ví dụ `HS-01`). Sau đó mở thẻ **Chỉ tiêu chuẩn** | Chỉ tiêu chuẩn `HS-01` có đủ loại giá trị, tử số, mẫu số, hệ số (xem ở **Danh mục** → Chỉ tiêu phát triển KT-XH, hoặc trong tấm chi tiết) | | |
| 4 | Thiếu định nghĩa vẫn nhập được | Nhờ Claude gửi một file mẫu có một chỉ tiêu loại `TY_LE` để trống tử số. Nhập file | Xem trước hiện khung vàng cảnh báo "Chưa quy định phương pháp tính", đúng số dòng Excel; nút Ghi vẫn bấm được. Sau khi Ghi, mục Cách tính của dòng đó ghi "Chưa quy định phương pháp tính" | | |
| 5 | Bộ cũ không bị ảnh hưởng | Nhập lại `TT13-BNV.xlsx`, `TT45-BKHCN.xlsx`, `LUAT-TK.xlsx` (bản tải về trước đây) | Mỗi bộ: "Thêm 0 · Sửa 0 · Hết hiệu lực 0 · Giữ nguyên N"; nút Ghi bị khóa vì không có gì để ghi | | |

**Dùng ở giai đoạn 3:** với loại có tử/mẫu, biểu mẫu nhập số liệu kỳ hiện hai ô, nhãn lấy theo định nghĩa tử số và mẫu số. Chỉ tiêu chưa có định nghĩa thì nhãn là "Tử số", "Mẫu số" kèm ghi chú "chưa quy định phương pháp tính". Hệ thống tính giá trị = tử ÷ mẫu × hệ số; tổng hợp toàn xã = tổng tử ÷ tổng mẫu × hệ số.
