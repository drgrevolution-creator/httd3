# HTTD 3.0 — Giai đoạn 1 (Nền tảng) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng nền tảng của HTTD 3.0: kho mã, ba file Google Sheets với toàn bộ bảng, đăng nhập Google và mật khẩu, API một cửa có phân quyền, màn Danh mục chung, nhật ký, sao lưu và kiểm tra toàn vẹn hằng đêm, thư mục Drive gốc; nghiệm thu bằng đăng nhập hai cách trên điện thoại, sửa một danh mục và thấy nhật ký, sao lưu đêm chạy.

**Architecture:** Giao diện tĩnh một trang trên GitHub Pages gọi một API Apps Script duy nhất (`doPost` nhận `{phien, action, duLieu}`), dữ liệu nằm trong ba file Sheets, file trên Drive. Mã Apps Script chia hai lớp: lớp **thuần** (`gas/thuan/*.gs`, các đối tượng toàn cục không đụng dịch vụ Google, kiểm thử bằng Node trong một ngữ cảnh `vm` dùng chung mô phỏng phạm vi toàn cục của Apps Script) và lớp **kết nối** mỏng (`gas/ketnoi/*.gs`, gọi Sheets, Drive, Cache, Mail, Trigger). Giao diện kiểm thử bằng Playwright với một máy chủ API giả.

