# HTTD 3.0 — Bổ sung Tử số, Mẫu số cho chỉ tiêu tỷ lệ (thiết kế ngắn)

Phiên bản 0.1 · 24/11/2026 · Mr. Nobody chốt cách A, cách xây 1 và bốn loại giá trị (24/11/2026)

## 1. Ý định

Với chỉ tiêu tính theo tỷ lệ (%), người phụ trách nhập định kỳ hai số là **tử số** và **mẫu số**, hệ thống tự tính giá trị. Muốn vậy, mỗi chỉ tiêu phải ghi rõ trước: chỉ tiêu thuộc **loại giá trị** nào, **tử số là gì**, **mẫu số là gì**, nhân với **hệ số** bao nhiêu. Giai đoạn này ghi các định nghĩa đó; màn **Nhập số liệu kỳ** làm ở giai đoạn 3 và dùng lại chúng.

Bảng số liệu của giai đoạn 3 đã có sẵn cột tử số, mẫu số, giá trị (`SoLieuChiTieu`, `TongHopChiTieuKy` theo nguyên tắc "tổng tử ÷ tổng mẫu" của HTTD 2.0). Chỉ thiếu phần định nghĩa nằm trên từng chỉ tiêu.

## 2. Mục tiêu

- Mỗi chỉ tiêu (trong bộ và chỉ tiêu chuẩn) có 4 thông tin: loại giá trị, định nghĩa tử số, định nghĩa mẫu số, hệ số nhân.
- **Loại giá trị là một danh mục** Mr. Nobody tự thêm được ở màn Danh mục khi cần, không phải sửa mã (Mr. Nobody yêu cầu "mở rộng sẵn khi cần").
- Claude điền sẵn cho 77 chỉ tiêu đơn vị % của Phụ lục 699 (75 "%" và 2 "%/GRDP") để Mr. Nobody duyệt rồi nạp.
- Tấm chi tiết chỉ tiêu có mục **Cách tính**.

## 3. Không làm, và điều phải tránh

- Không làm màn nhập số liệu kỳ, không tính giá trị. Việc này thuộc giai đoạn 3.
- Không điền cho các bộ Trung ương (LUAT-TK, TT13, TT45) ở đợt này. Phương pháp tính của các bộ này đã có trong mục 1 "Khái niệm, phương pháp tính".
- **Tránh:** coi tốc độ tăng (ví dụ tăng trưởng GRDP, do Thống kê Thành phố tính) là tỷ lệ tử/mẫu; xã không có tử số và mẫu số cho các chỉ tiêu này. Cũng tránh làm hỏng việc nhập lại các bộ đã nạp: cột mới để trống vẫn nhập được.

## 4. Cách xây đã chốt

Đã cân nhắc ba chỗ đặt định nghĩa:

1. **Đặt ở từng chỉ tiêu trong bộ, sao sang chỉ tiêu chuẩn khi ghép (đã chọn).** Duyệt và nạp được ngay qua file mẫu chuẩn, không cần ghép trước.
2. Chỉ đặt ở chỉ tiêu chuẩn: phải ghép đủ 77 chỉ tiêu trước, làm ngược thứ tự công việc.
3. Đặt ở bảng phân công nhập số liệu (giai đoạn 3): cũng cần chỉ tiêu chuẩn có trước, và phải chờ giai đoạn 3.

## 5. Thiết kế

**5.1. Danh mục mới `DM_LoaiGiaTri`** (file Danh mục, mã tự nhập), gồm các cột:

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `maLoaiGiaTri` | khóa | |
| `tenLoaiGiaTri` | bắt buộc | |
| `coTuSoMauSo` | đúng/sai | giai đoạn 3 dựa vào cột này để hiện hai ô nhập tử, mẫu |
| `heSoNhanMacDinh` | số | |
| `ghiChu` | chữ | |

Gieo sẵn 4 dòng:

| Mã | Tên | Có tử/mẫu | Hệ số mặc định |
|---|---|---|---|
| `TY_LE` | Tỷ lệ (tử số/mẫu số) | Có | 100 |
| `TOC_DO` | Tốc độ, chỉ số nhận từ cơ quan khác | Không | — |
| `SO_TUYET_DOI` | Số tuyệt đối | Không | — |
| `XEP_HANG` | Xếp hạng, điểm số | Không | — |

Thêm loại mới bằng màn Danh mục, chỉ quản trị viên được làm.

**5.2. Bốn cột mới ở cả `ChiTieu_TrongBo` và `DM_ChiTieu`:**

| Cột | Kiểu |
|---|---|
| `loaiGiaTri` | tham chiếu `DM_LoaiGiaTri` |
| `dinhNghiaTuSo` | chữ dài |
| `dinhNghiaMauSo` | chữ dài |
| `heSoNhan` | số |

