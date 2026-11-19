# HTTD 3.0 — Giai đoạn 1b (Hệ thống và bộ chỉ tiêu đa nguồn) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm mô hình bốn tầng (hệ thống → bộ → nhóm → chỉ tiêu trong bộ, liên kết chỉ tiêu chuẩn), mẫu nhập chuẩn, màn Bộ chỉ tiêu và màn Nhập; nạp bốn bộ (TU-699, TT13-BNV, TT45-BKHCN, LUAT-TK) theo quy tắc ưu tiên đã duyệt.

**Architecture:** Giữ hai lớp như giai đoạn 1. Lớp thuần mới `BoChiTieu.gs` (khóa, kiểm tra lô, cây, gợi ý ghép, kế hoạch nhập) có test Node; lớp kết nối mới `ChiTieuGas.gs` dùng hàm ghi lô mới `KhoDuLieu.ghiLo`. Văn bản nguồn được Claude chuyển một lần sang **mẫu nhập chuẩn** (.xlsx) bằng script Python trong `scripts/chuyen-doi/`; hệ thống chỉ đọc mẫu chuẩn (SheetJS trên trình duyệt).

**Tech Stack:** như giai đoạn 1; thêm SheetJS `xlsx@0.18.5` từ cdnjs (giao diện) và Python 3 + openpyxl 3.1 (chỉ cho script chuyển đổi, không chạy trên hệ thống thật).

**Spec:** `docs/superpowers/specs/2026-11-19-httd3-gd1b-bo-chi-tieu-design.md` (bản 0.2, đã duyệt) trên nền `2026-11-14-httd3-design.md` (bản 0.3).

## Global Constraints

- Mọi ràng buộc chung của kế hoạch giai đoạn 1 (`2026-11-15-httd3-giai-doan-1-nen-tang.md`, mục Global Constraints) giữ nguyên.
- Khóa chỉ tiêu trong bộ: `maTrongBo = <maBo>:<maGoc>`; văn bản không có mã thì `<maBo>:<STT>`; dòng con không có STT thì `<maBo>:<STT cha>.<n>` (n đếm từ 1 trong cha); dòng không số không phải con thì `<maBo>:<STT liền trước>.<n>`.
- Mã gốc luôn là chuỗi, giữ số 0 đầu (`0101`).
- Năm trường nội dung: `khaiNiemPhuongPhapTinh`, `phanToChuYeu`, `kyCongBo`, `nguonSoLieu`, `coQuanChuTriThuThap`, `coQuanPhoiHopThuThap`; lưu nguyên văn, giữ xuống dòng.
- `thuocTinhTongHop` ∈ `Tỷ lệ` · `Lũy kế từ đầu năm` · `Thời điểm` · `Phát sinh trong kỳ`; `capDuLieu` ∈ `Trung ương` · `Thành phố` · `Xã` · `Thành phố/Xã`; `loaiHeThong` ∈ `Quốc gia` · `Bộ, ngành` · `Địa phương` · `Theo dõi, đánh giá`; `linhVucLon` ∈ `Kinh tế` · `Văn hóa – xã hội` · `Đô thị, môi trường` · `Cải cách hành chính` · `Quốc phòng – an ninh` · `Xây dựng Đảng` · `Hệ thống chính trị` · `Thông tin chung` · `Khác`.
- Nhập lại cùng bộ: cập nhật theo `maTrongBo`; dòng không còn trong file → `tinhTrangHieuLuc = 'Hết hiệu lực'`, không xóa; dòng không đổi → không ghi, không nhật ký.
- Quy tắc nạp (thiết kế 1b mục 6): TU-699 đầy đủ; TT13-BNV danh mục + năm trường cho 0101, 0203, 0205; TT45-BKHCN danh mục; LUAT-TK danh mục, ghi chú `nội dung theo NĐ 94/2022/NĐ-CP`.
- Ghép nội hàm chỉ theo danh sách Mr. Nobody đã duyệt; không tự ghép ngầm.

