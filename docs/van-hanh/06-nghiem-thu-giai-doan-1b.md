# 06. Bảng kiểm nghiệm thu giai đoạn 1b (Bộ chỉ tiêu)

Người nghiệm thu: Mr. Nobody. Thực hiện trên bản triển khai thật (Apps Script + Sheets + GitHub Pages), sau khi đã làm xong tài liệu 02 Phần 6 (cập nhật hệ thống) và tài liệu 05 mục 2 (nhập bốn bộ). Ở cột **Kết quả** ghi ĐẠT hoặc LỖI, kèm ghi chú nếu cần. Giai đoạn 1b kết thúc khi không còn ô LỖI.

Năm mục dưới đây đúng với bản thiết kế 1b, mục 8.

**Trước khi kiểm, cần thấy:**

- Hàm `chayKiemTraThietLap` in ra `{"thieu":[]}`.
- Execution log của lần chạy lại `chayThietLapLanDau` **không** có dòng "CẢNH BÁO … tiêu đề hiện có khác sơ đồ". Nếu có dòng này, dừng lại và gửi Claude ảnh chụp log.
- Bốn bộ đã nhập xong theo tài liệu 05 mục 2.

| # | Việc kiểm tra | Cách làm | Mong đợi | Kết quả | Ghi chú |
|---|---|---|---|---|---|
| 1 | Số chỉ tiêu từng bộ; cây cha con của Phụ lục 699 | Mở menu **📊 Chỉ tiêu**, xem số bên cạnh từng bộ. Chọn `TU-699`, tìm dòng STT 4 "Tốc độ tăng trưởng GRDP" | `TU-699` 174 · `TT13-BNV` 76 · `TT45-BKHCN` 137 · `LUAT-TK` 230. Dưới STT 4 thụt vào là STT 5–8 ("- Nông nghiệp…", "- Công nghiệp và xây dựng"…). Dưới STT 6 thụt thêm một bậc là các dòng "Trong đó…". Bấm ▾ thì thu gọn được | | |
| 2 | Năm mục nội dung | Chọn `TT13-BNV`, bấm dòng `0101` "Số đơn vị hành chính". Sau đó chọn `LUAT-TK`, bấm dòng `0101` | `TT13-BNV:0101` hiện đủ năm mục, đúng nguyên văn Phụ lục 2 Thông tư 13/2025/TT-BNV, giữ nguyên xuống dòng. Mục 5 có Chủ trì "Vụ Chính quyền địa phương, Bộ Nội vụ.", ô Phối hợp để trống. `LUAT-TK:0101` hiện mã, tên và dòng "Chưa có nội dung — theo NĐ 94/2022/NĐ-CP" | | |
| 3 | Lọc chỉ tiêu cấp xã | Chọn `TU-699`, bấm **Chỉ cấp xã** | Hiện "58 chỉ tiêu khớp / 174"; mỗi dòng khớp có nhãn tím **Cấp xã** | | |
| 4 | Nhập lại file đã sửa một dòng | Nhờ Claude gửi file `TT13-BNV.xlsx` đã sửa tên một chỉ tiêu (không tự mở rồi lưu lại bằng Excel, xem tài liệu 05 mục 1). Nhập file theo tài liệu 05 mục 2. Sau đó mở **Nhật ký** (để "Mọi bảng"), xem các dòng mới nhất | Xem trước hiện **Thêm 0 · Sửa 1 · Hết hiệu lực 0 · Giữ nguyên 75**. Sau khi Ghi, chỉ dòng đó đổi tên. Nhật ký mới nhất có đúng một dòng **SUA** của bảng `ChiTieu_TrongBo` cho mã đó, kèm căn cứ. Bộ vẫn có 76 chỉ tiêu, không dòng nào bị xóa | | |
| 5 | Ghép nội hàm | Làm theo tài liệu 05 mục 4 với một cặp đã duyệt, ví dụ `LUAT-TK:0109` và chỉ tiêu "Tuổi thọ trung bình tính từ lúc sinh" của TU-699. Sau đó mở lại hai dòng | Mỗi dòng đều hiện **Chỉ tiêu chuẩn: <mã> — <tên>**. Mục **Cùng nội hàm ở các bộ khác** của dòng này liệt kê dòng kia và ngược lại | | |

Ghi lại các lỗi phát hiện (nếu có) theo dạng: số mục, hiện tượng, ảnh chụp màn hình. Gửi Claude để sửa trước khi chuyển sang giai đoạn 2.
