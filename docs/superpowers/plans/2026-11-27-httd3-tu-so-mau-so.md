# Bổ sung Tử số, Mẫu số cho chỉ tiêu tỷ lệ — Kế hoạch thực hiện

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mỗi chỉ tiêu (trong bộ và chỉ tiêu chuẩn) mang loại giá trị, định nghĩa tử số, mẫu số, hệ số nhân; loại giá trị là danh mục mở rộng được; 174 chỉ tiêu TU-699 được Claude đề xuất để Mr. Nobody duyệt rồi nạp.

**Architecture:** Giữ hai lớp như giai đoạn 1b. Sơ đồ (`SoDo.gs`) thêm danh mục `DM_LoaiGiaTri` và bốn cột; lớp thuần `BoChiTieu` kiểm tra/cảnh báo theo **cờ `coTuSoMauSo` của loại**, không theo mã cứng; `ChiTieuGas` truyền danh mục loại vào kiểm tra, trả cảnh báo, sao bốn cột khi ghép; giao diện thêm mục "Cách tính" và danh sách cảnh báo khi nhập; script Python đề xuất và trộn kết quả duyệt vào `TU-699.xlsx`. Chèn cột trên hệ thống thật dùng cơ chế chuyển đổi tiêu đề đã có ở `ThietLap._taoSheet`.

**Tech Stack:** Google Apps Script V8 (lớp thuần test bằng `node --test`), JS thuần + Playwright cho giao diện, Python 3 + openpyxl cho script chuyển đổi.

**Spec:** `docs/superpowers/specs/2026-11-24-httd3-tu-so-mau-so-design.md` (0.2, đã duyệt 27/11/2026). Nền: `docs/superpowers/specs/2026-11-19-httd3-gd1b-bo-chi-tieu-design.md`.

## Global Constraints

- Mọi ràng buộc chung của kế hoạch 1b (`docs/superpowers/plans/2026-11-19-httd3-giai-doan-1b-bo-chi-tieu.md`) giữ nguyên.
- `DM_LoaiGiaTri` (file `HTTD3_DanhMuc`, nhóm `danhmuc`, tiền tố `LGT`, `TU_NHAP`), cột đúng thứ tự: `maLoaiGiaTri` (khóa) · `tenLoaiGiaTri` (bắt buộc) · `coTuSoMauSo` (boolean) · `heSoNhanMacDinh` (number) · `ghiChu` (textarea).
- Gieo đúng 4 dòng: `TY_LE` "Tỷ lệ (tử số/mẫu số)" có tử/mẫu, hệ số 100 · `TOC_DO` "Tốc độ, chỉ số nhận từ cơ quan khác" không · `SO_TUYET_DOI` "Số tuyệt đối" không · `XEP_HANG` "Xếp hạng, điểm số" không (hệ số để trống cho ba loại sau).
- Bốn cột mới, cùng khóa và thứ tự ở **cả** `ChiTieu_TrongBo` và `DM_ChiTieu`, đặt ngay trước cột hệ thống (sau cột cuối hiện có): `loaiGiaTri` (ref `DM_LoaiGiaTri`) · `dinhNghiaTuSo` (textarea) · `dinhNghiaMauSo` (textarea) · `heSoNhan` (number). Tên hiển thị: "Loại giá trị", "Tử số là gì", "Mẫu số là gì", "Hệ số nhân".
- Thiếu định nghĩa tử số hoặc mẫu số với loại có `coTuSoMauSo = true`: **cảnh báo, không chặn nhập**. Chữ hiển thị đúng: `Chưa quy định phương pháp tính`.
- Hệ số: 100 cho %, 10000 cho "/10.000 dân", 1 cho bình quân đầu người; để trống thì dùng `heSoNhanMacDinh` của loại khi hiển thị/tính.
- Công thức hiển thị: `Giá trị = Tử số ÷ Mẫu số × <hệ số>`, thêm ` (%)` khi hệ số là 100.
- Dữ liệu TU-699 (đề xuất, file duyệt, file nạp) chỉ ở `data/rieng/` (không đưa lên kho công khai).

## Review Focus