## Review Focus

1. **Ô Excel số/mã bị đổi kiểu khi đọc**: `0101` thành 101, `>=985.800` hoặc `1.924.469` (dấu chấm hàng nghìn) thành số thực. Đọc ở chế độ chữ thô và giữ nguyên văn mục tiêu. Test ở Task 2 (`BoChiTieu.chuanHoaDong`) và Task 5 (SheetJS với `raw:false`).
2. **Dòng con và dòng không số ở Phụ lục 699** ("Trong đó...", "- Nông nghiệp..."): khóa và cha phải ổn định, nhập lại không đổi khóa. Test ở Task 3 (script chuyển đổi, đối chiếu khóa hai lần chạy) và Task 2 (`kiemTraLo` báo cha không tồn tại).
3. **Nhập lại file giống hệt** không sinh thay đổi hay nhật ký; file bỏ một dòng → dòng đó "Hết hiệu lực". Test ở Task 2 (`keHoachNhap`) và Task 4 (lớp kết nối với dịch vụ giả).
4. **Lô lớn** (230 dòng, nội dung dài): một khóa, số lần `setValues` không tỉ lệ với số dòng, thân yêu cầu dưới 1 MB. Test ở Task 4.
5. **Nội dung nhiều dòng** ("- Chủ trì: ...", "+ Bộ Công an;") tách đúng Chủ trì/Phối hợp, hiển thị giữ xuống dòng. Test ở Task 3 (script) và Task 6 (giao diện `white-space: pre-line`).

---

### Task 1: Sơ đồ dữ liệu bốn tầng

**Files:** Modify `gas/thuan/SoDo.gs`, `gas/thuan/DuLieuGieo.gs`, `gas/ketnoi/ThietLap.gs`; Test `gas/test/SoDo.test.js`, `gas/test/DuLieuGieo.test.js`, `gas/test/KetNoi.test.js`

**Interfaces:**
- Produces: bảng `DM_BoChiTieu` (danhmuc, `TU_NHAP`, tiền tố `BO`), `ChiTieu_TrongBo` (nghiepvu, file DuLieu, `TU_NHAP`, tiền tố `TB`) với đúng cột thiết kế 1b mục 3.1, 3.2; cột mới của `DM_ChiTieu` (mục 3.3, thêm ngay **trước** cột hệ thống); `ChiTieu_NguonQuyDinh` bị bỏ khỏi sơ đồ. `DuLieuGieo.BANG.DM_BoChiTieu` 5 dòng: `LUAT-TK`, `TT13-BNV`, `TT45-BKHCN`, `TU-699`, `CDS-HN` (CDS-HN ghi chú "chuyển từ HTTD 2.0 ở giai đoạn 5").
- `ThietLap._taoSheet`: nếu sheet đã có dòng dữ liệu (dòng 3 trở đi) và tiêu đề hiện có **khác** sơ đồ → không ghi đè tiêu đề, `console.log` cảnh báo và trả `{canhBao}`; nếu sheet `ChiTieu_NguonQuyDinh` tồn tại và trống → xóa.

- [ ] **Bước 1: Test thất bại** — trong `SoDo.test.js`: `ChiTieu_TrongBo` có đủ 6 cột năm trường và `maTrongBo` là khóa chính; `DM_BoChiTieu.loaiHeThong` có đúng 4 tùy chọn; `SoDo.BANG.ChiTieu_NguonQuyDinh === undefined`; `ChiTieu_TrongBo.maBo.thamChieu === 'DM_BoChiTieu'`, `maChiTieu.thamChieu === 'DM_ChiTieu'`, `chaTrongBo.thamChieu === 'ChiTieu_TrongBo'`. Trong `DuLieuGieo.test.js`: 5 bộ hợp lệ. Trong `KetNoi.test.js`: (a) thiết lập lại trên hệ thống đã có sheet `ChiTieu_NguonQuyDinh` trống → sheet bị xóa, có `ChiTieu_TrongBo`; (b) sheet `DM_DonVi` có dữ liệu và tiêu đề đã bị sửa tay → tiêu đề không bị ghi đè, có cảnh báo.
- [ ] **Bước 2:** `npm test` → các test mới FAIL.
- [ ] **Bước 3:** Sửa ba file theo Interfaces.
- [ ] **Bước 4:** `npm run test:all` → PASS toàn bộ (kể cả test giao diện cũ).
- [ ] **Bước 5:** Commit `feat: sơ đồ bốn tầng bộ chỉ tiêu (DM_BoChiTieu, ChiTieu_TrongBo)`.