**Tech Stack:** Google Apps Script (V8), Google Sheets, Google Drive, Google Identity Services, clasp 3.x, Node 22 (`node:test`, `node:vm`, `node:crypto`, không thêm gói), HTML/CSS/JS thuần, Playwright (đã cài sẵn trong môi trường), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-14-httd3-design.md` (bản 0.3, đã duyệt 15/11/2026). Mọi tác vụ dưới đây lập luận từ bản thiết kế đó; người thực hiện đọc cả hai.

## Global Constraints

- Tên bảng, tên cột đúng như thiết kế §7 và Phụ lục A, B; cột hệ thống trên mọi bảng: `taoLuc, taoBoi, capNhatLuc, capNhatBoi, tinhTrang`; danh mục có thêm `maThanhPho`, `hieuLucTu`, `hieuLucDen`, `tinhTrangApDung` khi Thành phố quy định.
- Sheet: dòng 1 là khóa cột (camelCase không dấu), dòng 2 là tên hiển thị tiếng Việt, dữ liệu từ dòng 3. Không xóa dòng; xóa là `tinhTrang = "Xóa mềm"`. Giá trị `tinhTrang`: `Hoạt động`, `Ngừng`, `Xóa mềm`.
- Ngày `YYYY-MM-DD`; thời điểm ISO 8601 có múi giờ `+07:00`; manifest `timeZone: "Asia/Ho_Chi_Minh"`.
- Phiên: mã 32 ký tự hex ngẫu nhiên, hạn 12 giờ, tối đa 5 phiên mỗi người; sai mật khẩu 5 lần liên tiếp khóa 15 phút.
- Mật khẩu: SHA-256 lặp 5.000 lần với muối 16 byte hex, `phienBanBam = 2`; không bao giờ trả `matKhauBam`, `muoi` qua API.
- API: một `doPost`, thân `text/plain` chứa JSON `{phien, action, duLieu}`; trả `{ok: true, duLieu}` hoặc `{ok: false, loi: {ma, thongBao}}`; mã lỗi: `PHIEN_HET_HAN`, `KHONG_CO_QUYEN`, `ACTION_KHONG_TON_TAI`, `DU_LIEU_KHONG_HOP_LE`, `KHONG_TIM_THAY`, `LOI_HE_THONG`.
- Thư viện ngoài chỉ từ cdnjs.cloudflare.com, cdn.jsdelivr.net/npm, unpkg.com; phông từ Google Fonts; không có bước biên dịch; không bí mật nào trong kho (Client ID là công khai).
- Giao diện tiếng Việt, động từ ngắn; đích chạm tối thiểu 44 px; tương phản chữ 4,5:1; làm việc tốt ở 360 px và 1280 px.
- Mã Apps Script: mỗi file một đối tượng toàn cục cùng tên file (`var SoDo = {...}`), chú thích tiếng Việt đầu mỗi hàm; lớp thuần không gọi `SpreadsheetApp`, `DriveApp`, `UrlFetchApp`, `Utilities`, `CacheService`, `PropertiesService`, `LockService`, `MailApp`, `ScriptApp`.
- Commit nhỏ, thông điệp tiếng Việt theo mẫu `feat|fix|test|docs: ...`.

## Review Focus

1. **Ô Sheets chứa xuống dòng hoặc số được Google tự đổi kiểu** (ví dụ "01/2026" thành ngày, `0123` thành 123): `Bang.tuMaTran` phải giữ nguyên chuỗi và `KhoDuLieu` phải ghi bằng `setValues` với định dạng chữ cho cột `text`. Test thêm ở Task 3.
2. **Thẻ Google hợp lệ nhưng email chưa có trong `DM_NguoiDung` hoặc tài khoản `Khóa`**: phải trả `KHONG_CO_QUYEN` với thông báo rõ, không tạo tài khoản ngầm. Test thêm ở Task 5.
3. **Hai lần ghi đồng thời vào cùng bảng** (hai đơn vị cùng lưu): `KhoDuLieu` dùng `LockService` 30 giây; bộ đếm mã không cấp trùng. Test thuần cho `MaSo` ở Task 4; kiểm tra tay ở Task 13.
4. **Mã phiên hết hạn giữa chừng khi đang điền biểu mẫu**: trang giữ dữ liệu đang nhập, hiện đăng nhập lại, gửi lại sau khi có phiên mới. Test thêm ở Task 11.
5. **Sao lưu đêm khi Drive đầy hoặc file nguồn bị đổi tên**: ghi dòng thất bại vào `SaoLuu` và email QUANTRI, không ném lỗi im lặng. Kiểm tra tay ở Task 13 với bảng kiểm.

---

## Cấu trúc file

```
httd3/
  README.md, .gitignore, package.json (scripts: test, test:web), .clasp.json
  gas/appsscript.json
  gas/Main.gs                      # doGet, doPost, bao gói JSON, bắt lỗi
  gas/thuan/SoDo.gs                # sơ đồ ba file, mọi bảng và cột
  gas/thuan/Bang.gs                # ma trận ↔ đối tượng, kiểm tra theo sơ đồ
  gas/thuan/MaSo.gs                # sinh mã tăng dần theo định dạng
  gas/thuan/MatKhau.gs             # băm, so sánh, quy tắc khóa
  gas/thuan/Phien.gs               # phiên, kiểm tra thẻ Google
  gas/thuan/PhanQuyen.gs           # bảng action → vai trò
  gas/thuan/DieuPhoi.gs            # bộ điều phối thuần
  gas/thuan/NhatKy.gs              # dựng dòng nhật ký
  gas/thuan/ToanVen.gs             # kiểm tra toàn vẹn thuần
  gas/thuan/SaoLuu.gs              # tên file sao lưu, danh sách cần xóa
  gas/thuan/DuLieuGieo.gs          # dữ liệu gieo danh mục
  gas/ketnoi/KhoDuLieu.gs          # đọc ghi Sheets, bộ đếm, khóa
  gas/ketnoi/XacThuc.gs            # đăng nhập Google, mật khẩu, phiên
  gas/ketnoi/DanhMucGas.gs         # handler danh mục, người dùng, nhật ký
  gas/ketnoi/LichDem.gs            # sao lưu, toàn vẹn, cài lịch
  gas/ketnoi/ThietLap.gs           # thiết lập lần đầu
  gas/test/_moiTruong.js           # nạp thuan/*.gs vào một ngữ cảnh vm
  gas/test/*.test.js
  web/index.html, web/config.js, web/css/token.css, web/css/app.css
  web/js/api.js, web/js/ui.js, web/js/dang-nhap.js, web/js/danh-muc.js, web/js/quan-tri.js, web/js/app.js
  web/test/may-chu-gia.mjs, web/test/*.test.mjs
  scripts/kiem-tra-api.mjs         # thử API đã triển khai từ máy Mr. Nobody
  docs/van-hanh/01-google-cloud-client-id.md, 02-trien-khai-apps-script.md, 03-github-pages.md, 04-nghiem-thu-giai-doan-1.md
```

---

### Task 1: Khởi tạo kho và bộ chạy kiểm thử

**Files:**
- Create: `README.md`, `.gitignore`, `package.json`, `gas/test/_moiTruong.js`, `gas/test/_moiTruong.test.js`

**Interfaces:**
- Produces: `taiThuan()` trong `gas/test/_moiTruong.js`: nạp mọi file `gas/thuan/*.gs` theo thứ tự tên vào một ngữ cảnh `vm` chung và trả về ngữ cảnh đó (`ctx.SoDo`, `ctx.Bang`...). Mọi test thuần về sau dùng hàm này.

- [ ] **Bước 1: Khởi tạo git và cấu trúc**

```bash
cd /home/user/httd3 && git init -b main && mkdir -p gas/thuan gas/ketnoi gas/test web/css web/js web/test scripts docs/van-hanh
```

- [ ] **Bước 2: Viết `package.json`** với `"type": "commonjs"`, scripts `"test": "node --test gas/test/"` và `"test:web": "node --test web/test/"`, không `dependencies`. `.gitignore`: `node_modules/`, `.clasprc.json`, `web/config.local.js`, `.DS_Store`.

- [ ] **Bước 3: Viết test thất bại** `gas/test/_moiTruong.test.js`

```js
const test = require('node:test'); const assert = require('node:assert/strict');
const { taiThuan } = require('./_moiTruong');
test('nạp mọi file thuần vào một ngữ cảnh chung', () => {
  const ctx = taiThuan();
  assert.equal(typeof ctx, 'object');
  assert.ok(Array.isArray(ctx.__daNap) && ctx.__daNap.length >= 0);
});
```

- [ ] **Bước 4: Chạy, xác nhận thất bại** — `npm test` → FAIL "Cannot find module './_moiTruong'".

- [ ] **Bước 5: Viết `taiThuan()`**: đọc `fs.readdirSync('gas/thuan')` lọc `.gs`, sắp xếp, `vm.createContext({ console })`, `vm.runInContext(src, ctx, { filename })` từng file, gán `ctx.__daNap` là danh sách tên file. Không stub dịch vụ Google nào (lớp thuần không được gọi).

- [ ] **Bước 6: Chạy, xác nhận đạt** — `npm test` → PASS.

- [ ] **Bước 7: Viết `README.md`** (mục đích, cấu trúc thư mục, cách chạy test, link bản thiết kế) và commit

```bash
git add -A && git commit -m "feat: khởi tạo kho httd3, bộ nạp kiểm thử lớp thuần"
```

- [ ] **Bước 8 (việc của Mr. Nobody, không chặn các task thuần):** tạo kho GitHub công khai trống tên `httd3`; Claude gắn kho vào phiên và đẩy nhánh `main` lên.

---

### Task 2: Sơ đồ dữ liệu `SoDo`

**Files:**
- Create: `gas/thuan/SoDo.gs`, `gas/test/SoDo.test.js`

**Interfaces:**
- Produces: `SoDo.FILE = ['HTTD3_DanhMuc','HTTD3_DuLieu','HTTD3_NhatKy']`; `SoDo.BANG[tenBang] = { file, nhom ('danhmuc'|'nghiepvu'|'nhatky'), tienToMa, dinhDangMa ('SO-4'|'SO-6'|'NAM-4'|'TU_NHAP'), cot: [{ khoa, ten, kieu, batBuoc, khoaChinh, tuyChon, thamChieu, an, macDinh }] }`; `SoDo.khoaChinh(tenBang) → string`; `SoDo.cotHeThong(tenBang) → cot[]`; `SoDo.danhSachBang(nhom?) → string[]`; `SoDo.KIEU = ['text','textarea','number','date','datetime','boolean','select','multiselect','ref','email','json']`.
- Nội dung bắt buộc: toàn bộ bảng của thiết kế §7.2, §7.3, Phụ lục A (13 danh mục), danh mục địa phương (`DM_DonVi, DM_LinhVuc, DM_VanBan, DM_KyBaoCao, DM_NguoiDung, DM_CauTruc, CauHinh`), bảng nghiệp vụ (`NhiemVu, YeuCauDauVao, BaoCaoNhiemVu, BaoCaoNhiemVu_LichSu, TongHopNhiemVuKy, ChiTieu_NguonQuyDinh, ChiTieu_PhanCong, SoLieuChiTieu, SoLieuChiTieu_LichSu, TongHopChiTieuKy, ChiSo_TuDanhGia, MinhChung, BaoCaoDaSinh, HopThuClaude, BoDem`), bảng nhật ký (`NhatKy, PhienDangNhap, KiemTraToanVen, SaoLuu, DoiChieuChuyenDoi`).
- `DM_NguoiDung`: cột `matKhauBam`, `muoi` có `an: true`; `vaiTro` là `multiselect` với tùy chọn `QUANTRI, KIEMDUYET, CHUYENVIEN, DONVI, LANHDAO`; `danhSachDonVi` là `multiselect` `thamChieu: 'DM_DonVi'`.

- [ ] **Bước 1: Viết test thất bại** `gas/test/SoDo.test.js`

```js
test('đủ ba file và mọi bảng thuộc đúng file', () => { const {SoDo}=taiThuan(); assert.deepEqual(SoDo.FILE,['HTTD3_DanhMuc','HTTD3_DuLieu','HTTD3_NhatKy']); for (const b of Object.values(SoDo.BANG)) assert.ok(SoDo.FILE.includes(b.file)); });
test('13 danh mục Thành phố có đúng cột đầu tiên theo Phụ lục A', () => { const {SoDo}=taiThuan(); assert.equal(SoDo.BANG.DM_MucTieu.cot[0].khoa,'maMucTieu'); assert.equal(SoDo.BANG.DM_MucTieu.cot.filter(c=>!c.heThong).length,14); assert.equal(SoDo.BANG.DM_ChiSo.cot[0].khoa,'maChiSo'); assert.equal(SoDo.BANG.DM_MoHinh.cot.filter(c=>!c.heThong).length,18); });
test('mọi bảng có khóa chính và cột hệ thống', () => { const {SoDo}=taiThuan(); for (const t of SoDo.danhSachBang()) { assert.equal(typeof SoDo.khoaChinh(t),'string'); const ks=SoDo.BANG[t].cot.map(c=>c.khoa); for (const k of ['taoLuc','taoBoi','capNhatLuc','capNhatBoi','tinhTrang']) assert.ok(ks.includes(k), t+' thiếu '+k); } });
test('danh mục có maThanhPho, bảng nghiệp vụ không có', () => { const {SoDo}=taiThuan(); assert.ok(SoDo.BANG.DM_DonVi.cot.some(c=>c.khoa==='maThanhPho')); assert.ok(!SoDo.BANG.NhiemVu.cot.some(c=>c.khoa==='maThanhPho')); });
test('kiểu cột hợp lệ và cột ẩn của người dùng', () => { const {SoDo}=taiThuan(); for (const b of Object.values(SoDo.BANG)) for (const c of b.cot) assert.ok(SoDo.KIEU.includes(c.kieu), c.khoa); assert.ok(SoDo.BANG.DM_NguoiDung.cot.find(c=>c.khoa==='matKhauBam').an); });
test('NhiemVu có đủ cột 4 nhóm của thiết kế 7.3', () => { const {SoDo}=taiThuan(); const ks=SoDo.BANG.NhiemVu.cot.map(c=>c.khoa); for (const k of ['maNhiemVu','tenNhiemVu','nguon','loaiSanPham','maCDS','trangThaiXacNhan','lienKetNhiemVu','minhChung','maChiSo']) assert.ok(ks.includes(k),k); });
```

- [ ] **Bước 2: Chạy, xác nhận thất bại** — `node --test gas/test/SoDo.test.js` → FAIL "SoDo is not defined".

- [ ] **Bước 3: Viết `gas/thuan/SoDo.gs`** theo Interfaces. Cột hệ thống thêm bằng hàm nội bộ `_themCotHeThong(bang)` gắn cờ `heThong: true`. Cột của 13 danh mục chép đúng thứ tự Phụ lục A; cột của bảng kế thừa HTTD chép từ Phụ lục B đổi sang camelCase. `tuyChon` cho `select` ghi ngay trong sơ đồ (ví dụ `tinhTrangApDung: ['Đang áp dụng','Hết hiệu lực','Dự thảo']`, `nguon: ['KE_HOACH','THUONG_XUYEN']`).

- [ ] **Bước 4: Chạy, xác nhận đạt** — `node --test gas/test/SoDo.test.js` → PASS (6 test).

- [ ] **Bước 5: Commit** — `git add gas/thuan/SoDo.gs gas/test/SoDo.test.js && git commit -m "feat: sơ đồ dữ liệu ba file theo thiết kế §7 và Phụ lục A, B"`

---

### Task 3: Bảng `Bang` — ma trận ↔ đối tượng, kiểm tra theo sơ đồ

**Files:**
- Create: `gas/thuan/Bang.gs`, `gas/test/Bang.test.js`

**Interfaces:**
- Consumes: `SoDo`.
- Produces: `Bang.tuMaTran(tenBang, maTran) → {banGhi: object[], loi: string[]}` (dòng 1 khóa, dòng 2 bỏ, từ dòng 3 là dữ liệu; giữ nguyên chuỗi; `multiselect`/`json` lưu dạng chuỗi JSON trong ô và được parse); `Bang.thanhDong(tenBang, banGhi) → any[]` theo thứ tự cột sơ đồ; `Bang.kiemTra(tenBang, banGhi, {thamChieu}) → {hopLe: boolean, loi: [{khoa, thongBao}]}` (bắt buộc, kiểu, `tuyChon`, `email`, `date` đúng `YYYY-MM-DD`, `ref` tồn tại trong `thamChieu[bang]` là mảng mã); `Bang.anCotNhayCam(tenBang, banGhi) → object` (bỏ cột `an`); `Bang.dongTieuDe(tenBang) → [khoa[], ten[]]`.

- [ ] **Bước 1: Viết test thất bại** `gas/test/Bang.test.js` (bảng mẫu `DM_LinhVuc`)

```js
test('tuMaTran giữ chuỗi "0123" và xuống dòng', () => { const {Bang,SoDo}=taiThuan(); const [k,t]=Bang.dongTieuDe('DM_LinhVuc'); const r=Bang.tuMaTran('DM_LinhVuc',[k,t,k.map(x=>x==='maLinhVuc'?'0123':x==='tenLinhVuc'?'Dòng 1\nDòng 2':x==='tinhTrang'?'Hoạt động':'')]); assert.equal(r.banGhi[0].maLinhVuc,'0123'); assert.equal(r.banGhi[0].tenLinhVuc,'Dòng 1\nDòng 2'); });
test('thanhDong xếp đúng thứ tự cột và JSON hóa multiselect', () => { const {Bang}=taiThuan(); const d=Bang.thanhDong('DM_NguoiDung',{maNguoiDung:'ND-0001',vaiTro:['QUANTRI','CHUYENVIEN']}); const [k]=Bang.dongTieuDe('DM_NguoiDung'); assert.equal(d[k.indexOf('vaiTro')],'["QUANTRI","CHUYENVIEN"]'); assert.equal(d.length,k.length); });
test('kiemTra báo thiếu bắt buộc, sai tuỳ chọn, sai tham chiếu', () => { const {Bang}=taiThuan(); const r=Bang.kiemTra('DM_NguoiDung',{maNguoiDung:'ND-0002',email:'sai',vaiTro:['KHAC'],danhSachDonVi:['DV99'],tinhTrang:'Hoạt động'},{thamChieu:{DM_DonVi:['DV01']}}); assert.equal(r.hopLe,false); const ks=r.loi.map(l=>l.khoa); for (const k of ['tenDangNhap','hoTen','email','vaiTro','danhSachDonVi']) assert.ok(ks.includes(k),k); });
test('anCotNhayCam bỏ matKhauBam và muoi', () => { const {Bang}=taiThuan(); const r=Bang.anCotNhayCam('DM_NguoiDung',{maNguoiDung:'x',matKhauBam:'a',muoi:'b'}); assert.deepEqual(Object.keys(r),['maNguoiDung']); });
```

- [ ] **Bước 2: Chạy, xác nhận thất bại.**
- [ ] **Bước 3: Viết `gas/thuan/Bang.gs`** theo Interfaces; parse JSON cho `multiselect`, `json` với try/catch trả mảng rỗng và ghi vào `loi`.
- [ ] **Bước 4: Chạy, xác nhận đạt.**
- [ ] **Bước 5: Commit** — `git commit -m "feat: Bang — chuyển đổi và kiểm tra bản ghi theo sơ đồ"`

---

### Task 4: Sinh mã `MaSo`

**Files:**
- Create: `gas/thuan/MaSo.gs`, `gas/test/MaSo.test.js`

**Interfaces:**
- Consumes: `SoDo.BANG[t].tienToMa`, `.dinhDangMa`.
- Produces: `MaSo.sinh(tenBang, {soHienTai, nam}) → {ma, soMoi, nam}`; định dạng `SO-4` → `MT-0001`, `SO-6` → `BC-000001`, `NAM-4` → `NV-2026-0001` (reset về 1 khi `nam` đổi), `TU_NHAP` → ném lỗi `MA_TU_NHAP`; `MaSo.hopLe(tenBang, ma) → boolean` (regex theo định dạng; `TU_NHAP` chấp nhận `^[A-Za-z0-9._-]{2,30}$`).

- [ ] **Bước 1: Viết test thất bại**

```js
test('NAM-4 tăng và reset theo năm', () => { const {MaSo}=taiThuan(); assert.deepEqual(MaSo.sinh('NhiemVu',{soHienTai:12,nam:2026}),{ma:'NV-2026-0013',soMoi:13,nam:2026}); assert.equal(MaSo.sinh('NhiemVu',{soHienTai:12,nam:2025}).ma,'NV-2026-0001'.replace('2026',String(new Date().getFullYear()))); });
test('SO-6 giữ định dạng HTTD cho báo cáo', () => { const {MaSo}=taiThuan(); assert.equal(MaSo.sinh('BaoCaoNhiemVu',{soHienTai:2}).ma,'BC-000003'); });
test('TU_NHAP không sinh, nhưng kiểm tra hợp lệ', () => { const {MaSo}=taiThuan(); assert.throws(()=>MaSo.sinh('DM_DonVi',{soHienTai:0}),/MA_TU_NHAP/); assert.ok(MaSo.hopLe('DM_DonVi','DV01')); assert.ok(!MaSo.hopLe('DM_DonVi','DV 01')); });
```

- [ ] **Bước 2: Chạy, xác nhận thất bại.** **Bước 3: Viết `MaSo.gs`.** **Bước 4: Chạy, đạt.** **Bước 5: Commit** `feat: MaSo — sinh mã theo định dạng`.

---

### Task 5: `MatKhau` và `Phien` (thuần)

**Files:**
- Create: `gas/thuan/MatKhau.gs`, `gas/thuan/Phien.gs`, `gas/test/MatKhau.test.js`, `gas/test/Phien.test.js`

**Interfaces:**
- Produces: `MatKhau.bam(matKhau, muoiHex, sha256Hex) → string` (lặp 5.000 lần `sha256Hex(truoc + muoiHex)`), `MatKhau.khop(matKhau, muoiHex, bamLuu, sha256Hex) → boolean`, `MatKhau.tinhKhoa(soLanSaiMoi, bayGioIso) → {khoaDen: string|null}` (5 lần → +15 phút), `MatKhau.datYeuCau(matKhau) → {hopLe, loi[]}` (≥ 8 ký tự, có chữ và số).
- `Phien.taoMa(ngauNhienHex32) → string`, `Phien.tao({nguoiDung, bayGioIso, thietBi, ngauNhienHex32}) → phien` với `hetHanLuc = +12h`, `vaiTro`, `danhSachDonVi` sao chép; `Phien.conHan(phien, bayGioIso) → boolean`; `Phien.gioiHan(danhSachPhienCuaNguoi) → phienCanThuHoi[]` (giữ 5 mới nhất); `Phien.kiemTraTheGoogle(payload, {clientId, bayGioGiay}) → {hopLe, email, loi}` (bắt buộc `aud === clientId`, `iss ∈ {accounts.google.com, https://accounts.google.com}`, `exp > bayGioGiay`, `email_verified` là `true` hoặc `"true"`).
- `sha256Hex` được tiêm từ ngoài: Node dùng `crypto.createHash`, Apps Script dùng `Utilities.computeDigest`.

- [ ] **Bước 1: Viết test thất bại** (trích)

```js
const sha=(s)=>require('node:crypto').createHash('sha256').update(s,'utf8').digest('hex');
test('bam ổn định và khop đúng/sai', () => { const {MatKhau}=taiThuan(); const b=MatKhau.bam('Abc12345','00ff',sha); assert.equal(b.length,64); assert.ok(MatKhau.khop('Abc12345','00ff',b,sha)); assert.ok(!MatKhau.khop('Abc12346','00ff',b,sha)); });
test('khóa 15 phút sau 5 lần sai', () => { const {MatKhau}=taiThuan(); assert.equal(MatKhau.tinhKhoa(4,'2026-11-15T08:00:00+07:00').khoaDen,null); assert.equal(MatKhau.tinhKhoa(5,'2026-11-15T08:00:00+07:00').khoaDen,'2026-11-15T08:15:00+07:00'); });
test('thẻ Google: đúng aud, hết hạn, email chưa xác minh', () => { const {Phien}=taiThuan(); const ok={aud:'CID',iss:'https://accounts.google.com',exp:2000,email:'a@gmail.com',email_verified:'true'}; assert.equal(Phien.kiemTraTheGoogle(ok,{clientId:'CID',bayGioGiay:1000}).hopLe,true); assert.equal(Phien.kiemTraTheGoogle({...ok,aud:'X'},{clientId:'CID',bayGioGiay:1000}).loi,'SAI_AUD'); assert.equal(Phien.kiemTraTheGoogle({...ok,exp:999},{clientId:'CID',bayGioGiay:1000}).loi,'HET_HAN'); assert.equal(Phien.kiemTraTheGoogle({...ok,email_verified:'false'},{clientId:'CID',bayGioGiay:1000}).loi,'EMAIL_CHUA_XAC_MINH'); });
test('phiên 12 giờ và giữ 5 phiên mới nhất', () => { const {Phien}=taiThuan(); const p=Phien.tao({nguoiDung:{maNguoiDung:'ND-0001',email:'a@gmail.com',vaiTro:['QUANTRI'],danhSachDonVi:['DV03']},bayGioIso:'2026-11-15T08:00:00+07:00',thietBi:'test',ngauNhienHex32:'a'.repeat(32)}); assert.equal(p.hetHanLuc,'2026-11-15T20:00:00+07:00'); assert.ok(Phien.conHan(p,'2026-11-15T19:59:00+07:00')); assert.ok(!Phien.conHan(p,'2026-11-15T20:00:01+07:00')); const ds=[1,2,3,4,5,6].map(i=>({maPhien:'p'+i,taoLuc:'2026-11-1'+i})); assert.deepEqual(Phien.gioiHan(ds).map(x=>x.maPhien),['p1']); });
```

- [ ] **Bước 2: Chạy, thất bại.** **Bước 3: Viết hai file.** Tính giờ bằng số mili giây rồi định dạng lại chuỗi `+07:00` (viết `Phien._dinhDangIso(ms)` nội bộ, không dùng `toISOString` vì nó trả UTC). **Bước 4: Chạy, đạt.** **Bước 5: Commit** `feat: MatKhau và Phien thuần`.

---

### Task 6: `PhanQuyen` và `DieuPhoi`

**Files:**
- Create: `gas/thuan/PhanQuyen.gs`, `gas/thuan/DieuPhoi.gs`, `gas/test/DieuPhoi.test.js`

**Interfaces:**
- Produces: `PhanQuyen.BANG = { 'xacThuc.dangNhapGoogle': ['*'], 'xacThuc.dangNhapMatKhau': ['*'], 'xacThuc.dangXuat': ['@'], 'xacThuc.doiMatKhau': ['@'], 'heThong.khoiDong': ['@'], 'heThong.sucKhoe': ['*'], 'danhMuc.doc': ['@'], 'danhMuc.them': ['QUANTRI'], 'danhMuc.sua': ['QUANTRI'], 'danhMuc.ngung': ['QUANTRI'], 'nguoiDung.doc': ['QUANTRI'], 'nguoiDung.them': ['QUANTRI'], 'nguoiDung.sua': ['QUANTRI'], 'nguoiDung.datLaiMatKhau': ['QUANTRI'], 'nhatKy.doc': ['QUANTRI','KIEMDUYET'], 'lich.chayNgay': ['QUANTRI'] }` (`*` = không cần phiên, `@` = cần phiên bất kỳ vai trò); `PhanQuyen.duocPhep(vaiTro[], action) → boolean`.
- `DieuPhoi.xuLy(yeuCau, nguCanh) → {ok, duLieu?} | {ok:false, loi:{ma, thongBao}}` với `yeuCau = {phien, action, duLieu}` và `nguCanh = { layPhien(maPhien) → phien|null, bayGioIso, handlers: {[action]: (duLieu, phien) → any} }`. Thứ tự: action tồn tại → nếu không phải `*` thì `layPhien` và `Phien.conHan` → `PhanQuyen.duocPhep` → gọi handler trong try/catch (lỗi có `ma` giữ nguyên, lỗi khác thành `LOI_HE_THONG`).

- [ ] **Bước 1: Viết test thất bại**

```js
test('action không tồn tại', () => { const {DieuPhoi}=taiThuan(); const r=DieuPhoi.xuLy({action:'x.y'},{handlers:{},layPhien:()=>null,bayGioIso:'2026-11-15T08:00:00+07:00'}); assert.equal(r.loi.ma,'ACTION_KHONG_TON_TAI'); });
test('thiếu phiên hoặc hết hạn', () => { const {DieuPhoi}=taiThuan(); const nc={handlers:{'danhMuc.doc':()=>[]},layPhien:(m)=>m==='het'?{hetHanLuc:'2026-11-15T07:00:00+07:00',vaiTro:['QUANTRI']}:null,bayGioIso:'2026-11-15T08:00:00+07:00'}; assert.equal(DieuPhoi.xuLy({action:'danhMuc.doc'},nc).loi.ma,'PHIEN_HET_HAN'); assert.equal(DieuPhoi.xuLy({action:'danhMuc.doc',phien:'het'},nc).loi.ma,'PHIEN_HET_HAN'); });
test('không có quyền và có quyền', () => { const {DieuPhoi}=taiThuan(); const nc={handlers:{'danhMuc.them':(d,p)=>({da:true,boi:p.email})},layPhien:()=>({hetHanLuc:'2026-11-15T20:00:00+07:00',vaiTro:['DONVI'],email:'u@x'}),bayGioIso:'2026-11-15T08:00:00+07:00'}; assert.equal(DieuPhoi.xuLy({action:'danhMuc.them',phien:'p'},nc).loi.ma,'KHONG_CO_QUYEN'); nc.layPhien=()=>({hetHanLuc:'2026-11-15T20:00:00+07:00',vaiTro:['QUANTRI'],email:'q@x'}); assert.deepEqual(DieuPhoi.xuLy({action:'danhMuc.them',phien:'p'},nc),{ok:true,duLieu:{da:true,boi:'q@x'}}); });
test('lỗi handler được bao gói', () => { const {DieuPhoi}=taiThuan(); const nc={handlers:{'heThong.sucKhoe':()=>{const e=new Error('x');e.ma='KHONG_TIM_THAY';throw e;}},layPhien:()=>null,bayGioIso:'2026-11-15T08:00:00+07:00'}; assert.equal(DieuPhoi.xuLy({action:'heThong.sucKhoe'},nc).loi.ma,'KHONG_TIM_THAY'); });
```

- [ ] **Bước 2–4: thất bại → viết → đạt.** **Bước 5: Commit** `feat: PhanQuyen và DieuPhoi thuần`.

---

### Task 7: `NhatKy`, `ToanVen`, `SaoLuu` (thuần)

**Files:**
- Create: `gas/thuan/NhatKy.gs`, `gas/thuan/ToanVen.gs`, `gas/thuan/SaoLuu.gs`, `gas/test/NhatKy.test.js`, `gas/test/ToanVen.test.js`, `gas/test/SaoLuu.test.js`

**Interfaces:**
- `NhatKy.dong({phien, hanhDong, bang, ma, truoc, sau, canCu, bayGioIso}) → object` đúng cột `NhatKy` của `SoDo` (`truocKhiSua`, `sauKhiSua` là JSON chỉ của các khóa thay đổi; không bao giờ chứa `matKhauBam`, `muoi`); `NhatKy.khacBiet(truoc, sau) → {truoc, sau}`.
- `ToanVen.kiemTra(duLieu) → [{quanHe, bang, ma, giaTriHienTai, giaTriDung, ketQua, ghiChu}]` với `duLieu = {[tenBang]: banGhi[]}`: (1) `KHOA_TRUNG` khóa chính lặp; (2) `THAM_CHIEU` cột `ref`/`multiselect` có `thamChieu` trỏ tới mã không tồn tại hoặc `Xóa mềm`; (3) `TUY_CHON` giá trị `select` ngoài `tuyChon`; (4) `BAT_BUOC` cột bắt buộc rỗng ở bản ghi `Hoạt động`. Kết quả rỗng là đạt.
- `SaoLuu.tenFile(tenGoc, ngayIso) → 'SaoLuu_<tenGoc>_YYYY-MM-DD'`; `SaoLuu.canXoa(files, homNayIso, {giuNgay: 30, giuThang: 24}) → files[]` giữ mọi bản trong 30 ngày và bản ngày 01 mỗi tháng trong 24 tháng.

- [ ] **Bước 1: Viết test thất bại** (trích)

```js
test('dòng nhật ký không rò mật khẩu', () => { const {NhatKy}=taiThuan(); const d=NhatKy.dong({phien:{email:'q@x',maNguoiDung:'ND-0001',vaiTro:['QUANTRI']},hanhDong:'SUA',bang:'DM_NguoiDung',ma:'ND-0002',truoc:{hoTen:'A',matKhauBam:'1'},sau:{hoTen:'B',matKhauBam:'2'},bayGioIso:'2026-11-15T08:00:00+07:00'}); assert.equal(JSON.parse(d.sauKhiSua).hoTen,'B'); assert.ok(!d.sauKhiSua.includes('matKhauBam')); assert.equal(d.hanhDong,'SUA'); });
test('toàn vẹn phát hiện trùng khóa và tham chiếu gãy', () => { const {ToanVen}=taiThuan(); const r=ToanVen.kiemTra({DM_DonVi:[{maDonVi:'DV01',tenDayDu:'VP',tinhTrang:'Hoạt động'},{maDonVi:'DV01',tenDayDu:'VP2',tinhTrang:'Hoạt động'}],DM_NguoiDung:[{maNguoiDung:'ND-0001',tenDangNhap:'a',hoTen:'A',email:'a@x.com',vaiTro:['QUANTRI'],danhSachDonVi:['DV09'],tinhTrang:'Hoạt động'}]}); assert.ok(r.some(x=>x.quanHe==='KHOA_TRUNG'&&x.ma==='DV01')); assert.ok(r.some(x=>x.quanHe==='THAM_CHIEU'&&x.bang==='DM_NguoiDung')); });
test('giữ 30 ngày và bản ngày 01 trong 24 tháng', () => { const {SaoLuu}=taiThuan(); const fs=[{ten:'SaoLuu_HTTD3_DuLieu_2026-10-01'},{ten:'SaoLuu_HTTD3_DuLieu_2026-10-02'},{ten:'SaoLuu_HTTD3_DuLieu_2026-11-14'},{ten:'SaoLuu_HTTD3_DuLieu_2024-10-01'}]; assert.deepEqual(SaoLuu.canXoa(fs,'2026-11-15').map(f=>f.ten),['SaoLuu_HTTD3_DuLieu_2026-10-02','SaoLuu_HTTD3_DuLieu_2024-10-01']); });
```

- [ ] **Bước 2–4: thất bại → viết ba file → đạt.** **Bước 5: Commit** `feat: NhatKy, ToanVen, SaoLuu thuần`.

---

### Task 8: Dữ liệu gieo `DuLieuGieo`

**Files:**
- Create: `gas/thuan/DuLieuGieo.gs`, `gas/test/DuLieuGieo.test.js`

**Interfaces:**
- Produces: `DuLieuGieo.BANG = { DM_DonVi: [...], DM_LinhVuc: [...], DM_TrangThai: [...], DM_MucDo: [...], DM_DonViDo: [...], DM_KyBaoCao: [...], DM_ChuongTrinh: [...], CauHinh: [...] }`; `DuLieuGieo.cauTruc() → banGhi[]` sinh nội dung bảng `DM_CauTruc` từ `SoDo` (mỗi cột một dòng: `bang, khoa, ten, kieu, batBuoc, tuyChon, thamChieu`).
- Nội dung bắt buộc (từ thiết kế §7.4, Phụ lục B và dữ liệu HTTD đã trích): `DM_DonVi` 36 dòng (DV01–DV07 đúng tên, DV08 Công an xã, DV09 Ban Chỉ huy Quân sự xã, TH01–TH16, AP01–AP11, cột `nhom` ∈ DV, TH, AP, NGOAI); `DM_LinhVuc` 10 mã của `CauHinh` HTTD (CĐS→`CDS`, CCHC, KHCN, TTTT, ĐMST→`DMST`, SHTT, TĐC→`TDC`, HTTT, KTS, XHS) cộng `KHAC`; `DM_TrangThai` 9 trạng thái nhiệm vụ + 3 trạng thái duyệt + 4 trạng thái yêu cầu đầu vào với `mucDoHoanThanh`, `yNghiaQuanLy`, `apDungChoLoai`; `DM_MucDo` các ngưỡng xanh, vàng, đỏ cho tiến độ, tỷ lệ đạt, hạn với `mauSacHienThi`; `DM_KyBaoCao` 6 kỳ của `CauHinh` HTTD kèm `hanChot`, `loaiKy`, `apDungCho = 'cả hai'`; `DM_ChuongTrinh` 4 kế hoạch KH09 (09/KH-UBND, 08/01/2026, Cải cách hành chính năm 2026, CCHC), KH92, KHDTI, KHNQ57; `CauHinh` khóa `tenCoQuan = ỦY BAN NHÂN DÂN XÃ PHƯỚC HẢI`, `diaDanh = Phước Hải`, `soNgayNhacHan = 7`, `chiTinhSoLieuDaDuyet = Không`, `noiNhanBaoCao`, `mauTinNhac`, `mauTinNhacQuaHan` (theo thiết kế sổ việc 7.4), `ngayDauTuan = 6`.

- [ ] **Bước 1: Viết test thất bại**

```js
test('mọi bản ghi gieo hợp lệ theo sơ đồ và tham chiếu nội bộ', () => { const {DuLieuGieo,Bang}=taiThuan(); const thamChieu={}; for (const [b,ds] of Object.entries(DuLieuGieo.BANG)) thamChieu[b]=ds.map(r=>r[Object.keys(r)[0]]); for (const [b,ds] of Object.entries(DuLieuGieo.BANG)) for (const r of ds) { const k=Bang.kiemTra(b,r,{thamChieu}); assert.ok(k.hopLe, b+' '+JSON.stringify(k.loi)); } });
test('36 đầu mối, 11 lĩnh vực, 4 chương trình, 6 kỳ', () => { const {DuLieuGieo}=taiThuan(); assert.equal(DuLieuGieo.BANG.DM_DonVi.length,36); assert.equal(DuLieuGieo.BANG.DM_LinhVuc.length,11); assert.equal(DuLieuGieo.BANG.DM_ChuongTrinh.length,4); assert.equal(DuLieuGieo.BANG.DM_KyBaoCao.length,6); assert.equal(DuLieuGieo.BANG.DM_DonVi.find(d=>d.maDonVi==='DV04').tenVietTat,'TTPVHCC'); });
test('DM_CauTruc sinh đủ cột của mọi danh mục', () => { const {DuLieuGieo,SoDo}=taiThuan(); const ct=DuLieuGieo.cauTruc(); const tong=SoDo.danhSachBang('danhmuc').reduce((s,t)=>s+SoDo.BANG[t].cot.length,0); assert.equal(ct.length,tong); });
```

- [ ] **Bước 2–4: thất bại → viết → đạt.** **Bước 5: Commit** `feat: dữ liệu gieo danh mục từ HTTD 2.0 và thiết kế §7.4`.

---

### Task 9: Lớp kết nối Apps Script (`Main`, `KhoDuLieu`, `XacThuc`, `DanhMucGas`)

**Files:**
- Create: `gas/appsscript.json`, `.clasp.json`, `gas/Main.gs`, `gas/ketnoi/KhoDuLieu.gs`, `gas/ketnoi/XacThuc.gs`, `gas/ketnoi/DanhMucGas.gs`

**Interfaces:**
- Consumes: mọi đối tượng thuần Task 2–8.
- `appsscript.json`: `timeZone "Asia/Ho_Chi_Minh"`, `runtimeVersion "V8"`, `webapp {access: "ANYONE_ANONYMOUS", executeAs: "USER_DEPLOYING"}`, `oauthScopes`: spreadsheets, drive, script.external_request, script.send_mail, script.scriptapp, userinfo.email. `.clasp.json`: `{"scriptId": "DIEN_SAU_KHI_TAO", "rootDir": "gas"}`.
- `Main.gs`: `doGet(e)` chỉ phục vụ `?action=heThong.sucKhoe`; `doPost(e)` parse `e.postData.contents` → `DieuPhoi.xuLy(yeuCau, nguCanh)` → `ContentService` JSON; `nguCanh.handlers` lắp từ `XacThuc.HANDLERS`, `DanhMucGas.HANDLERS`, `LichDem.HANDLERS` (Task 10); `nguCanh.layPhien = XacThuc.layPhien`; `nguCanh.bayGioIso = KhoDuLieu.bayGioIso()`.
- `KhoDuLieu`: `idFile(tenFile)` đọc `PropertiesService` khóa `ID_<tenFile>`; `docBang(tenBang) → banGhi[]` (cache trong một lần chạy); `themDong(tenBang, banGhi, phien) → banGhi` (gán `taoLuc, taoBoi, capNhatLuc, capNhatBoi, tinhTrang='Hoạt động'`, sinh mã qua `capMa(tenBang)` nếu `dinhDangMa !== 'TU_NHAP'`, kiểm tra `Bang.kiemTra`, ghi dưới `LockService` 30 giây, ghi `NhatKy` hành động `THEM`); `capNhatDong(tenBang, ma, thayDoi, phien, canCu) → banGhi` (tìm dòng theo khóa chính, ghi `NhatKy` `SUA` với khác biệt); `capMa(tenBang)` dùng sheet `BoDem` (`tienTo, nam, soHienTai`) dưới khóa; `bayGioIso()`; `themDongThang(tenBang, banGhi)` cho nhật ký (không khóa, không kiểm tra).
- `XacThuc.HANDLERS`: `xacThuc.dangNhapGoogle({idToken, thietBi})` → `UrlFetchApp` tới `https://oauth2.googleapis.com/tokeninfo?id_token=` → `Phien.kiemTraTheGoogle` → tìm `DM_NguoiDung` theo `email` và `trangThai = Hoạt động` (không có → ném `KHONG_CO_QUYEN` "Email chưa được cấp tài khoản") → tạo phiên, lưu `PhienDangNhap` + `CacheService` 21.600 giây, thu hồi phiên thứ 6 → trả `{maPhien, nguoiDung (đã ẩn), hetHanLuc}`; `xacThuc.dangNhapMatKhau({tenDangNhap, matKhau, thietBi})` kiểm tra `khoaDen`, `MatKhau.khop`, cập nhật `soLanSai`, `khoaDen`, `lanDangNhapCuoi`; `xacThuc.dangXuat`; `xacThuc.doiMatKhau({matKhauCu, matKhauMoi})` → `MatKhau.datYeuCau`, muối mới, `batBuocDoiMatKhau = false`; `heThong.khoiDong()` → `{nguoiDung, soDoDanhMuc (bảng nhóm danhmuc với cột không `an`), cauHinh}`; `heThong.sucKhoe()` → `{phienBan, gio, saoLuuCuoi, toanVenCuoi}`; `XacThuc.layPhien(maPhien)` cache rồi sheet.
- `DanhMucGas.HANDLERS`: `danhMuc.doc({bang})` chỉ bảng nhóm danhmuc, trả bản ghi không `Xóa mềm` đã ẩn cột nhạy cảm; `danhMuc.them({bang, banGhi})`; `danhMuc.sua({bang, ma, thayDoi, canCu})`; `danhMuc.ngung({bang, ma, lyDo})` đặt `tinhTrang='Ngừng'`; `nguoiDung.doc/them/sua` (không nhận `matKhauBam`, `muoi` từ ngoài; `them` sinh mật khẩu tạm 10 ký tự, đặt `batBuocDoiMatKhau = true`, trả mật khẩu tạm một lần); `nguoiDung.datLaiMatKhau({ma})`; `nhatKy.doc({bang, ma, gioiHan = 200})` trả mới nhất trước.

- [ ] **Bước 1: Viết sáu file theo Interfaces.** Mỗi hàm bắt đầu bằng chú thích tiếng Việt một dòng. Không có kiểm thử Node cho lớp này; kiểm thử ở Task 13 bằng `scripts/kiem-tra-api.mjs` trên bản triển khai thật.
- [ ] **Bước 2: Kiểm tra cú pháp** — `for f in gas/Main.gs gas/ketnoi/*.gs; do node --check <(sed 's/^/ /' "$f") || echo "LOI $f"; done` (các file chỉ dùng cú pháp JS chuẩn nên `node --check` áp dụng được); mong đợi không dòng `LOI`.
- [ ] **Bước 3: Chạy lại toàn bộ test thuần** — `npm test` → PASS (lớp kết nối không làm hỏng lớp thuần vì không nằm trong `thuan/`).
- [ ] **Bước 4: Commit** `feat: lớp kết nối Apps Script — API một cửa, kho dữ liệu, xác thực, danh mục`.

---

### Task 10: `LichDem` và `ThietLap`

**Files:**
- Create: `gas/ketnoi/LichDem.gs`, `gas/ketnoi/ThietLap.gs`

**Interfaces:**
- `ThietLap.thietLapLanDau({emailQuanTri, hoTenQuanTri})`: chạy một lần từ trình soạn Apps Script; tạo ba spreadsheet theo `SoDo.FILE`, mỗi bảng một sheet với hai dòng tiêu đề từ `Bang.dongTieuDe`, định dạng cột `text` là chữ thuần (`setNumberFormat('@')`), đóng băng hai dòng đầu; lưu ID vào `PropertiesService` (`ID_HTTD3_DanhMuc`...); tạo thư mục Drive `HTTD3/` với con `MinhChung, SaoLuu, XuatDuLieu, HopThuClaude/ChoNhap, HopThuClaude/DaNhap, HopThuClaude/KetQua` và lưu `ID_THU_MUC_*`; gieo `DuLieuGieo.BANG` và `DM_CauTruc`; tạo người dùng QUANTRI đầu tiên với `email = emailQuanTri`, `tenDangNhap = 'quantri'`, mật khẩu tạm in ra log một lần; sinh `KHOA_API_CLAUDE` ngẫu nhiên lưu `PropertiesService`; gọi `LichDem.caiDatLich()`; idempotent (chạy lại không tạo trùng, chỉ thêm sheet còn thiếu).
- `ThietLap.kiemTraThietLap() → {thieu: string[]}` để `heThong.sucKhoe` báo thiếu.
- `LichDem.saoLuuHangDem()`: với mỗi file `SoDo.FILE`, `DriveApp.getFileById(id).makeCopy(SaoLuu.tenFile(ten, homNay), thuMucSaoLuu)`; xóa theo `SaoLuu.canXoa`; ghi dòng `SaoLuu`; lỗi thì ghi `ketQua='LOI'` và `MailApp` tới `emailQuanTri` trong `CauHinh`. `LichDem.kiemTraToanVenHangDem()`: đọc mọi bảng danh mục và nghiệp vụ → `ToanVen.kiemTra` → ghi `KiemTraToanVen` (dòng tổng kết kèm từng lệch) → email nếu có lệch. `LichDem.caiDatLich()`: xóa trigger cũ của hai hàm, tạo mới `atHour(1)` và `atHour(2)` `everyDays(1)`. `LichDem.HANDLERS`: `lich.chayNgay({ten})` cho QUANTRI chạy tay một trong hai việc và trả kết quả.

- [ ] **Bước 1: Viết hai file.** **Bước 2: `node --check` như Task 9.** **Bước 3: Commit** `feat: thiết lập lần đầu, sao lưu và toàn vẹn hằng đêm`.

---

### Task 11: Giao diện — token, khung, API, đăng nhập

**Files:**
- Create: `web/index.html`, `web/config.js`, `web/css/token.css`, `web/css/app.css`, `web/js/api.js`, `web/js/ui.js`, `web/js/dang-nhap.js`, `web/js/app.js`, `web/test/may-chu-gia.mjs`, `web/test/dang-nhap.test.mjs`

**Interfaces:**
- `config.js`: `window.HTTD3_CONFIG = { API_URL: 'DIEN_SAU_KHI_TRIEN_KHAI', GOOGLE_CLIENT_ID: 'DIEN_SAU_KHI_TAO' }`; trang ưu tiên `config.local.js` nếu có (cho kiểm thử).
- `api.js`: `goiApi(action, duLieu) → Promise<duLieu>`; POST `text/plain` JSON `{phien, action, duLieu}` với `phien` từ `localStorage['httd3.phien']`; `{ok:false}` thì ném `Error` có `ma`; `PHIEN_HET_HAN` thì phát sự kiện `httd3:het-han` (không xóa dữ liệu biểu mẫu đang mở).
- `ui.js`: `thongBao(noiDung, loai)`, `moTamTruot(tieuDe, phanTu)`, `dongTamTruot()`, `veBang({cot, dong, khiBamDong})`, `veBieuMau({cot, banGhi, thamChieu}) → {phanTu, layGiaTri()}`, `oSo(nhan, giaTri, muc)`.
- `dang-nhap.js`: `veManDangNhap(goc)`: nút Google (GIS `google.accounts.id.initialize({client_id, callback: xuLyTheGoogle})` + `renderButton`), biểu mẫu tên và mật khẩu; `xuLyTheGoogle({credential})` gọi `xacThuc.dangNhapGoogle`; sau đăng nhập lưu phiên và người dùng, phát `httd3:da-dang-nhap`; nếu `batBuocDoiMatKhau` thì mở ngay biểu mẫu đổi mật khẩu.
- `app.js`: định tuyến theo `location.hash` (`#/hom-nay`, `#/danh-muc`, `#/quan-tri`, `#/nhat-ky`), thanh điều hướng dưới (≤ 768 px) hoặc bên trái, mục menu theo vai trò; nghe `httd3:het-han` để mở tấm trượt đăng nhập lại rồi gửi lại hành động đang chờ.
- `token.css`: token ba tầng theo thiết kế §9.2 (gốc `--blue-600 #2563eb`, `--gray-50..900`, `--red-600 #dc2626`, `--amber-600 #d97706`, `--green-600 #16a34a`, `--violet-600 #7c3aed`, `--space-1..8` bước 4 px, `--font-size-xs 12px .. --font-size-xl 24px`, `--radius-sm 6px/md 10px/lg 14px`; ngữ nghĩa `--color-bg-page, --color-bg-surface, --color-text-primary, --color-text-secondary, --color-action-primary, --color-border-default, --color-border-focus, --color-status-overdue, --color-status-due-soon, --color-status-done, --color-status-pending, --color-status-claude`); bản tối dưới `@media (prefers-color-scheme: dark)` và `:root[data-theme="dark"]`; phông Inter từ Google Fonts.
- `may-chu-gia.mjs`: `khoiDong({cong}) → {url, dung()}`: phục vụ tĩnh thư mục `web/` (ghi đè `config.js` bằng `{API_URL: url + '/api', GOOGLE_CLIENT_ID: 'TEST'}`) và `/api` POST với kho trong bộ nhớ, tài khoản `quantri` / `Abc12345`, hành vi: đăng nhập sai 5 lần → `KHONG_CO_QUYEN` "Tài khoản bị khóa 15 phút"; phiên `'het'` → `PHIEN_HET_HAN`; `danhMuc.*`, `nguoiDung.*`, `nhatKy.doc`, `heThong.khoiDong` theo hợp đồng Task 9 với `soDoDanhMuc` lấy từ `SoDo` thật qua `taiThuan()`.

- [ ] **Bước 1: Viết test thất bại** `web/test/dang-nhap.test.mjs` (Playwright, `chromium.launch()`, viewport 360×740)

```js
test('đăng nhập mật khẩu sai rồi đúng, vào màn Hôm nay', async () => { /* mở url; điền 'quantri'/'sai' → thấy thông báo lỗi; điền 'Abc12345' → location.hash === '#/hom-nay'; thanh điều hướng dưới hiển thị (bounding box y > 600); localStorage có 'httd3.phien' */ });
test('thẻ Google qua callback giả', async () => { /* page.evaluate(() => window.__httd3.xuLyTheGoogle({credential:'TOKEN_OK'})) → đã đăng nhập; 'TOKEN_LA' → thông báo "Email chưa được cấp tài khoản" */ });
test('phiên hết hạn giữa chừng giữ dữ liệu đang nhập', async () => { /* đăng nhập; đặt localStorage phiên = 'het'; mở #/quan-tri đổi mật khẩu, gõ vào ô; gửi → tấm trượt đăng nhập lại hiện; đăng nhập → ô vẫn còn giá trị và yêu cầu được gửi lại thành công */ });
```

- [ ] **Bước 2: Chạy, xác nhận thất bại** — `npm run test:web` → FAIL (trang chưa tồn tại).
- [ ] **Bước 3: Viết các file theo Interfaces.** Màn Hôm nay giai đoạn 1 chỉ có bốn ô số đọc từ `heThong.sucKhoe` và lời chào.
- [ ] **Bước 4: Chạy, xác nhận đạt** — `npm run test:web` → PASS; chụp ảnh 360 px và 1280 px vào `web/test/anh/` để người xem lại kiểm tra bằng mắt.
- [ ] **Bước 5: Commit** `feat: giao diện khung, token, đăng nhập hai cách, máy chủ giả`.

---

### Task 12: Giao diện — Danh mục chung, Người dùng, Nhật ký, Quản trị

**Files:**
- Create: `web/js/danh-muc.js`, `web/js/quan-tri.js`, `web/test/danh-muc.test.mjs`
- Modify: `web/js/app.js` (đăng ký tuyến)

**Interfaces:**
- `danh-muc.js`: `veManDanhMuc(goc, soDoDanhMuc)`: cột trái danh sách bảng (tên hiển thị tiếng Việt lấy từ `SoDo.BANG[t].ten`; Task 2 bổ sung trường `ten` cho mỗi bảng nếu chưa có), cột phải `veBang` với cột không `an`; nút "Thêm" → `veBieuMau` trong tấm trượt (ô `ref`/`multiselect` nạp bảng tham chiếu qua `danhMuc.doc` có cache); lưu → `danhMuc.them` hoặc `danhMuc.sua` kèm ô "Căn cứ" bắt buộc khi sửa; nút "Ngừng" hỏi lý do; tab "Nhật ký" của bản ghi gọi `nhatKy.doc({bang, ma})`.
- `quan-tri.js`: `veManQuanTri(goc)`: thẻ Người dùng (bảng + thêm + đặt lại mật khẩu hiển thị mật khẩu tạm một lần + khóa), thẻ Sức khỏe (từ `heThong.sucKhoe`, hai nút "Chạy sao lưu ngay", "Chạy kiểm tra toàn vẹn ngay" gọi `lich.chayNgay`), thẻ Đổi mật khẩu của tôi.

- [ ] **Bước 1: Viết test thất bại** `web/test/danh-muc.test.mjs`

```js
test('thêm một lĩnh vực và thấy dòng nhật ký', async () => { /* đăng nhập quantri; #/danh-muc; chọn "Lĩnh vực"; Thêm; điền maLinhVuc 'ATTT', tenLinhVuc 'An toàn thông tin'; Lưu; bảng có dòng ATTT; mở dòng → tab Nhật ký có hành động THEM */ });
test('sửa yêu cầu căn cứ và ngừng yêu cầu lý do', async () => { /* mở ATTT; sửa tên không điền căn cứ → báo lỗi tại ô Căn cứ; điền → lưu được; Ngừng → hộp lý do → dòng chuyển tinhTrang Ngừng */ });
test('người dùng: thêm trả mật khẩu tạm một lần, vai trò DONVI không thấy menu Danh mục', async () => { /* #/quan-tri thêm người dùng vai trò DONVI, đơn vị DV04 → thấy mật khẩu tạm; đăng xuất; đăng nhập bằng tài khoản mới → bị yêu cầu đổi mật khẩu → đổi → menu không có "Danh mục" */ });
test('trên 1280 px thanh bên trái, bảng có cột cố định', async () => { /* viewport 1280×800; nav nằm bên trái (x < 300); cuộn ngang bảng, cột mã vẫn thấy */ });
```

- [ ] **Bước 2: Chạy, thất bại.** **Bước 3: Viết theo Interfaces.** **Bước 4: Chạy, đạt; cập nhật ảnh chụp.** **Bước 5: Commit** `feat: màn Danh mục chung, Người dùng, Nhật ký, Quản trị`.

---

### Task 13: Tài liệu vận hành, công cụ kiểm tra API, nghiệm thu giai đoạn 1

**Files:**
- Create: `scripts/kiem-tra-api.mjs`, `docs/van-hanh/01-google-cloud-client-id.md`, `docs/van-hanh/02-trien-khai-apps-script.md`, `docs/van-hanh/03-github-pages.md`, `docs/van-hanh/04-nghiem-thu-giai-doan-1.md`

**Interfaces:**
- `scripts/kiem-tra-api.mjs <API_URL> <tenDangNhap> <matKhau>`: gọi `heThong.sucKhoe` (GET), `xacThuc.dangNhapMatKhau`, `heThong.khoiDong`, `danhMuc.doc DM_DonVi` (mong 36 dòng), `danhMuc.them` một lĩnh vực thử rồi `danhMuc.ngung`, `nhatKy.doc` (mong có 2 dòng mới), `xacThuc.dangXuat`; in bảng ĐẠT/LỖI từng bước, thoát mã 1 nếu có LỖI. Chạy từ máy Mr. Nobody (phiên đám mây không gọi được Apps Script).
- Tài liệu 01: từng màn hình tạo dự án Google Cloud (không bật thanh toán), màn hình đồng ý OAuth loại Bên ngoài với ba phạm vi cơ bản, trạng thái Đang hoạt động, tạo Client ID ứng dụng web với nguồn `https://<tên>.github.io`, dán vào `web/config.js`. Tài liệu 02: cài Node và clasp trên máy, `clasp login`, tạo dự án Apps Script độc lập, điền `scriptId` vào `.clasp.json`, `clasp push`, chạy `ThietLap.thietLapLanDau` với email của Mr. Nobody trong trình soạn, đọc mật khẩu tạm trong log, `clasp deploy` kiểu web app, dán URL `/exec` vào `web/config.js`, chạy `scripts/kiem-tra-api.mjs`. Tài liệu 03: bật GitHub Pages từ thư mục `/web` nhánh `main`, kiểm tra địa chỉ. Tài liệu 04: bảng kiểm nghiệm thu đúng thiết kế §12 giai đoạn 1 với cột Kết quả để Mr. Nobody điền: đăng nhập Google trên điện thoại; đăng nhập mật khẩu trên điện thoại; thêm và sửa một lĩnh vực, thấy nhật ký; chạy sao lưu ngay và thấy file trong `HTTD3/SaoLuu`; sáng hôm sau thấy bản sao lưu 01:00 và dòng toàn vẹn 02:00; hai người cùng thêm bản ghi vào một bảng không mất dòng; tắt mạng điện thoại khi đang lưu → thông báo lỗi rõ, bật lại lưu được.

