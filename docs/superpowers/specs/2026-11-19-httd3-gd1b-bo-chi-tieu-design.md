# BẢN THIẾT KẾ BỔ SUNG: GIAI ĐOẠN 1b — HỆ THỐNG VÀ BỘ CHỈ TIÊU ĐA NGUỒN

Ngày: 19/11/2026 · Phiên bản 0.1 (chờ Mr. Nobody duyệt) · Bổ sung cho `2026-11-14-httd3-design.md` (bản 0.3), mục 7.2, 7.3, 8.2, 12.

## 1. Lý do

Mr. Nobody cần theo dõi trong cùng hệ thống nhiều bộ chỉ tiêu, chỉ số do nhiều cấp ban hành, và mở rộng thêm về sau mà không sửa mã:

| Bộ | Văn bản | Số chỉ tiêu | Có sẵn nội dung 5 trường? |
|---|---|---|---|
| Hệ thống chỉ tiêu thống kê quốc gia | Phụ lục Luật Thống kê (VBHN 37/VBHN-VPQH, 2026) | 230, 21 nhóm | Không: phụ lục chỉ có mã và tên; nội dung nằm ở NĐ 94/2022/NĐ-CP |
| Hệ thống chỉ tiêu thống kê ngành Nội vụ | TT 13/2025/TT-BNV | 76, 8 nhóm | Có (Phụ lục 2) |
| Hệ thống chỉ tiêu thống kê ngành KH&CN | TT 45/2025/TT-BKHCN | 137, 9 nhóm | Có (Phụ lục I, phần II) |
| Danh mục chỉ tiêu, chỉ số theo dõi của Thành ủy | Phụ lục kèm CV 699-CV-TU | 174, 6 nhóm, có chỉ tiêu con "Trong đó" | Một phần; nhiều ô "[bổ sung thông tin]" |
| Bộ chỉ tiêu hợp nhất CĐS (đang chạy trên HTTD 2.0) | QĐ 1266, 2629... | 53 | Chuyển sang ở giai đoạn 5 |

Mỗi chỉ tiêu phải có **năm trường nội dung** theo mẫu của Luật Thống kê và các thông tư ngành (Mr. Nobody yêu cầu 19/11/2026):

1. Khái niệm, phương pháp tính
2. Phân tổ chủ yếu
3. Kỳ công bố
4. Nguồn số liệu
5. Cơ quan chịu trách nhiệm thu thập, tổng hợp — Chủ trì; Phối hợp

Làm trước giai đoạn 2 vì nhiệm vụ ở giai đoạn 2 sẽ trỏ tới chỉ tiêu; đổi cấu trúc chỉ tiêu khi đã có nhiệm vụ gắn vào thì phải chuyển đổi dữ liệu đang dùng.

## 2. Mô hình bốn tầng

```
Hệ thống chỉ tiêu (loại)        ví dụ: Quốc gia · Bộ, ngành · Địa phương · Theo dõi, đánh giá
  └─ Bộ chỉ tiêu (DM_BoChiTieu)  ví dụ: "TT 13/2025/TT-BNV"
       └─ Nhóm trong bộ           ví dụ: "01. Tổ chức hành chính"
            └─ Chỉ tiêu trong bộ (ChiTieu_TrongBo)   mã gốc 0101, tên nguyên văn, 5 trường nội dung
                 └─ (con) "Trong đó: ..."             qua cột chaTrongBo
                 ╎
                 ╎ liên kết "cùng nội hàm" (tùy chọn)
                 ▼
            Chỉ tiêu chuẩn (DM_ChiTieu)   một nội hàm một mã; số liệu theo kỳ (giai đoạn 3) gắn vào đây
```

Nguyên tắc giữ nguyên từ Bộ chỉ tiêu CĐS: **tách hai lớp**. Lớp "chỉ tiêu trong bộ" giữ nguyên văn của từng văn bản, không sửa, không xóa; lớp "chỉ tiêu chuẩn" gom các dòng cùng nội hàm ở nhiều bộ về một mã, để một số liệu phục vụ được mọi bộ. Ví dụ "Tỷ trọng kinh tế số" ở Phụ lục 699 và ở Bộ chỉ tiêu CĐS là hai dòng trong bộ, cùng trỏ về một chỉ tiêu chuẩn.

Mã gốc của văn bản (0101, 0102...) **không dùng làm khóa chung**, vì TT 13, TT 45 và Luật Thống kê đều có mã 0101 cho ba chỉ tiêu khác nhau. Khóa của chỉ tiêu trong bộ là `<mã bộ>:<mã gốc>`, ví dụ `TT13-BNV:0101`.

## 3. Thay đổi dữ liệu

### 3.1. Bảng mới `DM_BoChiTieu` (file DanhMuc)