### Task 2: Lớp thuần `BoChiTieu`

**Files:** Create `gas/thuan/BoChiTieu.gs`, `gas/test/BoChiTieu.test.js`

**Interfaces (Produces):**
- `BoChiTieu.khoa(maBo, maGoc) → string` (`'TT13-BNV:0101'`).
- `BoChiTieu.chuanHoaDong(dong) → dong` : ép `maGoc`, `sttTrongBo`, mọi cột chữ thành chuỗi đã `trim`; `mucTieu` chấp nhận chuỗi JSON hoặc mảng; số trong `mucTieu[].so` đọc kiểu Việt Nam (`1.924.469` → 1924469, `0,8` → 0.8) nhưng `nguyenVan` giữ nguyên.
- `BoChiTieu.kiemTraLo(maBo, dongs) → {hopLe, loi:[{dong, khoa, thongBao}]}` : thiếu `tenNguyenVan`; `maTrongBo` trùng trong lô; `maTrongBo` không bắt đầu bằng `maBo + ':'`; `chaTrongBo` không có trong lô (và không có trong `daCo` nếu truyền); giá trị ngoài tùy chọn của sơ đồ.
- `BoChiTieu.dungCay(dongs) → [{dong, con:[...]}]` theo `nhomMa` rồi `chaTrongBo`, giữ thứ tự `sttTrongBo` của văn bản.
- `BoChiTieu.chuanHoaTen(ten) → string` (bỏ dấu, chữ thường, bỏ từ dừng `tỷ lệ, số, tổng, số lượng, tốc độ, tăng, trong đó` và dấu câu) và `BoChiTieu.goiYGhep(ten, dsChuan, nguong = 0.6) → [{maChiTieu, diem}]` (Jaccard trên tập từ đã chuẩn hóa, tối đa 3, giảm dần).
- `BoChiTieu.keHoachNhap(daCo, moi) → {them:[], sua:[{ma, thayDoi}], hetHieuLuc:[ma], giuNguyen: n}`; so sánh chỉ các cột không phải hệ thống; dòng `daCo` đã "Hết hiệu lực" mà xuất hiện lại → `sua` với `tinhTrangHieuLuc: 'Còn hiệu lực'`.
- `BoChiTieu.mucLienQuanTuCap(capDuLieu) → 'A' | 'C'` (`Xã`, `Thành phố/Xã` → A; còn lại → C).

- [ ] **Bước 1: Test thất bại** — tối thiểu: `khoa('TT13-BNV','0101')`; `chuanHoaDong({maGoc:101})` không được dùng để đoán số 0 (giữ `'101'`), còn `{maGoc:'0101'}` giữ `'0101'`; `mucTieu` `'>=1.924.469'` → `so 1924469`, `'>0,8'` → `0.8`, `nguyenVan` giữ; `kiemTraLo` báo đủ 4 loại lỗi trên một lô 5 dòng có chủ ý; `dungCay` đặt `TU-699:6.1` dưới `TU-699:6`; `goiYGhep('Tỷ trọng kinh tế số', [{maChiTieu:'KTS-01', tenChiTieu:'Tỷ trọng kinh tế số trong GRDP'}])[0].maChiTieu === 'KTS-01'` và tên không liên quan trả `[]`; `keHoachNhap`: giống hệt → `{them:[],sua:[],hetHieuLuc:[],giuNguyen:3}`, bỏ một dòng → `hetHieuLuc:[ma]`, sửa một ô → một `sua` chỉ có ô đó, dòng hết hiệu lực xuất hiện lại → `sua` khôi phục.
- [ ] **Bước 2–4:** FAIL → viết → `npm test` PASS.
- [ ] **Bước 5:** Commit `feat: BoChiTieu thuần — khóa, kiểm tra lô, cây, gợi ý ghép, kế hoạch nhập`.