1. **File mẫu chưa có bốn cột mới** (TT13, TT45, LUAT-TK, TU-699 trước khi duyệt) nhập lại phải "Giữ nguyên", không lỗi, không Sửa → test ở Task 3.
2. **Hệ số dạng chữ kiểu Việt Nam** từ Excel/SheetJS (`"10.000"`, `"100"`, `"1"`) phải thành số 10000/100/1, không thành 10; chữ không phải số là lỗi dòng → test ở Task 2.
3. **Sheet thật đã có dữ liệu 1b** (`ChiTieu_TrongBo`, `DM_ChiTieu`) → chạy lại thiết lập chèn bốn cột, dữ liệu giữ nguyên, `DM_LoaiGiaTri` được gieo → test ở Task 1.
4. **Loại giá trị do người dùng thêm sau** (mã lạ, `coTuSoMauSo = true`) → cảnh báo áp theo cờ; mã không có trong danh mục là lỗi → test ở Task 2.
5. **Chỉ tiêu % là tốc độ tăng** ("Tốc độ tăng trưởng GRDP", "Tăng trưởng…") không bị đề xuất là `TY_LE` → test ở Task 5.

---

### Task 1: Sơ đồ, gieo danh mục, chuyển đổi sheet có sẵn

**Files:** Modify `gas/thuan/SoDo.gs`, `gas/thuan/DuLieuGieo.gs`; Test `gas/test/SoDo.test.js`, `gas/test/DuLieuGieo.test.js`, `gas/test/KetNoi.test.js`

**Interfaces:** Produces `SoDo.BANG.DM_LoaiGiaTri`, bốn cột mới ở `ChiTieu_TrongBo` và `DM_ChiTieu` (khóa như Global Constraints), `DuLieuGieo.BANG.DM_LoaiGiaTri` (4 dòng, gieo trước `DM_ChiTieu` trong thứ tự `BANG`).

- [ ] **Bước 1: Test thất bại.** `SoDo.test.js`: `DM_LoaiGiaTri` có đúng 5 cột theo thứ tự; `ChiTieu_TrongBo` và `DM_ChiTieu` đều có `loaiGiaTri.thamChieu === 'DM_LoaiGiaTri'`, `heSoNhan.kieu === 'number'`, và bốn cột mới là bốn cột cuối trước cột hệ thống. `DuLieuGieo.test.js`: 4 dòng hợp lệ theo `Bang.kiemTra`, `TY_LE.coTuSoMauSo === true && heSoNhanMacDinh === 100`. `KetNoi.test.js` test "tử/mẫu: thiết lập lại chèn 4 cột vào ChiTieu_TrongBo và DM_ChiTieu đã có dữ liệu kiểu 1b, gieo DM_LoaiGiaTri": dựng sheet hai bảng theo sơ đồ bỏ bốn cột mới, mỗi bảng một dòng dữ liệu; chạy `thietLapLanDau`; tiêu đề khớp sơ đồ, dòng cũ đọc lại đúng (`tenNguyenVan`, `tinhTrangHieuLuc`, `taoLuc`), `docBang('DM_LoaiGiaTri').length === 4`, `kiemTraThietLap({tieuDe:true}).thieu.length === 0`.
- [ ] **Bước 2:** `npm test` → các test mới FAIL.
- [ ] **Bước 3:** Thêm bảng, cột, dữ liệu gieo.
- [ ] **Bước 4:** `npm test` → PASS toàn bộ.
- [ ] **Bước 5:** Commit `feat: danh mục loại giá trị và bốn cột tử số/mẫu số`.

### Task 2: Lớp thuần — chuẩn hóa hệ số, kiểm tra và cảnh báo theo loại

**Files:** Modify `gas/thuan/BoChiTieu.gs`; Test `gas/test/BoChiTieu.test.js`

**Interfaces:**
- Consumes: cột của Task 1.
- Produces: `BoChiTieu.chuanHoaDong` đổi `heSoNhan` chữ → số theo quy tắc số Việt Nam đang có (`_soVN`), rỗng → `''`, không đọc được → giữ chuỗi; `BoChiTieu.kiemTraLo(maBo, dongs, tuyChon)` nhận thêm `tuyChon.loaiGiaTri = [{maLoaiGiaTri, coTuSoMauSo}]` và trả `{hopLe, loi, canhBao}`; `canhBao` là `[{dong, khoa, thongBao}]`.

