# 04. Bảng kiểm nghiệm thu giai đoạn 1 (Nền tảng)

Người nghiệm thu: Mr. Nobody. Hệ thống: bản triển khai thật (Apps Script + Sheets + GitHub Pages). Điền cột **Kết quả** bằng ĐẠT / LỖI và ghi chú. Giai đoạn 1 kết thúc khi không còn ô LỖI.

Theo bản thiết kế §12, giai đoạn 1 nghiệm thu bằng: đăng nhập được hai cách trên điện thoại; sửa một danh mục và thấy nhật ký; sao lưu đêm chạy.

| # | Việc kiểm tra | Cách làm | Mong đợi | Kết quả | Ghi chú |
|---|---|---|---|---|---|
| 1 | Công cụ kiểm tra API | Trên máy: `node scripts/kiem-tra-api.mjs "<URL>" quantri "<mật khẩu>"` | Tất cả dòng ĐẠT | | |
| 2 | Đăng nhập Google trên điện thoại | Mở trang Pages trên điện thoại, bấm nút Google, chọn Gmail quản trị | Vào màn Hôm nay, thanh điều hướng ở dưới | | |
| 3 | Đăng nhập mật khẩu trên điện thoại | Đăng xuất, đăng nhập bằng `quantri` + mật khẩu | Vào màn Hôm nay | | |
| 4 | Bắt buộc đổi mật khẩu tạm | Tạo người dùng mới ở Quản trị, đăng nhập bằng mật khẩu tạm | Bị đưa tới Quản trị với nhắc đổi mật khẩu; đổi xong mới thao tác tiếp | | |
| 5 | Khóa sau 5 lần sai | Nhập sai mật khẩu 5 lần | Thông báo khóa 15 phút; sau 15 phút đăng nhập lại được | | |
| 6 | Thêm và sửa một lĩnh vực | Danh mục → Lĩnh vực → Thêm `ATTT`; mở lại, sửa tên có ghi căn cứ | Dòng xuất hiện; tab Nhật ký có THEM và SUA kèm căn cứ | | |
| 7 | Sửa không ghi căn cứ bị chặn | Sửa mà bỏ trống Căn cứ | Báo lỗi tại ô Căn cứ, không lưu | | |
| 8 | Ngừng một dòng danh mục | Bấm Ngừng, ghi lý do | Dòng gạch ngang, nhật ký NGUNG | | |
| 9 | Sheets không đổi kiểu dữ liệu | Thêm lĩnh vực mã `0123`; mở Sheets `HTTD3_DanhMuc` → `DM_LinhVuc` | Ô vẫn là chữ `0123`, không thành 123 | | |
| 10 | Hai người cùng thêm | Hai thiết bị cùng bấm Thêm hai dòng khác nhau gần như đồng thời | Cả hai dòng đều có, mã không trùng | | |
| 11 | Mất mạng khi lưu | Tắt mạng điện thoại rồi bấm Lưu; bật lại, bấm Lưu | Lần đầu báo "Không kết nối được máy chủ"; lần sau lưu được | | |
| 12 | Phiên hết hạn giữa chừng | Để trang mở quá 12 giờ (hoặc quản trị đặt lại mật khẩu từ máy khác) rồi lưu một biểu mẫu | Tấm trượt đăng nhập lại hiện; sau đăng nhập, dữ liệu đang nhập còn nguyên và được lưu | | |
| 13 | Chạy sao lưu ngay | Quản trị → Sức khỏe → "Chạy sao lưu ngay"; mở Drive `HTTD3/SaoLuu` | Có 3 file `SaoLuu_HTTD3_*_<ngày>` | | |
| 14 | Chạy toàn vẹn ngay | "Chạy kiểm tra toàn vẹn ngay" | Báo 0 chỗ lệch; sheet `KiemTraToanVen` có dòng TONG_KET | | |
| 15 | Lịch đêm | Sáng hôm sau mở Sức khỏe | Sao lưu lúc 01:00 và toàn vẹn lúc 02:00 có dòng mới | | |
| 16 | Email cảnh báo | Đổi tên một file Sheets rồi "Chạy sao lưu ngay" (xong đổi lại) | Nhận email `[HTTD 3.0] Sao lưu đêm có lỗi` | | |
| 17 | Vai trò xem | Đăng nhập tài khoản LANHDAO | Không thấy Danh mục, Quản trị chỉ có Tài khoản | | |
| 18 | Máy tính 1280 px | Mở trên máy tính | Thanh điều hướng bên trái; bảng cuộn ngang vẫn thấy cột mã | | |
| 19 | Hết hạn khi đang lưu danh mục | Mở biểu mẫu Thêm lĩnh vực, để phiên hết hạn (hoặc đặt lại mật khẩu từ máy khác), bấm Lưu | Hộp đăng nhập lại hiện đè lên; sau đăng nhập, biểu mẫu và dữ liệu đã gõ còn nguyên, Lưu được | | |
| 20 | Còn mật khẩu tạm thì không thao tác được | Đăng nhập bằng mật khẩu tạm, tải lại trang, cố vào Danh mục | Luôn bị đưa về Quản trị; gọi thao tác khác bị từ chối cho đến khi đổi mật khẩu | | |

Phát hiện lỗi: ghi số dòng và mô tả vào mục dưới, gửi Claude; Claude sửa theo quy trình (viết test tái hiện → sửa → test xanh → đẩy mã) rồi bạn `git pull`, `clasp push`, deploy bản mới (tài liệu 02, Phần 5).

## Lỗi phát hiện khi nghiệm thu

| Ngày | Dòng | Mô tả | Trạng thái |
|---|---|---|---|
| | | | |