### Task 3: Script chuyển đổi và bốn file mẫu chuẩn

**Files:** Create `scripts/chuyen-doi/mau_chuan.py` (ghi .xlsx mẫu chuẩn: sheet `Bo` 1 dòng, sheet `ChiTieu` dòng 1 khóa cột đúng `ChiTieu_TrongBo`, dòng 2 tên hiển thị), `scripts/chuyen-doi/tu699.py`, `scripts/chuyen-doi/van_ban_tw.py` (đọc .docx: danh mục + mục "II. NỘI DUNG"/"PHỤ LỤC 2"/NĐ 94; tách năm mục), `scripts/chuyen-doi/de_xuat_ghep.py`, `scripts/chuyen-doi/test_chuyen_doi.py`; Output `data/bo-chi-tieu/TU-699.xlsx`, `TT13-BNV.xlsx`, `TT45-BKHCN.xlsx`, `LUAT-TK.xlsx`, `*-day-du.xlsx` (đủ năm trường cho mọi chỉ tiêu TT13, TT45, LUAT-TK theo NĐ 94), `de-xuat-ghep.xlsx`; `data/bo-chi-tieu/README.md` (nguồn, ngày, cách chạy lại). Văn bản gốc đặt ở `data/nguon/` (đã công khai trên Công báo).

**Interfaces:** Script chạy `python3 -I scripts/chuyen-doi/<tên>.py <file nguồn> <file đích>`; không chạy trên hệ thống thật.

Quy tắc chuyển đổi bắt buộc:
- TU-699: nhóm theo dòng La Mã (I…VI) → `nhomMa` `I`…`VI`, `linhVucLon` theo tên nhóm; cột (2)…(19) → cột mẫu chuẩn: tên, đơn vị, KH 2026 và KH 2026–2030 → `mucTieu` (`giaiDoan` `2026` và `2026-2030`), cấp dữ liệu, kỳ TP, kỳ xã, thuộc tính, căn cứ, thời điểm chốt, nguồn → `nguonSoLieu`, cơ quan theo dõi (cột 13 xã, 14 TP) → `coQuanChuTriThuThap`, cột 15 → `coQuanXacNhanSoLieu`; ô `[bổ sung thông tin]` → rỗng; cột đánh dấu NQĐH TQ/TP, NQCP, VPTW, Năm 2026 → `ghiChu` dạng `Thuộc: NQĐH TP; NQCP`. Cha con: tên bắt đầu `Trong đó` → con của dòng **có số** gần nhất phía trên; tên bắt đầu `- ` → con của dòng không bắt đầu `- ` gần nhất có số.
- Văn bản TW: mục 5 có `- Chủ trì:` → tách Chủ trì và Phối hợp (gộp các dòng `+` của Phối hợp, giữ xuống dòng); không có → toàn bộ vào Chủ trì.
- Áp quy tắc nạp ở Global Constraints cho file không có hậu tố `-day-du`.
- `de_xuat_ghep.py`: dùng cùng thuật toán `chuanHoaTen` + Jaccard (viết lại bằng Python, test so khớp với 5 cặp mẫu tính bằng `BoChiTieu.goiYGhep`), so TU-699 với LUAT-TK, TT13, TT45; xuất bảng `maTrongBo | tên | gợi ý | điểm | Đồng ý (để trống)` cho Mr. Nobody duyệt.