- [ ] **Bước 1: Test thất bại** `BoChiTieu.test.js` test "tử/mẫu: hệ số, loại lạ, cảnh báo thiếu định nghĩa":
```js
const LGT = [{ maLoaiGiaTri: 'TY_LE', coTuSoMauSo: true }, { maLoaiGiaTri: 'SO_TUYET_DOI', coTuSoMauSo: false }, { maLoaiGiaTri: 'MOI', coTuSoMauSo: true }];
assert.equal(BoChiTieu.chuanHoaDong({ heSoNhan: '10.000' }).heSoNhan, 10000);
assert.equal(BoChiTieu.chuanHoaDong({ heSoNhan: '100' }).heSoNhan, 100);
assert.equal(BoChiTieu.chuanHoaDong({ heSoNhan: '' }).heSoNhan, '');
const kt = BoChiTieu.kiemTraLo('TU-699', [
  d({ maTrongBo: 'TU-699:1', loaiGiaTri: 'TY_LE', dinhNghiaTuSo: 'A', dinhNghiaMauSo: 'B', heSoNhan: '100' }),
  d({ maTrongBo: 'TU-699:2', loaiGiaTri: 'TY_LE', dinhNghiaTuSo: '' }),        // cảnh báo, không lỗi
  d({ maTrongBo: 'TU-699:3', loaiGiaTri: 'KHONG_CO' }),                          // lỗi
  d({ maTrongBo: 'TU-699:4', loaiGiaTri: 'SO_TUYET_DOI', heSoNhan: 'mười' }),   // lỗi
  d({ maTrongBo: 'TU-699:5', loaiGiaTri: 'MOI' }),                               // loại thêm sau, có tử/mẫu → cảnh báo
  d({ maTrongBo: 'TU-699:6', heSoNhan: '-5' })                                   // lỗi: không dương
].map(BoChiTieu.chuanHoaDong), { loaiGiaTri: LGT });
assert.deepEqual(kt.loi.map((l) => l.dong + ':' + l.khoa).sort(), ['3:loaiGiaTri', '4:heSoNhan', '6:heSoNhan']);
assert.deepEqual(kt.canhBao.map((l) => l.dong + ':' + l.khoa), ['2:dinhNghiaTuSo', '5:dinhNghiaTuSo']);
assert.match(kt.canhBao[0].thongBao, /Chưa quy định phương pháp tính/);
assert.equal(BoChiTieu.kiemTraLo('TU-699', [d({ maTrongBo: 'TU-699:9', loaiGiaTri: 'X' })]).hopLe, true, 'không truyền danh mục thì không kiểm mã loại');
```
(`d` như các test hiện có: `maBo: 'TU-699', tenNguyenVan: 'Tên'`.) Thêm test "tử/mẫu: dòng thiếu bốn cột mới không sinh Sửa so với dòng đã lưu có bốn cột rỗng" bằng `keHoachNhap` (đã lưu: `loaiGiaTri: '', heSoNhan: ''`; mới: không có các khóa) → `giuNguyen === 1`.
- [ ] **Bước 2:** `npm test` → FAIL.
- [ ] **Bước 3:** Sửa `chuanHoaDong` (cột `number` của `ChiTieu_TrongBo`), `kiemTraLo` (lỗi: mã loại không có trong `tuyChon.loaiGiaTri` khi được truyền; `heSoNhan` không phải số hoặc ≤ 0; cảnh báo: loại có `coTuSoMauSo` mà thiếu `dinhNghiaTuSo` hoặc `dinhNghiaMauSo`, mỗi thiếu một cảnh báo; luôn trả `canhBao` (mảng rỗng khi không có)).
- [ ] **Bước 4:** `npm test` → PASS.
- [ ] **Bước 5:** Commit `feat: kiểm tra loại giá trị và cảnh báo thiếu định nghĩa tử/mẫu`.

### Task 3: API — truyền danh mục loại, trả cảnh báo, sao bốn cột khi ghép

