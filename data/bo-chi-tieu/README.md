# Mẫu nhập chuẩn các bộ chỉ tiêu (giai đoạn 1b)

Thư mục này chứa các file **mẫu nhập chuẩn** (.xlsx) do Claude chuyển từ văn bản gốc ngày 19/11/2026. Đây là các file dùng để nhập vào HTTD 3.0 qua màn hình **Nhập bộ chỉ tiêu**.

## 1. Danh sách file

| File | Bộ | Số chỉ tiêu | Nội dung | Dùng để |
|---|---|---|---|---|
| `LUAT-TK.xlsx` | Hệ thống chỉ tiêu thống kê quốc gia | 230 (21 nhóm) | Mã, tên, nhóm; năm trường để trống, ghi chú "Nội dung theo NĐ 94/2022/NĐ-CP" | **Nhập giai đoạn 1b** |
| `LUAT-TK-day-du.xlsx` | như trên | 230 | Đủ năm trường trích từ Phụ lục NĐ 94/2022/NĐ-CP | Dự phòng, nhập khi cần |
| `TT13-BNV.xlsx` | Hệ thống chỉ tiêu thống kê ngành Nội vụ | 76 (8 nhóm) | Mã, tên, nhóm; đủ năm trường cho 0101, 0203, 0205 (có phân tổ đến cấp xã) | **Nhập giai đoạn 1b** |
| `TT13-BNV-day-du.xlsx` | như trên | 76 | Đủ năm trường | Dự phòng |
| `TT45-BKHCN.xlsx` | Hệ thống chỉ tiêu thống kê ngành KH&CN | 137 (9 nhóm) | Mã, tên, nhóm | **Nhập giai đoạn 1b** |
| `TT45-BKHCN-day-du.xlsx` | như trên | 137 | Đủ năm trường | Dự phòng |

**Phụ lục 699 của Thành phố không có trong thư mục này.** Đây là văn bản nội bộ: phụ lục kèm công văn của UBND Thành phố, số và ngày công văn còn để trống. Kho mã đang ở chế độ công khai, vì vậy file nguồn và các file chuyển từ đó chỉ nằm ở thư mục `data/rieng/` trên máy chạy script. Thư mục này đã khai báo trong `.gitignore` nên không được đưa lên kho. Gồm:

- `data/rieng/TU-699-nguon.xlsx`: file Excel gốc;
- `data/rieng/TU-699.xlsx`: mẫu nhập chuẩn, 174 chỉ tiêu (**nhập giai đoạn 1b**);
- `data/rieng/de-xuat-ghep.xlsx`: danh sách đề xuất ghép nội hàm để Mr. Nobody duyệt.

## 2. Cấu trúc một file mẫu chuẩn

- Sheet `Bo`: thông tin bộ, viết ở dòng 3. Dòng 1 là mã cột, dòng 2 là tên cột.
- Sheet `ChiTieu`: dòng 1 là mã cột của bảng `ChiTieu_TrongBo` (**không sửa**), dòng 2 là tên cột. Từ dòng 3 trở đi, mỗi dòng là một chỉ tiêu.
- Sheet `HuongDan`: ghi chú cho người đọc, hệ thống không đọc sheet này.
- Mọi ô đều lưu dạng chữ để giữ số 0 đầu (`0101`) và giữ nguyên văn mục tiêu (`>=1.924.469`).
- Danh sách cột được lấy trực tiếp từ `gas/thuan/SoDo.gs`. Khi sơ đồ thay đổi, chỉ cần chạy lại script là file mẫu khớp theo.

## 3. Quy tắc chuyển đổi

**Văn bản Trung ương** (`scripts/chuyen-doi/van_ban_tw.py`)

- Khóa: `<maBo>:<mã số>`, ví dụ `TT13-BNV:0101`.
- Năm mục nội dung được nhận theo **từ khóa** (Khái niệm / Phân tổ / Kỳ công bố / Nguồn số liệu / Cơ quan hoặc Đơn vị chịu trách nhiệm), không theo số thứ tự mục. Lý do: NĐ 94 có 24 chỉ tiêu không có mục "Phân tổ chủ yếu", nên các mục sau bị lùi số (ví dụ 0506: "2. Kỳ công bố", "3. Nguồn số liệu").
- Mục 5 có dòng "- Chủ trì:" thì tách thành Chủ trì và Phối hợp. Các dòng "+ …" của phần Phối hợp được giữ nguyên, mỗi cơ quan một dòng. Mục 5 không có "Chủ trì:" thì toàn bộ nội dung đưa vào ô Chủ trì.
- Tên chỉ tiêu lấy theo danh mục. Nếu tên ở phần nội dung khác danh mục, tên đó được ghi vào cột Ghi chú của file đầy đủ (LUAT-TK có 8 trường hợp, TT13 có 6, TT45 có 18).