- [ ] **Bước 1: Test thất bại** `test_chuyen_doi.py` (assert thuần, chạy `python3 -I`): TU-699 ra 174 dòng chỉ tiêu (không kể dòng nhóm), số dòng `capDuLieu` chứa `Xã` = số đếm trực tiếp từ file nguồn, `TU-699:4` có `mucTieu` `[{giaiDoan:'2026',nguyenVan:'>=10',...},{giaiDoan:'2026-2030',...}]`, dòng "Trong đó: công nghiệp" có `chaTrongBo` là khóa của STT 6; chạy chuyển đổi hai lần ra khóa giống hệt; TT13 76 dòng, 3 dòng có năm trường; `TT13-BNV:0101` có `coQuanChuTriThuThap` = "Vụ Chính quyền địa phương, Bộ Nội vụ." và `coQuanPhoiHopThuThap` rỗng; TT45 137; LUAT-TK 230 dòng, 21 nhóm, năm trường rỗng; `LUAT-TK-day-du` `0103` có Phối hợp chứa "Bộ Công an" và "Bộ Tư pháp" trên hai dòng.
- [ ] **Bước 2–4:** FAIL → viết script, sinh file → PASS.
- [ ] **Bước 5:** Mở từng file sinh ra bằng openpyxl in 5 dòng đầu, đối chiếu tay với văn bản; ghi kết quả vào `data/bo-chi-tieu/README.md`.
- [ ] **Bước 6:** Commit `feat: script chuyển đổi và mẫu nhập chuẩn bốn bộ chỉ tiêu`.

### Task 4: Ghi lô và API chỉ tiêu (lớp kết nối)

**Files:** Modify `gas/ketnoi/KhoDuLieu.gs`, `gas/thuan/PhanQuyen.gs`, `gas/Main.gs`, `.clasp.json` (`filePushOrder` thêm `ketnoi/ChiTieuGas.gs` sau `DanhMucGas`); Create `gas/ketnoi/ChiTieuGas.gs`; Test `gas/test/KetNoi.test.js`, `gas/test/DieuPhoi.test.js`

**Interfaces:**
- `KhoDuLieu.ghiLo(tenBang, {them:[banGhi], sua:[{ma, thayDoi}]}, phien, canCu) → {soThem, soSua}`: một khóa; kiểm tra mọi dòng trước khi ghi (lỗi → không ghi gì); thêm bằng **một** `setValues` khối; sửa từng dòng theo `__dong`; nhật ký: một dòng mỗi bản ghi, ghi bằng một `setValues` khối vào `NhatKy`.
- Action mới trong `PhanQuyen.BANG`: `chiTieu.doc: ['@']`, `chiTieu.chiTiet: ['@']`, `chiTieu.nhap: ['QUANTRI']`, `chiTieu.ghep: ['QUANTRI']`.
- `ChiTieuGas.HANDLERS`:
  - `chiTieu.doc({maBo?})` → `{bo:[DM_BoChiTieu kèm soChiTieu, soCapXa]}` khi không có `maBo`; có `maBo` → `{bo, dong:[ChiTieu_TrongBo của bộ, không kèm năm trường để nhẹ]}`.
  - `chiTieu.chiTiet({maTrongBo})` → `{dong (đủ năm trường), chuan: DM_ChiTieu|null, cungNoiHam:[{maTrongBo, maBo, tenNguyenVan}]}`.
  - `chiTieu.nhap({bo, dong, cheDo:'xemTruoc'|'ghi', canCu})` → xem trước: `{kiemTra, keHoach:{soThem, soSua, soHetHieuLuc, giuNguyen}, goiYGhep:{[maTrongBo]: [...]}}` (gợi ý chỉ cho dòng chưa có `maChiTieu`); ghi: upsert `DM_BoChiTieu` từ `bo`, `ghiLo` theo `BoChiTieu.keHoachNhap`, cập nhật `soChiTieu`.
  - `chiTieu.ghep({maTrongBo, maChiTieu | taoMoi:{maChiTieu, tenChiTieu}})` → gắn liên kết; `taoMoi` tạo `DM_ChiTieu` với năm trường sao từ dòng, `mucLienQuanCapXa` từ `BoChiTieu.mucLienQuanTuCap`.