maBo (tự nhập, ví dụ `LUAT-TK`, `TT13-BNV`, `TT45-BKHCN`, `TU-699`, `CDS-HN`); tenBo; loaiHeThong (`Quốc gia` · `Bộ, ngành` · `Địa phương` · `Theo dõi, đánh giá`); vanBanBanHanh (→ DM_VanBan); coQuanBanHanh; capApDung (Trung ương · Thành phố · Xã); giaiDoan; hieuLucTu; hieuLucDen; thayTheBo (→ DM_BoChiTieu, khi văn bản mới thay văn bản cũ); tinhTrangApDung; soChiTieu (tính khi nhập); ghiChu. Cộng cột hệ thống.

### 3.2. Bảng `ChiTieu_TrongBo` (file DuLieu) thay cho `ChiTieu_NguonQuyDinh`

Bảng `ChiTieu_NguonQuyDinh` hiện đang trống trên hệ thống thật nên thay được không mất dữ liệu; bảng mới chứa đủ các cột cũ của nó.

| Nhóm cột | Cột |
|---|---|
| Định danh | maTrongBo (`<maBo>:<maGoc>` hoặc `<maBo>:<STT>` khi văn bản không có mã) · maBo · maGoc · sttTrongBo · nhomMa · nhomTen · chaTrongBo · tenNguyenVan |
| **Năm trường nội dung** | khaiNiemPhuongPhapTinh · phanToChuYeu · kyCongBo · nguonSoLieu · coQuanChuTriThuThap · coQuanPhoiHopThuThap |
| Thuộc tính đo | donViTinh · thuocTinhTongHop (`Tỷ lệ` · `Lũy kế từ đầu năm` · `Thời điểm` · `Phát sinh trong kỳ`) · capDuLieu (`Thành phố` · `Xã` · `Thành phố/Xã` · `Trung ương`) · kyBaoCaoTP · kyBaoCaoXa · thoiDiemChotSoLieu |
| Mục tiêu và căn cứ | mucTieu (danh sách `{giaiDoan, nguyenVan, phep, so}`, ví dụ KH 2026 `>=10`, KH 2026–2030 `>=10`) · viTriTrongVanBan · canCuNguyenVan · coQuanXacNhanSoLieu |
| Liên kết | maChiTieu (→ DM_ChiTieu, chỉ tiêu chuẩn, có thể trống) · tinhTrangHieuLuc · biThayTheBoi · ghiChu |

Trường 5 lưu **nguyên văn** cơ quan Trung ương, Thành phố ghi trong văn bản. Văn bản chỉ ghi một cơ quan (như TT 13: "Vụ Chính quyền địa phương, Bộ Nội vụ") thì vào ô Chủ trì, ô Phối hợp để trống. Đơn vị chủ trì, phối hợp **tại xã** là việc khác, nằm ở chỉ tiêu chuẩn (đã có `donViChuTriTaiXa`, `donViPhoiHop`) và được đề xuất theo ma trận phân công đơn vị của xã.

### 3.3. Bổ sung `DM_ChiTieu` (chỉ tiêu chuẩn)

Thêm: chaChiTieu · linhVucLon (`Kinh tế` · `Văn hóa – xã hội` · `Đô thị, môi trường` · `Cải cách hành chính` · `Quốc phòng – an ninh` · `Xây dựng Đảng` · `Hệ thống chính trị` · `Khác`) · thuocTinhTongHop · capDuLieu · kyBaoCaoXa · năm trường nội dung "chuẩn" (sao từ bộ có hiệu lực pháp lý cao nhất mà chỉ tiêu thuộc về; sửa được).

`mucLienQuanCapXa` (A/B/C, đã có) được gợi ý tự động khi nhập: cấp dữ liệu có "Xã" → A; chỉ "Thành phố" → C; người dùng đổi được.

## 4. Nhập dữ liệu

**Mẫu nhập chuẩn** (một file Excel, một sheet, mỗi dòng một chỉ tiêu trong bộ, cột đúng tên ở mục 3.2, kèm sheet "Bộ" một dòng). Mọi bộ đều đi qua mẫu này:

- Văn bản Word (Luật, thông tư, nghị định): Claude chuyển sang mẫu chuẩn (đọc danh mục và phần nội dung), Mr. Nobody xem lại rồi nhập. Không đọc Word trong Apps Script.
- Excel có cấu trúc riêng như Phụ lục 699: Claude chuyển sang mẫu chuẩn một lần; nếu Thành phố gửi lại bản cập nhật cùng mẫu, dùng lại cách chuyển đó.
- Mr. Nobody hoặc đơn vị tự điền mẫu chuẩn cho bộ mới.

Màn **Nhập bộ chỉ tiêu** (QUANTRI):