**Files:** Modify `gas/ketnoi/ChiTieuGas.gs`, `web/test/may-chu-gia.mjs`; Test `gas/test/KetNoi.test.js`

**Interfaces:**
- Consumes: Task 1, Task 2.
- Produces: `chiTieu.nhap` xem trước trả `kiemTra.canhBao` (dòng 1-based theo lô); ghi được khi chỉ có cảnh báo. `chiTieu.ghep` với `taoMoi` sao `loaiGiaTri, dinhNghiaTuSo, dinhNghiaMauSo, heSoNhan` sang `DM_ChiTieu` (ghép vào chuẩn có sẵn: không ghi đè). `chiTieu.chiTiet` trả thêm `dsLoaiGiaTri` (toàn bộ `DM_LoaiGiaTri` còn hoạt động). Máy chủ giả làm y hệt.

- [ ] **Bước 1: Test thất bại** `KetNoi.test.js` test "tử/mẫu: nhập có cảnh báo vẫn ghi; hệ số thành số; ghép sao bốn cột; chi tiết có danh mục loại; file cũ nhập lại giữ nguyên": nhập `loMau('TU-699', 3, …)` với dòng 1 `{loaiGiaTri:'TY_LE', dinhNghiaTuSo:'Số hồ sơ đúng hạn', dinhNghiaMauSo:'Tổng số hồ sơ', heSoNhan:'100'}`, dòng 2 `{loaiGiaTri:'TY_LE'}` → xem trước `kiemTra.hopLe === true`, `kiemTra.canhBao.map(c=>c.dong)` gồm `2`; ghi `ok`; `timDong('ChiTieu_TrongBo','TU-699:0001').heSoNhan === 100`; dòng `loaiGiaTri:'KHONG_CO'` → xem trước `hopLe === false`. `ghep taoMoi` từ `TU-699:0001` → `DM_ChiTieu` mới có `dinhNghiaTuSo === 'Số hồ sơ đúng hạn'` và `heSoNhan === 100`. `chiTiet` trả `dsLoaiGiaTri.length === 4`. Nhập lại đúng lô nhưng **xóa bốn khóa mới khỏi mọi dòng** của một bộ đã nạp không có bốn cột (ví dụ `loMau('TT13-BNV', 2)` hai lần) → `soSua === 0`.
- [ ] **Bước 2:** `npm test` → FAIL.
- [ ] **Bước 3:** Sửa `ChiTieuGas.nhap` (đọc `DM_LoaiGiaTri` còn hoạt động → `tuyChon.loaiGiaTri`), `ghep`, `chiTiet`; cập nhật `may-chu-gia.mjs` tương ứng.
- [ ] **Bước 4:** `npm run test:all` → PASS.
- [ ] **Bước 5:** Commit `feat: API nhập/ghép/chi tiết hỗ trợ tử số, mẫu số`.

### Task 4: Giao diện — mục "Cách tính" và cảnh báo khi nhập

**Files:** Modify `web/js/chi-tieu.js`, `web/js/nhap-chi-tieu.js`, `web/css/app.css`; Create `web/test/mau/LUAT-TK-10-ty-le.xlsx` (sinh bằng `scripts/chuyen-doi/mau_chuan.py` từ `LUAT-TK-10.xlsx`: `0101` có `loaiGiaTri TY_LE`, `dinhNghiaTuSo` "Diện tích đất theo mục đích", `dinhNghiaMauSo` "Tổng diện tích", `heSoNhan 100`; `0102` có `loaiGiaTri TY_LE`, không định nghĩa); Test `web/test/chi-tieu.test.mjs`, `web/test/nhap-chi-tieu.test.mjs`

**Interfaces:** Consumes `chiTieu.chiTiet → {dong, chuan, cungNoiHam, dsLoaiGiaTri}` và `kiemTra.canhBao` của Task 3. Phần tử: tấm chi tiết `[data-test="cach-tinh"]` (dòng trong bộ và chỉ tiêu chuẩn), màn Nhập `[data-test="canh-bao-nhap"] li`.