**Phụ lục 699** (`scripts/chuyen-doi/tu699.py`)

- Nhóm La Mã I…VI được ánh xạ sang lĩnh vực lớn: I Thông tin chung · II Kinh tế · III Văn hóa – xã hội · IV Đô thị, môi trường · V Cải cách hành chính · VI Quốc phòng – an ninh.
- Khóa: dòng có STT là `TU-699:<STT>`. Dòng không số là `TU-699:<STT liền trước>.<n>`; `n` đếm chung cho mọi dòng không số đứng sau STT đó, kể cả dòng con và dòng không phải con. Ví dụ ba dòng "Trong đó" sau STT 6 là 6.1, 6.2, 6.3; dòng "Tốc độ tăng chỉ số sản xuất công nghiệp (IIP)" là 6.4.
- Cha con: dòng bắt đầu bằng "Trong đó" là con của dòng có số gần nhất phía trên. Dòng bắt đầu bằng "- " là con của dòng có số gần nhất không bắt đầu bằng "- ".
- Ánh xạ cột:

| Cột | Đưa vào trường |
|---|---|
| (2) | tên chỉ tiêu |
| (3) | đơn vị tính |
| (4), (5) | mục tiêu giai đoạn `2026` và `2026-2030` |
| (6) | cấp dữ liệu |
| (7), (8) | kỳ báo cáo Thành phố, kỳ báo cáo xã |
| (9) | thuộc tính |
| (10) | căn cứ |
| (11) | thời điểm chốt |
| (12) | nguồn số liệu |
| (13) | Chủ trì thu thập, ghi tiền tố "Đối với chỉ tiêu cấp xã:" |
| (14) | Chủ trì thu thập, ghi nguyên văn |
| (15) | cơ quan xác nhận số liệu |
| (16), (19) | Ghi chú |
| (17), (18), NQĐH TQ, NQĐH TP, NQCP, VPTW, Cấp TP, Cấp xã, Năm 2026, Khác, Thêm | Ghi chú, dạng "Thuộc: …" |

- Ô "[bổ sung thông tin]" được để trống.

**Đề xuất ghép** (`scripts/chuyen-doi/de_xuat_ghep.py`): dùng đúng thuật toán so tên của hệ thống (`BoChiTieu.goiYGhep`): bỏ từ dừng, bỏ dấu, tính Jaccard, ngưỡng 0,6, lấy tối đa 3 gợi ý. Test đã đối chiếu Python và hệ thống trên toàn bộ 174 tên và cho kết quả giống hệt. Có 16/174 chỉ tiêu nhận được gợi ý. Các chỉ tiêu còn lại vẫn có một dòng với cột gợi ý để trống, để người duyệt tự điền mã nếu biết. Cột "Đồng ý": ghi `C` là đồng ý, ghi mã khác nếu muốn ghép với chỉ tiêu khác, để trống là không ghép.

## 4. Kết quả đối chiếu tay (19/11/2026)

Claude mở từng file sinh ra, xem 5 dòng đầu và so với văn bản gốc:

- `LUAT-TK`: 0101–0105 khớp mã, tên và STT của Phụ lục Luật Thống kê (VBHN 37/VBHN-VPQH). Ở bản đầy đủ: 0103 tách đúng Chủ trì "Bộ Kế hoạch và Đầu tư (Tổng cục Thống kê)" và Phối hợp gồm 3 dòng "+ Bộ Công an; + Bộ Y tế…; + Bộ Tư pháp…". Kỳ công bố của 0104 là "Năm. / Riêng phân tổ dân tộc công bố theo kỳ 5 năm.", đúng nguyên văn NĐ 94.
- `TT13-BNV`: 0101 có Chủ trì "Vụ Chính quyền địa phương, Bộ Nội vụ.", ô Phối hợp trống, Kỳ công bố "Năm". Các dòng 0102, 0103, 0104, 0201 chỉ có mã, tên, nhóm, đúng quy tắc nạp.
- `TT45-BKHCN` (bản đầy đủ): 0101–0105 có Chủ trì "Cục Thông tin, Thống kê." và Kỳ công bố "Năm.", khớp Phụ lục I mục II.
- `TU-699`: STT 1–3 thuộc nhóm I. STT 4 có mục tiêu `>=10` cho cả hai giai đoạn và ghi chú "Thuộc: NQ 169/NQ-CP; NQ/QĐ Thành phố; NQĐH TQ; NQĐH TP; NQCP; VPTW". STT 5 là con của STT 4. Tổng cộng 174 chỉ tiêu; 58 chỉ tiêu có cấp dữ liệu chứa "Xã"; 12 dòng con; 63 chỉ tiêu có mục tiêu; 29 dòng không số.