- Thân yêu cầu `chiTieu.nhap` > 900 000 ký tự → `DU_LIEU_KHONG_HOP_LE` "File quá lớn, hãy chia nhóm".

- [ ] **Bước 1: Test thất bại** (`KetNoi.test.js`, dịch vụ giả): nhập 230 dòng mẫu → `__gia.lockCount` tăng đúng 1, số lần `setValues` vào `ChiTieu_TrongBo` ≤ 3; nhập lại giống hệt → `soThem 0, soSua 0`, nhật ký không thêm dòng; bỏ một dòng → dòng đó `Hết hiệu lực`; lô có lỗi → không dòng nào được ghi; `chiTieu.chiTiet('TT13-BNV:0101')` trả năm trường giữ xuống dòng; `chiTieu.ghep` tạo chuẩn mới và `cungNoiHam` hiện dòng ở bộ khác; DONVI gọi `chiTieu.nhap` → `KHONG_CO_QUYEN`. `DieuPhoi.test.js`: bốn action mới có trong bảng quyền đúng vai trò.
- [ ] **Bước 2–4:** FAIL → viết → `npm test` PASS.
- [ ] **Bước 5:** Commit `feat: ghi lô và API bộ chỉ tiêu`.

### Task 5: Màn Nhập bộ chỉ tiêu

**Files:** Create `web/js/nhap-chi-tieu.js`, `web/test/nhap-chi-tieu.test.mjs`, `web/test/mau/` (bản thu nhỏ 10 dòng của `TU-699.xlsx` và một bản sửa một dòng, sinh từ Task 3); Modify `web/index.html` (SheetJS `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js`, chỉ tải khi mở màn Nhập), `web/js/app.js` (tuyến `#/chi-tieu/nhap`, QUANTRI), `web/test/may-chu-gia.mjs` (handlers `chiTieu.*` dùng `BoChiTieu` thật), `web/test/_trinhDuyet.mjs` (cho phép cdnjs khi có bản tải về cục bộ: phục vụ `web/test/vendor/xlsx.full.min.js` thay cdnjs bằng `page.route`).

**Interfaces:** `HTTD3.nhapChiTieu.ve(goc, trangThai)`; đọc file bằng `XLSX.read(buf, {type:'array'})`, `sheet_to_json(ws, {header:1, raw:false, defval:''})`; dòng 1 là khóa, bỏ dòng 2.

- [ ] **Bước 1: Test thất bại**: chọn file 10 dòng → bảng xem trước 10 dòng, "Thêm 10", không lỗi; `maGoc` hiện `0101` không mất số 0; bấm Ghi → thông báo "Đã nhập 10"; chọn bản sửa một dòng → xem trước "Sửa 1, giữ nguyên 9"; file có dòng thiếu tên → lỗi hiện đúng số dòng Excel, nút Ghi bị khóa; DONVI không thấy tuyến.
- [ ] **Bước 2–4:** FAIL → viết → `npm run test:web` PASS.
- [ ] **Bước 5:** Commit `feat: màn nhập bộ chỉ tiêu từ mẫu chuẩn`.

### Task 6: Màn Bộ chỉ tiêu

**Files:** Create `web/js/chi-tieu.js`, `web/test/chi-tieu.test.mjs`; Modify `web/js/app.js` (tuyến `#/chi-tieu`, mọi vai trò, menu "Chỉ tiêu" 📊 đặt sau "Hôm nay"), `web/css/app.css` (cây, `.noi-dung-chi-tieu { white-space: pre-line }`).