- [ ] **Bước 1: Test thất bại.** `nhap-chi-tieu.test.mjs` test "file có chỉ tiêu tỷ lệ thiếu định nghĩa: cảnh báo đúng dòng Excel, vẫn ghi được": chọn `LUAT-TK-10-ty-le.xlsx` → `[data-test="canh-bao-nhap"]` chứa `Dòng 4` và `Chưa quy định phương pháp tính`; `[data-test="loi-nhap"] li` = 0; nút Ghi không khóa; Ghi → thông báo "Đã nhập 10". `chi-tieu.test.mjs` test "cách tính: tỷ lệ có định nghĩa hiện công thức; thiếu định nghĩa hiện chưa quy định": nạp sẵn file đó qua `mc.goiThang`; mở `LUAT-TK:0101` → `[data-test="cach-tinh"]` chứa `Tỷ lệ (tử số/mẫu số)`, `Diện tích đất theo mục đích`, `Giá trị = Tử số ÷ Mẫu số × 100 (%)`; mở `LUAT-TK:0102` → chứa `Chưa quy định phương pháp tính`; mở `LUAT-TK:0103` (không có loại) → không có `[data-test="cach-tinh"]`.
- [ ] **Bước 2:** `npm run test:web` → FAIL.
- [ ] **Bước 3:** Viết mục "Cách tính" (dùng `dsLoaiGiaTri` để lấy tên loại, cờ, hệ số mặc định; chữ giữ xuống dòng như năm mục) cho cả tấm chi tiết dòng và tấm chỉ tiêu chuẩn; khung cảnh báo màu vàng ở màn Nhập, số dòng Excel tính như danh sách lỗi; cột "Loại giá trị" trong bảng xem trước.
- [ ] **Bước 4:** `npm run test:all` → PASS; chụp ảnh tấm chi tiết có "Cách tính" (máy tính và điện thoại, dữ liệu công khai) vào thư mục tạm và xem bằng mắt.
- [ ] **Bước 5:** Commit `feat: mục Cách tính và cảnh báo tử/mẫu trên giao diện`.

### Task 5: Đề xuất tử/mẫu cho TU-699, trộn file duyệt, tài liệu

**Files:** Create `scripts/chuyen-doi/de_xuat_tu_mau.py`; Modify `scripts/chuyen-doi/tu699.py`, `scripts/chuyen-doi/chay_tat_ca.py`, `scripts/chuyen-doi/test_chuyen_doi.py`, `data/bo-chi-tieu/README.md`, `docs/van-hanh/05-nhap-bo-chi-tieu.md`; Create `docs/van-hanh/07-nghiem-thu-tu-so-mau-so.md`; Output (không commit) `data/rieng/de-xuat-tu-mau-TU-699.xlsx`, `data/rieng/TU-699.xlsx`

**Interfaces:**
- `de_xuat_tu_mau.phan_loai(ten: str, don_vi: str) -> (maLoai: str, heSo: int|None)` — quy tắc mặc định: tên chứa "tốc độ"/"tăng trưởng" (không dấu, không phân biệt hoa thường) và đơn vị bắt đầu "%" → `TOC_DO`; đơn vị bắt đầu "%" → `TY_LE`, 100; tên chứa "/10.000 dân" → `TY_LE`, 10000; đơn vị kết thúc "/người" hoặc tên chứa "bình quân đầu người" → `TY_LE`, 1; đơn vị "Hạng" hoặc tên bắt đầu "Xếp hạng" → `XEP_HANG`; còn lại → `SO_TUYET_DOI`.
- Định nghĩa tử/mẫu Claude soạn tay cho từng `maTrongBo` loại `TY_LE` (kèm ghi chú độ chắc chắn), lưu trong `data/rieng/dinh-nghia-tu-mau-TU-699.json` — **được quyền đổi loại** so với quy tắc (ví dụ "Giảm số vụ … so với cùng kỳ" là `TY_LE` với tử/mẫu theo số vụ).
- `python3 -I scripts/chuyen-doi/de_xuat_tu_mau.py <TU-699.xlsx> <dinh-nghia.json> <file đích>` → file duyệt, sheet `DeXuat`, cột: `maTrongBo | tenNguyenVan | donViTinh | capDuLieu | loaiGiaTri | dinhNghiaTuSo | dinhNghiaMauSo | heSoNhan | ghiChuClaude | MrNobodySua`.
- `tu699.chuyen(duong_dan, tu_mau=None)`: `tu_mau` là đường dẫn file duyệt (cùng cột trên); có thì trộn bốn cột theo `maTrongBo`, giá trị ở cột `MrNobodySua` dạng `loaiGiaTri=…; tuSo=…; mauSo=…; heSo=…` ghi đè đề xuất. `chay_tat_ca.py` tự dùng `data/rieng/tu-mau-TU-699-da-duyet.xlsx` nếu có.