Cột mới đặt sau các cột của giai đoạn 1b, trước các cột hệ thống. Hệ thống đang chạy có dữ liệu sẽ được chèn cột tự động khi chạy lại `chayThietLapLanDau`, theo cơ chế đã xây ở giai đoạn 1b.

**5.3. Kiểm tra khi nhập:**

- Có loại giá trị thì loại đó phải có trong danh mục.
- Loại có tử/mẫu thì phải ghi đủ định nghĩa tử số và mẫu số; thiếu là lỗi dòng.
- Hệ số nhân phải là số dương. Để trống thì dùng hệ số mặc định của loại.

**5.4. Ghép nội hàm:** khi tạo chỉ tiêu chuẩn mới, sao 4 cột này cùng năm mục nội dung. Ghép vào chỉ tiêu chuẩn đã có thì không ghi đè.

**5.5. Giao diện:** tấm chi tiết của chỉ tiêu trong bộ và của chỉ tiêu chuẩn có thêm mục **Cách tính** khi đã có loại giá trị. Ví dụ:

```
Cách tính
  Loại giá trị: Tỷ lệ (tử số/mẫu số)
  Tử số:  Số hồ sơ giải quyết đúng hạn
  Mẫu số: Tổng số hồ sơ đã giải quyết
  Giá trị = Tử số ÷ Mẫu số × 100 (%)
```

Chỉ tiêu chuẩn sửa được ở màn Danh mục (màn này tự sinh ô nhập từ sơ đồ). Chỉ tiêu trong bộ sửa bằng cách nhập lại file.

**5.6. Điền sẵn và duyệt:**

- Claude lập file `data/rieng/de-xuat-tu-mau-TU-699.xlsx`, mỗi dòng một chỉ tiêu TU-699, gồm: mã, tên, đơn vị tính, cấp dữ liệu, loại giá trị, tử số, mẫu số, hệ số đề xuất, ghi chú của Claude (độ chắc chắn, lý do), và cột "Mr. Nobody sửa".
- Bao phủ: loại giá trị cho cả 174 dòng; tử số, mẫu số cho 77 chỉ tiêu % đúng như yêu cầu. Claude đề xuất thêm 4 chỉ tiêu "trên 10.000 dân" (hệ số 10.000) và 4 chỉ tiêu bình quân đầu người (hệ số 1). Mr. Nobody có thể bỏ các đề xuất thêm này.
- Mr. Nobody duyệt xong gửi lại. Claude đưa kết quả vào `TU-699.xlsx` (script chuyển đổi đọc file đã duyệt nếu có). Mr. Nobody nhập lại; bước xem trước phải ra "Sửa N, Thêm 0, Hết hiệu lực 0".

**5.7. Giai đoạn 3 sẽ dùng các định nghĩa này:**

- Loại có tử/mẫu: biểu mẫu hiện hai ô, nhãn lấy theo định nghĩa tử số và mẫu số. Giá trị = tử ÷ mẫu × hệ số. Tổng hợp toàn xã = tổng tử ÷ tổng mẫu × hệ số.
- `ChiTieu_PhanCong.cauHoiTuSo` và `cauHoiMauSo` mặc định lấy từ định nghĩa.

## 6. Quyết định Claude tự đưa ra (Mr. Nobody có thể bác)

- Loại giá trị đặt thành danh mục riêng, để thêm loại không phải sửa mã.
- Thêm cột hệ số nhân (100, 10.000, 1).
- Thiếu định nghĩa tử số/mẫu số với loại có tử/mẫu là lỗi chặn nhập, để giai đoạn 3 luôn có câu hỏi rõ.
- Gán loại giá trị cho cả 174 chỉ tiêu TU-699, không chỉ 77 chỉ tiêu %.
- Không đụng các bộ Trung ương ở đợt này.

## 7. Để người xây tự quyết

Tên hiển thị các cột; cách script chuyển đổi trộn file đã duyệt; vị trí mục "Cách tính" trong tấm chi tiết; nội dung câu chữ của các đề xuất.

## 8. Nghiệm thu

1. Màn Danh mục có "Loại giá trị" với 4 dòng; thêm được dòng thứ 5.
2. Sau khi nhập lại TU-699: mở một chỉ tiêu % thấy mục Cách tính đúng như file đã duyệt.
3. Ghép tạo chỉ tiêu chuẩn mới từ dòng đó thì chỉ tiêu chuẩn có đủ 4 thông tin.
4. Một dòng loại "Tỷ lệ" mà thiếu tử số thì bị báo lỗi đúng số dòng Excel.
5. Nhập lại các bộ TT13, TT45, LUAT-TK (chưa có cột mới) vẫn ra "Giữ nguyên", không sinh Sửa.