**Chỗ thiếu ở chính văn bản gốc**, không phải lỗi chuyển đổi:

- NĐ 94, chỉ tiêu 1505 "Số trường học các cấp": bản Công báo không in mục 1 (Khái niệm, phương pháp tính).
- NĐ 94: 24 chỉ tiêu không có mục "Phân tổ chủ yếu": 0506–0511, 0513, 0514, 0701–0703, 0709–0711, 0716, 0720–0724, 0904, 1005, 1102, 1709.
- TT 45, chỉ tiêu 0204: mục "2. Phân tổ chủ yếu" có tiêu đề nhưng không có nội dung.

## 4b. Tử số, mẫu số (bổ sung 27/11/2026)

Mẫu chuẩn có thêm 4 cột ở cuối sheet `ChiTieu`:

| Cột | Nội dung |
|---|---|
| `loaiGiaTri` | Loại giá trị, lấy mã trong danh mục Loại giá trị: `TY_LE`, `TOC_DO`, `SO_TUYET_DOI`, `XEP_HANG` (danh mục có thể thêm loại) |
| `dinhNghiaTuSo` | Tử số là gì |
| `dinhNghiaMauSo` | Mẫu số là gì |
| `heSoNhan` | Hệ số nhân: 100 cho %, 10.000 cho "trên 10.000 dân", 1 cho bình quân đầu người |

Ghi chú:

- File không có các cột này, hoặc để trống, vẫn nhập được và không sinh dòng "Sửa".
- Chỉ tiêu loại tỷ lệ mà thiếu tử số hoặc mẫu số vẫn nhập được; bước xem trước chỉ hiện cảnh báo "Chưa quy định phương pháp tính".

Riêng TU-699 (các file nằm trong `data/rieng/`):

- `dinh-nghia-tu-mau-TU-699.json`: định nghĩa Claude soạn tay, có thể đổi loại so với quy tắc mặc định.
- `de-xuat-tu-mau-TU-699.xlsx`: file đề xuất đủ 174 dòng, để Mr. Nobody duyệt. Trong 77 chỉ tiêu %, có 50 tỷ lệ và 27 tốc độ hoặc chỉ số. Thêm 9 tỷ số khác: 4 chỉ tiêu trên 10.000 dân và 5 chỉ tiêu bình quân đầu người.
- `tu-mau-TU-699-da-duyet.xlsx`: file Mr. Nobody đã duyệt, gửi lại cho Claude. Khi có file này, `chay_tat_ca.py` sẽ trộn kết quả vào `TU-699.xlsx`.

## 5. Chạy lại

Cần Python 3 có gói `openpyxl` và Node.js (để đọc sơ đồ). Tại thư mục gốc kho mã, chạy:

```bash
python3 -I scripts/chuyen-doi/chay_tat_ca.py
```

Chạy test:

```bash
python3 -I scripts/chuyen-doi/test_chuyen_doi.py
```

Văn bản nguồn Trung ương nằm ở `data/nguon/` (đã đăng Công báo): `TT13-2025-BNV.docx` (chuyển từ .doc), `TT45-2025-BKHCN.docx`, `LUAT-TK-VBHN37.docx` (văn bản hợp nhất Luật Thống kê; file gốc nén theo kiểu lạ nên đã được nén lại cho đúng chuẩn, nội dung giữ nguyên) và `ND94-2022-phan1..4.docx` (Công báo số 845–852). Thiếu `data/rieng/TU-699-nguon.xlsx` thì script bỏ qua phần TU-699, test ghi "BỎ QUA".