1. Chọn file mẫu chuẩn (đọc ngay trên trình duyệt bằng thư viện SheetJS từ CDN).
2. Xem trước: số dòng, số nhóm, số chỉ tiêu con, lỗi từng dòng (thiếu tên, mã trùng trong bộ, cha không tồn tại, giá trị ngoài danh sách).
3. **Gợi ý ghép nội hàm**: với mỗi dòng, hệ thống đề xuất chỉ tiêu chuẩn có tên gần giống (so khớp sau khi bỏ dấu, bỏ từ "tỷ lệ, số, tổng"...). Người nhập chọn: ghép, tạo chỉ tiêu chuẩn mới, hoặc để trống.
4. Ghi theo lô dưới khóa; nhập lại cùng bộ thì cập nhật dòng trùng `maTrongBo`, dòng cũ không còn trong file được đánh dấu "Hết hiệu lực", không xóa. Mọi thay đổi vào nhật ký.

## 5. Giao diện

- Menu mới **Chỉ tiêu** (mọi vai trò xem; QUANTRI sửa, nhập).
- Màn **Bộ chỉ tiêu**: cột trái danh sách bộ, nhóm theo loại hệ thống; cột phải cây nhóm → chỉ tiêu → chỉ tiêu con, mỗi dòng có mã gốc, tên, đơn vị, kỳ, cấp, nhãn "Cấp xã" nếu liên quan xã. Lọc: chỉ cấp xã · theo lĩnh vực lớn · tìm theo tên.
- Bấm một chỉ tiêu: tấm trượt hiện **năm trường nội dung** thành năm mục rõ ràng, mục tiêu theo giai đoạn, căn cứ, và khung "Cùng nội hàm ở các bộ khác" (danh sách bộ có chỉ tiêu này).
- Màn **Chỉ tiêu chuẩn**: danh sách chỉ tiêu một nội hàm một mã, mỗi dòng cho biết thuộc bao nhiêu bộ.

## 6. Dữ liệu nạp sẵn trong giai đoạn 1b

| Bộ | Nội dung nạp |
|---|---|
| `LUAT-TK` | 230 chỉ tiêu, 21 nhóm, mã và tên; năm trường để trống, ghi chú "nội dung theo NĐ 94/2022/NĐ-CP" |
| `TT13-BNV` | 76 chỉ tiêu, đủ năm trường |
| `TT45-BKHCN` | 137 chỉ tiêu, đủ năm trường |
| `TU-699` | 174 dòng, cha con, mục tiêu KH 2026 và 2026–2030, cấp dữ liệu, kỳ báo cáo, thuộc tính; các ô "[bổ sung thông tin]" để trống |

Ghép nội hàm ban đầu: Claude đề xuất danh sách ghép trong file Excel để Mr. Nobody duyệt trước khi nhập; không tự ghép ngầm.

## 7. Không làm trong giai đoạn 1b

Nhập số liệu thực hiện theo kỳ, tổng hợp, bảng theo dõi ngưỡng (giai đoạn 3); chuyển Bộ chỉ tiêu CĐS từ HTTD 2.0 (giai đoạn 5); đọc Word tự động trong hệ thống.

## 8. Nghiệm thu

1. Bốn bộ hiện đúng số chỉ tiêu ở bảng mục 6; cây Phụ lục 699 có chỉ tiêu con dưới đúng cha.
2. Mở chỉ tiêu `TT13-BNV:0101` thấy đủ năm trường đúng nguyên văn Phụ lục 2.
3. Lọc "chỉ cấp xã" ở bộ `TU-699` ra khoảng 58 chỉ tiêu.
4. Nhập lại một file mẫu chuẩn đã sửa một dòng: chỉ dòng đó đổi, nhật ký ghi SUA, không dòng nào bị xóa.
5. Một chỉ tiêu ghép nội hàm hiện "Cùng nội hàm ở các bộ khác" đúng.

## 9. Quyết định cần Mr. Nobody

1. **Duyệt mô hình bốn tầng** (mục 2) và việc thay `ChiTieu_NguonQuyDinh` bằng `ChiTieu_TrongBo`.
2. **Nội dung chỉ tiêu quốc gia**: Mr. Nobody gửi NĐ 94/2022/NĐ-CP (và văn bản sửa đổi nếu có) để nạp đủ năm trường cho 230 chỉ tiêu; nếu chưa có, giai đoạn 1b nạp mã và tên trước.
3. **Ghép nội hàm**: đồng ý cách làm Claude đề xuất danh sách ghép để Mr. Nobody duyệt (mục 6).

Quyết định Claude tự đưa ra (có thể bác): khóa `<maBo>:<maGoc>`; mẫu nhập chuẩn Excel làm cửa ngõ duy nhất; đọc Excel trên trình duyệt bằng SheetJS; nhập lại cùng bộ là cập nhật, không xóa; năm trường "chuẩn" sao từ bộ có hiệu lực pháp lý cao nhất; mức liên quan cấp xã gợi ý từ cấp dữ liệu.