- [ ] **Bước 1: Test thất bại** `test_chuyen_doi.py`: `phan_loai('Tốc độ tăng trưởng GRDP','%') == ('TOC_DO', None)`; `phan_loai('Tỷ lệ hồ sơ giải quyết đúng hạn','%') == ('TY_LE', 100)`; `phan_loai('Số bác sĩ/10.000 dân','Bác sĩ') == ('TY_LE', 10000)`; `phan_loai('Thu nhập bình quân đầu người','VND/người') == ('TY_LE', 1)`; `phan_loai('Xếp hạng Chỉ số năng lực cạnh tranh cấp tỉnh','Hạng') == ('XEP_HANG', None)`; `phan_loai('Tổng vốn đầu tư thực hiện trên địa bàn','Tỷ đồng') == ('SO_TUYET_DOI', None)`. Với file 699 (bỏ qua khi thiếu): file đề xuất có 174 dòng; mọi dòng đơn vị bắt đầu "%" (77) có loại `TY_LE` hoặc `TOC_DO`; mọi dòng `TY_LE` có `dinhNghiaTuSo` và `dinhNghiaMauSo` (đã soạn đủ); trộn một file duyệt giả có `MrNobodySua` "tuSo=X" cho một dòng → `tu699.chuyen` trả đúng `dinhNghiaTuSo == 'X'`; `tu699.chuyen` không truyền `tu_mau` → bốn cột rỗng (khóa vẫn có).
- [ ] **Bước 2:** `python3 -I scripts/chuyen-doi/test_chuyen_doi.py` → FAIL.
- [ ] **Bước 3:** Soạn `dinh-nghia-tu-mau-TU-699.json`, viết `de_xuat_tu_mau.py`, sửa `tu699.py`, `chay_tat_ca.py` (sinh file đề xuất vào `data/rieng/`).
- [ ] **Bước 4:** Test → PASS; `python3 -I scripts/chuyen-doi/chay_tat_ca.py`; mở file đề xuất in 10 dòng đầu và mọi dòng `TOC_DO`, đối chiếu tay.
- [ ] **Bước 5:** Tài liệu: README (bốn cột mới, cách trộn file duyệt), tài liệu 05 (mục "Duyệt tử số, mẫu số": cột `MrNobodySua`, gửi lại Claude, nhập lại `TU-699.xlsx` → "Sửa N"), tài liệu 07 (năm mục nghiệm thu đúng thiết kế mục 8, dạng bảng như tài liệu 06). `npm run test:all` và test Python → PASS. Commit `feat: đề xuất tử số/mẫu số TU-699 và tài liệu`.

## Tự rà soát

- **Phủ thiết kế:** mục 5.1 (Task 1), 5.2 (Task 1), 5.3 (Task 2, 3), 5.4 (Task 3), 5.5 (Task 4), 5.6 (Task 5), 5.7 (ghi trong tài liệu 07 và thiết kế; giai đoạn 3 làm), mục 8 nghiệm thu 1–5 (Task 1, 4, 3, 2+4, 3; tài liệu 07).
- **Nhất quán tên:** `DM_LoaiGiaTri`, `maLoaiGiaTri`, `coTuSoMauSo`, `heSoNhanMacDinh`, `loaiGiaTri`, `dinhNghiaTuSo`, `dinhNghiaMauSo`, `heSoNhan`, `kiemTra.canhBao`, `dsLoaiGiaTri` dùng như nhau ở Task 1–5.
- **Review Focus:** 1 → Task 3; 2 → Task 2; 3 → Task 1; 4 → Task 2; 5 → Task 5.