**Interfaces:** `HTTD3.chiTieu.ve(goc, trangThai)`; trái: danh sách bộ nhóm theo `loaiHeThong` kèm `soChiTieu`; phải: cây nhóm → chỉ tiêu → con (thu gọn/mở), cột mã gốc, tên, đơn vị, kỳ, nhãn "Cấp xã"; bộ lọc chip "Chỉ cấp xã", ô chọn lĩnh vực lớn, ô tìm; bấm dòng → tấm trượt: năm mục đánh số đúng tiêu đề thiết kế, "Chưa có nội dung — theo NĐ 94/2022/NĐ-CP" khi trống, mục tiêu theo giai đoạn, căn cứ, "Cùng nội hàm ở các bộ khác", QUANTRI có nút "Ghép nội hàm".

- [ ] **Bước 1: Test thất bại** (máy chủ giả nạp sẵn bốn file mẫu chuẩn thật từ `data/bo-chi-tieu/` qua `chiTieu.nhap`): bốn bộ hiện số 174/76/137/230; bộ TU-699 bật "Chỉ cấp xã" ra đúng số đếm ở Task 3; dòng con hiện thụt dưới cha; mở `TT13-BNV:0101` thấy năm mục với Chủ trì "Vụ Chính quyền địa phương, Bộ Nội vụ."; mở `LUAT-TK:0101` thấy dòng "Chưa có nội dung"; 360 px không cuộn ngang trang.
- [ ] **Bước 2–4:** FAIL → viết → `npm run test:all` PASS; chụp ảnh `docs/anh-giao-dien/10-…`, `11-…` (điện thoại và máy tính) và xem bằng mắt.
- [ ] **Bước 5:** Commit `feat: màn Bộ chỉ tiêu dạng cây với năm trường nội dung`.

### Task 7: Tài liệu, nạp dữ liệu thật, nghiệm thu

**Files:** Create `docs/van-hanh/05-nhap-bo-chi-tieu.md`, `docs/van-hanh/06-nghiem-thu-giai-doan-1b.md`; Modify `docs/van-hanh/02-trien-khai-apps-script.md` (mục "Cập nhật lên giai đoạn mới": tải ZIP, `clasp push`, chạy lại `chayThietLapLanDau`, triển khai phiên bản mới).

- [ ] **Bước 1:** Viết tài liệu 05 (thứ tự nhập: duyệt `de-xuat-ghep.xlsx` → Claude điền `maChiTieu` vào bốn file → nhập TU-699, TT13-BNV, TT45-BKHCN, LUAT-TK) và bảng kiểm 06 đúng năm mục nghiệm thu thiết kế 1b mục 8.
- [ ] **Bước 2:** `npm run test:all` PASS; commit `docs: tài liệu nhập và nghiệm thu giai đoạn 1b`.
- [ ] **Bước 3 (Mr. Nobody, Claude hướng dẫn):** duyệt danh sách ghép; cập nhật Apps Script; nạp bốn file; điền bảng kiểm 06.

## Tự rà soát (đã làm khi viết)

- **Phủ thiết kế 1b:** mục 2 (Task 1, 2), 3.1–3.3 (Task 1), 4 nhập (Task 2, 4, 5), 4 ghép (Task 2, 3, 4, 6), 5 giao diện (Task 5, 6), 6 dữ liệu và quy tắc nạp (Task 3, 7), 8 nghiệm thu (Task 6 test + Task 7). Mục 7 (không làm) giữ ngoài phạm vi.
- **Nhất quán tên:** `maTrongBo`, `maBo`, `maGoc`, `chaTrongBo`, sáu cột năm trường, `BoChiTieu.khoa/chuanHoaDong/kiemTraLo/dungCay/chuanHoaTen/goiYGhep/keHoachNhap/mucLienQuanTuCap`, `KhoDuLieu.ghiLo`, action `chiTieu.doc/chiTiet/nhap/ghep` dùng thống nhất ở Task 2, 4, 5, 6.
- **Review Focus:** 1 → Task 2, 5; 2 → Task 2, 3; 3 → Task 2, 4; 4 → Task 4; 5 → Task 3, 6.
- **Tỷ lệ:** kế hoạch ngắn hơn hai bản thiết kế cộng lại; thân hàm để người thực hiện viết.