- [ ] **Bước 1: Viết `scripts/kiem-tra-api.mjs` và bốn tài liệu.**
- [ ] **Bước 2: Thử tài liệu bằng cách đọc lại dưới vai một người chưa từng dùng Apps Script; mỗi bước phải có tên nút hoặc menu chính xác và ảnh hoặc mô tả vị trí.**
- [ ] **Bước 3: Commit** `docs: tài liệu vận hành và bảng kiểm nghiệm thu giai đoạn 1`.
- [ ] **Bước 4 (việc của Mr. Nobody, Claude hướng dẫn trực tiếp từng bước):** thực hiện tài liệu 01 → 02 → 03, chạy `scripts/kiem-tra-api.mjs` → mọi bước ĐẠT; điền bảng kiểm 04.
- [ ] **Bước 5: Sửa lỗi phát hiện khi nghiệm thu theo quy trình thường (test thất bại → sửa → đạt → commit).** Giai đoạn 1 kết thúc khi bảng kiểm 04 không còn ô LỖI và Mr. Nobody duyệt.

---

## Tự rà soát (đã làm khi viết)

- **Phủ thiết kế:** §5 kiến trúc (Task 9, 11); §6 đăng nhập và vai trò (Task 5, 6, 9, 11, 12); §7.1 nguyên tắc (Task 2, 3, 9); §7.2, Phụ lục A danh mục (Task 2, 8, 12); §7.3 bảng nghiệp vụ tạo sẵn (Task 2, 10); §7.4 trạng thái, mức độ (Task 8); §8.7 quản trị, sao lưu, toàn vẹn, sức khỏe (Task 7, 10, 12); §9 giao diện và token (Task 11, 12); §10 bảo mật (Task 5, 6, 9); §12 giai đoạn 1 và vòng phát triển hai lớp (Task 1, 9, 13). Ngoài phạm vi giai đoạn 1, để giai đoạn sau: nhiệm vụ, chỉ tiêu, minh chứng, báo cáo, cổng Claude, chuyển đổi.
- **Nhất quán tên:** `taiThuan`, `SoDo.BANG/FILE/khoaChinh/danhSachBang/dongTieuDe`, `Bang.tuMaTran/thanhDong/kiemTra/anCotNhayCam`, `MaSo.sinh/hopLe`, `Phien.tao/conHan/gioiHan/kiemTraTheGoogle`, `DieuPhoi.xuLy`, `KhoDuLieu.docBang/themDong/capNhatDong/capMa`, `XacThuc.HANDLERS/layPhien`, `DanhMucGas.HANDLERS`, `LichDem.HANDLERS/caiDatLich`, `goiApi`, mã lỗi và tên action dùng thống nhất ở Task 6, 9, 11, 12, 13.
- **Review Focus:** mục 1 → Task 3 test "0123" và xuống dòng; mục 2 → Task 11 test `TOKEN_LA`; mục 3 → Task 4 và bảng kiểm Task 13; mục 4 → Task 11 test phiên hết hạn; mục 5 → bảng kiểm Task 13 (không kiểm thử tự động được trong môi trường này).
- **Tỷ lệ:** kế hoạch ngắn hơn thiết kế; các bước chỉ nêu chữ ký, giá trị cố định và phép thử; thân hàm để người thực hiện viết.
