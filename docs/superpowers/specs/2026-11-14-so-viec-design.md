# BẢN THIẾT KẾ: SỔ VIỆC CÁ NHÂN (webapp quản lý công việc phát sinh)

Ngày: 14/11/2026 · Phiên bản: 0.2 · **TRẠNG THÁI: ĐÃ GỘP** vào bản thiết kế hệ thống mới `2026-11-14-httd3-design.md` (phân hệ Nhiệm vụ thường xuyên và màn Việc của tôi). Giữ lại để tra cứu lý do và các quyết định ban đầu. · Người dùng: Mr. Nobody, chuyên viên Phòng Văn hóa – Xã hội, UBND xã Phước Hải

---

## 1. Ý định và lý do

Mỗi ngày Mr. Nobody nhận nhiều việc ở bốn lĩnh vực (cải cách hành chính, chuyển đổi số, khoa học công nghệ và đổi mới sáng tạo, tiêu chuẩn đo lường và sở hữu trí tuệ). Hệ thống theo dõi HTTD 2.0 đang vận hành chỉ bao quát nhiệm vụ nằm trong các kế hoạch đã ban hành (KH09 CCHC, KH92, KHDTI, KHNQ57). Việc phát sinh hằng ngày (văn bản đến, chỉ đạo của lãnh đạo, kết luận cuộc họp) hiện không có chỗ ghi nhận, nên:

- khó biết đơn vị nào còn nợ đầu vào để đôn đốc;
- cuối tuần, cuối tháng phải nhớ lại để viết báo cáo; ở báo cáo tuần 07–13/11/2026, mục "nhiệm vụ trọng tâm tuần tới" của lĩnh vực CCHC, KHCN ĐMST và CĐS để trống trong khi các lĩnh vực khác có nội dung.

Sổ việc là nơi duy nhất ghi mọi việc của cá nhân Mr. Nobody: việc phát sinh (ghi mới) và nhiệm vụ kế hoạch (đọc từ HTTD). Claude là "cổng vào" chính: Mr. Nobody gửi văn bản, Claude trích xuất việc và ghi thẳng vào sổ.

## 2. Mục tiêu, không phải mục tiêu, phản mục tiêu

**Mục tiêu**

1. Một màn hình thấy hết việc của mình, trên máy tính lẫn điện thoại.
2. Nhập việc mới trong dưới 30 giây (tay) hoặc không tốn công (Claude ghi).
3. Mỗi việc tách được các đơn vị phải cung cấp đầu vào, theo dõi đã nhận hay chưa, và lập danh sách cần nhắc kèm tin nhắn soạn sẵn để dán Zalo.
4. Bấm một nút ra đoạn văn báo cáo tuần, tháng đúng cấu trúc của Phòng VHXH, kể cả phần "tuần tới".
5. Dữ liệu có bản sao trên Google Sheets để sao lưu, tra cứu bằng Excel.

**Không phải mục tiêu**

- Không thay thế HTTD 2.0. Không sửa dữ liệu HTTD. Các đơn vị không dùng sổ việc.
- Không gửi Zalo, email tự động. Không kết nối Hệ thống quản lý văn bản và điều hành của Thành phố.
- Không quản lý tài liệu (file vẫn nằm trên Drive, sổ việc chỉ giữ link).

**Phản mục tiêu** (thành công về kỹ thuật vẫn là thất bại nếu xảy ra)

- Phải nhập một việc hai lần (sổ việc và HTTD).
- Thời gian nuôi sổ việc lớn hơn thời gian nó tiết kiệm.
- Mất dữ liệu vì chỉ có một nơi lưu.

## 3. Ràng buộc

- Người dùng duy nhất là Mr. Nobody; artifact giữ chế độ riêng tư, không chia sẻ.
- Kết nối Google Drive trên claude.ai chỉ đọc Sheets và tạo file mới, không ghi ô vào Sheet đang có. Phiên Claude trên đám mây không gọi được Apps Script (script.google.com bị chặn). Trình duyệt của Mr. Nobody gọi Apps Script bình thường.
- Zalo không có API cho tài khoản cá nhân: "gửi Zalo" nghĩa là sao chép nội dung soạn sẵn rồi dán.
- Cơ sở dữ liệu artifact: mỗi tài liệu tối đa 256 KiB, toàn bộ tối đa 25.000 tài liệu, truy vấn lọc trên trường cấp một, không giao dịch, ghi sau thắng.
- Trang web tải thư viện ngoài chỉ từ cdnjs.cloudflare.com, cdn.jsdelivr.net/npm, unpkg.com; phông chữ từ Google Fonts.
- Mr. Nobody mới bắt đầu lập trình: mã nguồn Apps Script phải ngắn, có chú thích tiếng Việt từng bước.

## 4. Các cách đã cân nhắc

| Cách | Mô tả | Được | Mất |
|---|---|---|---|
| 1. Sheets + Apps Script riêng | Web app Apps Script, dữ liệu trong Sheets | Cùng công nghệ HTTD, tự sửa được, dữ liệu trong Drive | Giao diện tải chậm, phải dựng từ đầu, Claude không ghi trực tiếp được từ đám mây |
| 2. Mở rộng trong HTTD | Thêm tab "Việc của tôi" vào index_v2_1.html + Code_v2.gs | Một chỗ, dùng chung danh mục | HTTD là hệ thống nhiều người dùng có kiểm tra toàn vẹn hằng đêm; mỗi lần sửa có rủi ro cho đơn vị khác |
| 3. Trang web trên claude.ai có CSDL riêng | Artifact với `db` | Claude ghi trực tiếp, nhanh, đẹp, chạy tốt trên điện thoại | Dữ liệu trên claude.ai, không đọc HTTD trực tiếp |
| **Kết hợp 3 + 1 (đã chọn)** | Artifact là giao diện và CSDL chính; một Apps Script "cầu nối" đọc HTTD và ghi bản sao vào Sheets | Giữ ưu điểm của 3, bù nhược điểm bằng 1, không đụng HTTD | Hai nơi phải bảo trì (artifact và cầu nối) |

Mr. Nobody chọn cách kết hợp ngày 14/11/2026 sau khi xem sơ đồ và luồng một ngày làm việc.

## 5. Kiến trúc tổng thể

```
Văn bản được giao (PDF/DOCX/ảnh)
   │
   ├─ Đường A (giai đoạn 1): gửi trong phiên Claude ─► Claude chạy skill trích xuất nhiệm vụ,
   │     phân công đơn vị ─► ghi vào CSDL artifact bằng công cụ ArtifactData (trạng thái "chờ xác nhận")
   └─ Đường B (giai đoạn 3): dán nội dung vào webapp ─► nút "Trích xuất" gọi Claude trong trang (sample)
         ─► xem trước ─► lưu
                      │
          ┌───────────▼─────────────────────────────┐
          │  WEBAPP "Sổ việc" (artifact trên claude.ai)│
          │  CSDL riêng (db): viec, yeucau, donvi,     │
          │  linhvuc, baocao, cauhinh                  │
          └───┬──────────────────────┬─────────────────┘
              │ GET (chỉ đọc)        │ POST bản sao khi lưu (giai đoạn 2)
   ┌──────────▼──────────────────────▼─────────────┐
   │  APPS SCRIPT "Cầu nối" (dự án độc lập, chạy    │
   │  dưới tài khoản Mr. Nobody, triển khai "Anyone",│
   │  bảo vệ bằng token)                             │
   │   doGet  action=viecCuaToi → đọc HTTD DM_NhiemVu│
   │   doPost action=luu        → ghi Sheet "SoViec" │
   └──────────┬──────────────────────┬───────────────┘
   ┌──────────▼───────┐   ┌──────────▼──────────────┐
   │ HTTD 2.0 (không  │   │ Google Sheet "SoViec"    │
   │ sửa gì)          │   │ Viec, YeuCau, BaoCao,    │
   └──────────────────┘   │ NhatKy; sao lưu hằng đêm │
                          └─────────────────────────┘
   Menu HTTD: thêm một mục "Việc của tôi" là link mở webapp (một dòng HTML, giai đoạn 2)
```

Lý do dùng Apps Script độc lập thay vì thêm hàm vào HTTD: không phải triển khai lại HTTD, không phụ thuộc chế độ truy cập hiện tại của HTTD, dễ thu hồi.

## 6. Mô hình dữ liệu (CSDL artifact)

Quy ước: tên trường viết camelCase tiếng Việt không dấu; ngày dạng `YYYY-MM-DD`; thời điểm dạng ISO 8601; mã trạng thái là chuỗi cố định (bên dưới).

### 6.1. `viec/{ma}` — một việc của Mr. Nobody

| Trường | Kiểu | Ghi chú |
|---|---|---|
| ma | chuỗi | `V-2026-0001`, tăng dần, cũng là id tài liệu |
| tieuDe | chuỗi ≤ 120 ký tự | dòng hiển thị trong danh sách |
| noiDung | chuỗi | yêu cầu chi tiết |
| linhVuc | mã | `CCHC`, `CDS`, `KHCN`, `TCDL_SHTT`, `TTTT`, `KHAC` (đọc từ `linhvuc`) |
| nguon | đối tượng | `{loai, soKyHieu, coQuanBanHanh, ngayBanHanh, trichYeu, linkFile}`; `loai` ∈ `van_ban`, `chi_dao`, `hop`, `tu_phat_sinh` |
| nguoiGiao | chuỗi | lãnh đạo hoặc cơ quan giao |
| ngayGiao | ngày | |
| hanXuLy | ngày | hạn của Mr. Nobody |
| uuTien | mã | `cao`, `thuong`, `thap` |
| loaiSanPham | mã | `bao_cao`, `cong_van`, `ke_hoach`, `quyet_dinh`, `to_trinh`, `gop_y`, `minh_chung`, `khac` |
| trangThai | mã | `cho_xac_nhan`, `chua_bat_dau`, `dang_lam`, `cho_dau_vao`, `cho_ky`, `hoan_thanh`, `huy` |
| ketQua | đối tượng | `{soKyHieu, ngayBanHanh, trichYeu, linkFile}` của văn bản đi hoặc sản phẩm |
| minhChung | mảng | `[{bo: "PAR"|"DTI", ma: "PAR-072"}]` |
| lienKetHTTD | chuỗi | mã nhiệm vụ trong HTTD nếu việc này phục vụ một nhiệm vụ kế hoạch |
| nhapTu | mã | `claude`, `tay`, `trang` |
| vuongMac | chuỗi | dùng cho mục khó khăn trong báo cáo |
| ghiChu | chuỗi | |
| nhatKy | mảng ≤ 50 phần tử | `{luc, hanhDong, chiTiet}`; cắt bớt phần tử cũ nhất khi vượt |
| taoLuc, capNhatLuc, hoanThanhLuc | thời điểm | |

Chuyển trạng thái hợp lệ: `cho_xac_nhan → chua_bat_dau | huy`; `chua_bat_dau → dang_lam | huy`; `dang_lam ↔ cho_dau_vao`; `dang_lam → cho_ky → hoan_thanh`; `dang_lam → hoan_thanh`; mọi trạng thái chưa hoàn thành → `huy`. Khi mọi `yeucau` của việc đã `da_nhan` và việc đang `cho_dau_vao`, trang gợi ý chuyển về `dang_lam` (không tự chuyển).

### 6.2. `yeucau/{ma}` — một đơn vị phải cung cấp đầu vào cho một việc

| Trường | Kiểu | Ghi chú |
|---|---|---|
| ma | chuỗi | `Y-2026-0001` |
| viecMa | chuỗi | khóa ngoài tới `viec` |
| donViMa | chuỗi | khóa ngoài tới `donvi` |
| donViTen | chuỗi | sao chép để hiển thị nhanh |
| noiDung | chuỗi | cần cung cấp gì |
| hanCungCap | ngày | |
| trangThai | mã | `chua_gui`, `da_gui`, `da_nhan`, `nhan_chua_dat` |
| ngayGui, ngayNhan | ngày | |
| lanNhacCuoi | thời điểm | |
| soLanNhac | số | tăng khi bấm "Đã nhắc" |
| ghiChu | chuỗi | |

Danh sách "Cần nhắc hôm nay" = `yeucau` có `trangThai ∈ {chua_gui, da_gui, nhan_chua_dat}` và (`hanCungCap` ≤ hôm nay + `nhacTruocHan` ngày hoặc đã quá hạn), sắp xếp quá hạn trước, nhóm theo đơn vị.

### 6.3. `donvi/{ma}` — danh mục đầu mối

Gieo từ bảng `1B_DM_DAUMOI` của HTTD (34 đầu mối: 7 cơ quan, đơn vị `DV01–DV07`; 16 trường `TH01–TH16`; 11 ấp `AP01–AP11`), bổ sung `DV08` Công an xã, `DV09` Ban Chỉ huy Quân sự xã (theo skill phân công đơn vị), và nhóm `NGOAI` cho cơ quan ngoài xã (Sở Khoa học và Công nghệ, Sở Nội vụ, Trung tâm Chuyển đổi số...) thêm dần khi dùng. Trường: `ma, tenDayDu, tenVietTat, nhom (DV|TH|AP|NGOAI), phanLoai, nguoiLienHe, dienThoai, dangHoatDong, thuTu`.

### 6.4. `linhvuc/{ma}` — danh mục lĩnh vực

Gieo sáu dòng: CCHC, CDS, KHCN (khoa học công nghệ, đổi mới sáng tạo), TCDL_SHTT (tiêu chuẩn đo lường chất lượng, sở hữu trí tuệ, an toàn bức xạ), TTTT (thông tin, truyền thông, an toàn thông tin), KHAC. Trường: `ma, ten, tenNgan, thuTu, mau`. Sửa được trong màn Cấu hình.

**Phạm vi sổ việc (Mr. Nobody chốt 14/11/2026):** sổ chỉ ghi việc thuộc **năm mảng** CCHC, CDS, KHCN, TCDL_SHTT, TTTT. Việc của các mảng khác trong Phòng VHXH (nội vụ, chính sách xã hội, văn hóa thể thao du lịch, dân tộc tôn giáo, giáo dục, y tế) do chuyên viên khác làm, không ghi vào sổ. Mã `KHAC` chỉ dùng khi lãnh đạo giao đích danh Mr. Nobody một việc ngoài năm mảng.

### 6.5. `baocao/{ma}` — báo cáo đã sinh

`ma` = `BC-TUAN-2026-46` hoặc `BC-THANG-2026-11`. Trường: `loai (tuan|thang), tuNgay, denNgay, noiDung (văn bản đã sinh, cho phép sửa tay rồi lưu lại), soViecHoanThanh, soViecTonDong, taoLuc`. Giữ lịch sử để so kỳ.

### 6.6. `cauhinh/chung` và `cauhinh/dem`

`chung`: `tenNguoiDung, emailPhuTrach (lọc HTTD), nhacTruocHan (mặc định 2 ngày), ngayDauTuan (mặc định thứ Bảy, vì báo cáo tuần của Phòng tính từ thứ Bảy đến thứ Sáu), mauTinNhac, mauTinNhacQuaHan, tenDonViKy ("Phòng Văn hóa – Xã hội"), cauNoiUrl (URL cầu nối, không chứa token)`.
`dem`: `{viec: 12, yeucau: 30, nam: 2026}` để sinh mã tăng dần; người dùng duy nhất nên ghi sau thắng chấp nhận được. Token cầu nối lưu trong `localStorage` của từng thiết bị, nhập một lần ở màn Cấu hình, không bao giờ đưa vào CSDL.

### 6.7. `httd/{Ma}` — bản chụp nhiệm vụ kế hoạch (giai đoạn 2)

Mỗi lần trang gọi cầu nối thành công, ghi đè các tài liệu `httd/{Ma}` với các cột trả về ở mục 7.6 cộng `capNhatLuc` (thời điểm chụp). Tài liệu có `Ma` không còn trong kết quả thì đánh dấu `daGo = true`, không xóa. Mục đích: bộ sinh báo cáo (7.5) đọc được nhiệm vụ kế hoạch ngay cả khi cầu nối tạm không gọi được, và có lịch sử để so kỳ. Quy mô: dưới 300 tài liệu.

### 6.8. Quy tắc truy cập

Khai báo `capabilities: {db: {rules: [{path: "", read: "admin", write: "admin"}]}, user: {}}`. Chỉ chủ sở hữu và người được mời làm Editor đọc, ghi. Nếu một ngày artifact bị chia sẻ nhầm theo link, người xem vẫn không đọc được dữ liệu.

## 7. Luồng nghiệp vụ

### 7.1. Claude ghi việc từ văn bản (đường A)

1. Mr. Nobody gửi văn bản (PDF, DOCX, ảnh) cho Claude trong một phiên bất kỳ có công cụ ArtifactData.
2. Claude chạy chuỗi skill hiện có: `phan-tich-trich-xuat-nhiem-vu` → `phan-cong-don-vi-ubnd-xa-phuoc-hai` (tra đơn vị) → nếu cần `de-xuat-xu-ly-nhiem-vu`.
3. Claude ánh xạ kết quả sang hợp đồng ghi (mục 7.2), đọc `cauhinh/dem` để cấp mã, ghi bằng một lệnh `batch` (tối đa 50 tài liệu), mọi việc ở `trangThai = cho_xac_nhan`, `nhapTu = claude`.
4. Claude trả lời bằng bảng tóm tắt: mã việc, tiêu đề, hạn, số yêu cầu đầu vào.
5. Mr. Nobody mở webapp, màn "Chờ xác nhận" hiện các việc mới; sửa gì cần sửa, bấm Xác nhận (chuyển `chua_bat_dau`) hoặc Bỏ.

Sản phẩm kèm theo của giai đoạn 1: một skill `ghi-viec-vao-so-viec` (SKILL.md) mô tả đúng các bước trên và hợp đồng ghi, để mọi phiên Claude sau này làm giống nhau. Mr. Nobody đưa skill vào bộ skill đồng bộ của mình.

### 7.2. Hợp đồng ghi (JSON Claude tạo ra)

```json
{
  "nguon": {"loai": "van_ban", "soKyHieu": "1234/SKHCN-BCVT", "coQuanBanHanh": "Sở Khoa học và Công nghệ",
            "ngayBanHanh": "2026-11-12", "trichYeu": "V/v báo cáo ...", "linkFile": "https://drive.google.com/..."},
  "viec": [
    {"tieuDe": "Báo cáo kết quả sử dụng Nền tảng tích hợp, chia sẻ dữ liệu",
     "noiDung": "...", "linhVuc": "CDS", "hanXuLy": "2026-11-20", "uuTien": "cao",
     "loaiSanPham": "bao_cao", "minhChung": [{"bo": "DTI", "ma": "DTI-29"}],
     "yeucau": [
       {"donViMa": "DV01", "noiDung": "Số liệu tài khoản LGSP đã cấp", "hanCungCap": "2026-11-18"},
       {"donViMa": "DV04", "noiDung": "Số hồ sơ khai thác dữ liệu dùng chung", "hanCungCap": "2026-11-18"}
     ]}
  ]
}
```

Quy tắc ánh xạ (Mr. Nobody chốt 14/11/2026):

1. **Bộ lọc mảng:** chỉ những dòng thuộc năm mảng CCHC, CDS, KHCN, TCDL_SHTT, TTTT mới thành `viec`. Dòng giao PVHXH nhưng thuộc mảng khác (nội vụ, y tế, giáo dục...) Claude **không ghi**, mà liệt kê trong câu trả lời dưới tiêu đề "Việc thuộc mảng khác, đề nghị chuyển đồng nghiệp" để Mr. Nobody chuyển tiếp. `linhVuc = KHAC` chỉ khi văn bản hoặc lãnh đạo giao đích danh Mr. Nobody.
2. Mỗi dòng Bảng Nhóm A (xã trực tiếp thực hiện) qua được bộ lọc thành một `viec`; dòng mà đơn vị khác chủ trì nhưng PVHXH phối hợp trong năm mảng thành một `viec` loại `gop_y` hoặc `khac` kèm ghi chú.
3. Đơn vị phối hợp của mỗi dòng thành các `yeucau`. Hạn gốc trong văn bản thành `hanXuLy`; hạn của `yeucau` mặc định sớm hơn `hanXuLy` hai ngày làm việc.
4. Mỗi lần ghi, Claude kết thúc bằng hai bảng: việc đã ghi vào sổ, và việc thuộc mảng khác (không ghi).

### 7.3. Nhập tay nhanh

Nút "+" luôn hiện. Biểu mẫu tối thiểu ba trường: tiêu đề, lĩnh vực, hạn. Các trường khác mở rộng khi cần. Lưu xong có thể thêm yêu cầu đầu vào ngay bằng một dòng: chọn đơn vị, gõ nội dung, chọn hạn.

### 7.4. Đầu vào và đôn đốc

- Trong chi tiết việc: bảng các đơn vị, mỗi dòng có trạng thái, hạn, nút "Đã gửi yêu cầu", "Đã nhận", "Nhận chưa đạt", "Đã nhắc".
- Màn "Cần nhắc": nhóm theo đơn vị; mỗi đơn vị một tin nhắn gộp mọi việc còn nợ, soạn theo `mauTinNhac`; nút "Sao chép" rồi "Đã nhắc" (ghi `lanNhacCuoi`, tăng `soLanNhac`).
- Mẫu tin nhắn mặc định: "Kính gửi {donVi}, Phòng Văn hóa – Xã hội đề nghị đơn vị cung cấp: {danhSach} (phục vụ {tieuDeViec}, theo {soKyHieuVBGoc}). Hạn gửi: {han}. Trân trọng cảm ơn." Quá hạn thêm câu: "Đến nay Phòng chưa nhận được, mong đơn vị gửi sớm để kịp tổng hợp."

### 7.5. Báo cáo tuần, tháng

- Kỳ tuần: từ `ngayDauTuan` tuần trước đến ngày trước `ngayDauTuan` tuần này (mặc định thứ Bảy → thứ Sáu, đúng báo cáo tuần 07–13/11/2026). Kỳ tháng: ngày 1 đến ngày cuối tháng. Cho phép chỉnh hai ngày trước khi sinh.
- Cấu trúc sinh ra, đúng mục của báo cáo Phòng VHXH:
  - *Công tác cải cách hành chính, phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số* (tiêu đề cố định).
  - a) Đã hoàn thành trong kỳ: việc có `hoanThanhLuc` trong kỳ, gom theo `loaiSanPham` thành câu "Tham mưu trình UBND xã các báo cáo: ...; các văn bản: ...; tham mưu tổng hợp, cung cấp hồ sơ minh chứng ...". Mỗi việc ghi `tieuDe`, kèm số ký hiệu và ngày của `ketQua` nếu có.
  - b) Tồn đọng, giải pháp: việc quá `hanXuLy` chưa hoàn thành, kèm `vuongMac`.
  - Nhiệm vụ trọng tâm kỳ tới: việc có `hanXuLy` trong 7 ngày (tuần) hoặc trong tháng tới, cộng việc `dang_lam`, `cho_dau_vao`, `cho_ky`.
  - Khó khăn, vướng mắc: tổng hợp `yeucau` quá hạn theo đơn vị.
- **Báo cáo tháng** (Mr. Nobody chốt 14/11/2026): dùng cùng khung với báo cáo tuần, thay "tuần tới" bằng "tháng tới"; kỳ tới là tháng kế tiếp. Nếu sau này Phòng có mẫu riêng, bổ sung một mẫu thứ hai trong `cauhinh`.
- **Cách gom** (Mr. Nobody chốt 14/11/2026): cả năm mảng gộp vào một tiểu mục "Công tác cải cách hành chính, phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số"; trong tiểu mục gom câu theo `loaiSanPham` (các báo cáo; các văn bản; minh chứng; khác), không tách theo mảng. Trong mỗi nhóm sản phẩm, sắp theo mảng rồi theo ngày hoàn thành để người đọc vẫn thấy mạch.
- **Gộp nhiệm vụ kế hoạch HTTD** (Mr. Nobody chốt 14/11/2026, hiệu lực từ giai đoạn 2): bộ sinh báo cáo đọc thêm `httd/{Ma}`.
  - Vào mục a) khi `TrangThai` của bản chụp là hoàn thành và thời điểm chuyển sang hoàn thành (so sánh hai bản chụp liên tiếp, hoặc `CapNhatCuoi` nếu HTTD trả) rơi trong kỳ.
  - Vào mục "kỳ tới" khi `ThoiHan` rơi trong kỳ tới hoặc `TrangThai` là đang thực hiện.
  - **Khử trùng:** nếu có `viec` với `lienKetHTTD = Ma` thì chỉ hiện `viec` (giàu thông tin hơn), bỏ dòng HTTD.
  - Dòng từ HTTD ghi theo `NoiDung` của nhiệm vụ, kèm mã kế hoạch (`MaKH`) trong ngoặc.
- Kết quả hiện trong ô văn bản sửa được, nút "Sao chép", nút "Lưu" vào `baocao`. Giai đoạn 3 thêm "Tải .docx".

### 7.6. Đọc nhiệm vụ kế hoạch từ HTTD (giai đoạn 2)

- Cầu nối `doGet?action=viecCuaToi&token=...` mở HTTD bằng `SpreadsheetApp.openById`, đọc `DM_NhiemVu`, lọc `EmailPhuTrach == emailPhuTrach` (hoặc `ChuyenVien` chứa tên) và `NgungTheoDoi` rỗng, trả JSON các cột `Ma, MaKH, LinhVuc, NoiDung, DonViChuTri, DonViPhoiHop, ThoiHan, KyBaoCao, TrangThai, PhanTram, MaCDS`.
- Trang gọi mỗi lần mở màn "Nhiệm vụ kế hoạch" hoặc màn "Báo cáo", tối đa một lần mỗi 15 phút; kết quả ghi đè vào `httd/{Ma}` (mục 6.7). Hiển thị chỉ đọc, có link mở HTTD, có nút "Tạo việc phát sinh từ nhiệm vụ này" (điền `lienKetHTTD`). Khi cầu nối không gọi được, màn dùng bản chụp gần nhất và ghi rõ thời điểm chụp.
- Trang "Hôm nay" gộp hai nguồn theo hạn: việc phát sinh và nhiệm vụ HTTD sắp đến hạn.

### 7.7. Bản sao Google Sheets (giai đoạn 2)

- File Sheets "SoViec" (4 sheet: `Viec`, `YeuCau`, `BaoCao`, `NhatKy`), cột khớp mục 6.
- Mỗi lần lưu thành công vào CSDL artifact, trang `POST` (Content-Type `text/plain` để tránh preflight) tới cầu nối `action=luu` với `{token, bang, banGhi}`; cầu nối upsert theo `ma`. Thất bại thì xếp hàng trong `localStorage`, thử lại khi mở trang sau. Màn Cấu hình có nút "Đồng bộ lại toàn bộ" và hiển thị thời điểm đồng bộ cuối.
- Sao lưu hằng đêm bằng trigger Apps Script như cách HTTD đang làm (`SaoLuu_SoViec_YYYY-MM-DD`).

### 7.8. Trích xuất trong trang (giai đoạn 3)

- Ô dán văn bản (hoặc chọn PDF, đọc chữ bằng pdf.js từ cdnjs). Nút "Trích xuất" gọi `sample.json` với chỉ dẫn rút gọn từ skill trích xuất và danh mục `donvi`, `linhvuc`, yêu cầu trả đúng hợp đồng 7.2. Kết quả hiện bảng xem trước, sửa được, rồi lưu như 7.1 bước 5.
- Giới hạn: chỉ dẫn gửi kèm mỗi lần nên phải ngắn; văn bản quá dài thì cắt theo phần.

## 8. Giao diện

### 8.1. Màn hình

| Màn | Nội dung | Hành động chính |
|---|---|---|
| Hôm nay | Số việc quá hạn, đến hạn trong 3 ngày, chờ xác nhận, cần nhắc; danh sách việc sắp đến hạn (gộp HTTD) | Mở việc, xác nhận nhanh |
| Việc | Danh sách lọc theo lĩnh vực, trạng thái, kỳ; tìm theo chữ | +, mở chi tiết |
| Chi tiết việc | Mọi trường, bảng yêu cầu đầu vào, nhật ký | Đổi trạng thái, thêm yêu cầu, ghi kết quả |
| Chờ xác nhận | Việc `nhapTu = claude` chưa xác nhận | Xác nhận, sửa, bỏ |
| Cần nhắc | Nhóm theo đơn vị, tin nhắn soạn sẵn | Sao chép, Đã nhắc |
| Báo cáo | Chọn kỳ, sinh, sửa, sao chép, lưu, lịch sử | Sinh, Sao chép |
| Nhiệm vụ kế hoạch | Từ HTTD, chỉ đọc (giai đoạn 2) | Tạo việc phát sinh |
| Cấu hình | Danh mục đơn vị, lĩnh vực, mẫu tin nhắn, kỳ báo cáo, URL và token cầu nối, đồng bộ | Lưu |

Điện thoại: thanh điều hướng dưới cùng (Hôm nay, Việc, Cần nhắc, Báo cáo, Thêm). Máy tính: thanh bên trái. Chi tiết việc mở dạng tấm trượt từ cạnh phải (máy tính) hoặc toàn màn (điện thoại).

Phác thảo màn "Hôm nay" trên điện thoại:

```
┌──────────────────────────────┐
│ Sổ việc            T6 14/11  │
├──────────────────────────────┤
│ [3 quá hạn] [5 đến hạn] [4   │
│  chờ xác nhận] [6 cần nhắc]  │
├──────────────────────────────┤
│ SẮP ĐẾN HẠN                  │
│ ● CĐS  BC nền tảng LGSP   T2 │
│   còn nợ: VP, TTPVHCC        │
│ ● CCHC Góp ý dự thảo QC  T3  │
│ ○ HTTD KH09-12 Rà soát... T4 │
├──────────────────────────────┤
│ Hôm nay │ Việc │ Nhắc │ BC │+│
└──────────────────────────────┘
```

### 8.2. Hệ thống thiết kế (theo skill design-systems)

Token ba tầng, khai báo trên `:root`, có bản tối:

- **Tầng gốc:** `--blue-600` (hành động), `--gray-50..900` (nền, chữ), `--red-600` (quá hạn), `--amber-600` (sắp đến hạn, chờ), `--green-600` (hoàn thành), `--violet-600` (từ Claude, chờ xác nhận); `--space-1..8` (4 px bước); `--font-size-xs..xl`; `--radius-sm/md/lg`; `--shadow-sm/md`.
- **Tầng ngữ nghĩa:** `--color-bg-page`, `--color-bg-surface`, `--color-text-primary/secondary`, `--color-action-primary/hover`, `--color-border-default/focus`, `--color-status-overdue/due-soon/done/pending/claude`, `--space-inline-md`, `--space-stack-md`.
- **Tầng thành phần:** chỉ khi cần (`--badge-padding`, `--card-padding`).

Màu lĩnh vực là nhãn phụ (một chấm hoặc một viền), không dùng làm nền cả thẻ, để màu trạng thái giữ vai trò chính. Phông chữ: Inter (Google Fonts), dự phòng hệ thống; cỡ gốc 16 px; chữ tiếng Việt kiểm tra dấu ở trọng lượng 500 và 600.

Thành phần (mỗi cái có trạng thái mặc định, hover, focus, disabled, loading, rỗng, lỗi):

| Thành phần | Mục đích | Biến thể |
|---|---|---|
| Nút | hành động | chính, phụ, nguy hiểm, biểu tượng |
| Nhãn trạng thái | trạng thái việc, yêu cầu | theo mã trạng thái |
| Thẻ việc | một dòng trong danh sách | thường, quá hạn, từ Claude |
| Ô nhập, chọn, ngày | biểu mẫu | có nhãn trên, lỗi dưới |
| Chip lọc | lọc danh sách | chọn/bỏ |
| Tấm trượt | chi tiết, biểu mẫu | phải (máy tính), toàn màn (điện thoại) |
| Ô số | bốn con số trên màn Hôm nay | bình thường, cảnh báo |
| Thông báo nổi | kết quả lưu, sao chép | thành công, lỗi |
| Trạng thái rỗng | chưa có việc, chưa cần nhắc | kèm câu hướng dẫn một dòng |

Văn bản giao diện: tiếng Việt, ngắn, dạng động từ ("Xác nhận", "Đã nhắc", "Sao chép"), không dùng tiếng Anh lẫn. Trạng thái rỗng viết tích cực ("Không có đơn vị nào cần nhắc hôm nay").

Khả năng tiếp cận: tương phản chữ tối thiểu 4,5:1; mọi nút bấm được bằng bàn phím; nhãn trạng thái không chỉ dựa vào màu (có chữ). Đích chạm trên điện thoại tối thiểu 44 px.

## 9. Bảo mật và dữ liệu

- Artifact riêng tư; quy tắc đọc, ghi ở mức `admin`. Không chia sẻ link.
- Token cầu nối tạo ngẫu nhiên 32 ký tự, lưu trong `PropertiesService` của Apps Script và `localStorage` của thiết bị; không bao giờ nằm trong CSDL hay mã trang. Cầu nối từ chối mọi yêu cầu sai token, ghi nhật ký số lần sai.
- Cầu nối chỉ trả cột đã liệt kê ở 7.6; không trả `PinHash`, `EmailPhuTrach` của người khác.
- Dữ liệu cá nhân của người dân không đưa vào sổ việc (chỉ tiêu đề, số ký hiệu, link).
- Nhật ký trong từng `viec` giới hạn 50 dòng; tổng tài liệu dự kiến dưới 3.000 sau hai năm, xa trần 25.000.

## 10. Giai đoạn triển khai và tiêu chí nghiệm thu

**Giai đoạn 1 — Sổ việc chạy được với Claude là cổng vào**
Gồm: artifact với `db`; các màn Hôm nay, Việc, Chi tiết, Chờ xác nhận, Cần nhắc, Báo cáo (tuần, tháng dạng văn bản), Cấu hình (chưa có cầu nối); gieo `donvi`, `linhvuc`, `cauhinh`; skill `ghi-viec-vao-so-viec`.
Nghiệm thu: Claude ghi thử 5 việc từ một văn bản thật của Mr. Nobody; Mr. Nobody xác nhận trên điện thoại; sinh được báo cáo tuần đúng cấu trúc từ dữ liệu thử; danh sách cần nhắc ra đúng đơn vị và tin nhắn.

**Giai đoạn 2 — Cầu nối: đọc HTTD và bản sao Sheets**
Gồm: dự án Apps Script độc lập, Sheet "SoViec", màn Nhiệm vụ kế hoạch, đồng bộ, sao lưu đêm, mục menu trong HTTD.
Nghiệm thu: nhiệm vụ HTTD của Mr. Nobody hiện đúng; mọi việc trong artifact có bản sao trong Sheet sau "Đồng bộ lại toàn bộ"; tắt mạng rồi bật lại, hàng đợi gửi bù đủ.

**Giai đoạn 3 — Trích xuất trong trang và xuất .docx**
Gồm: ô dán văn bản, đọc PDF, gọi Claude trong trang, xem trước; tải báo cáo .docx theo thể thức NĐ 30 (phần nội dung dán vào báo cáo của Phòng, không phải văn bản hoàn chỉnh có quốc hiệu).
Nghiệm thu: dán một công văn thật, kết quả trích xuất trùng ít nhất 80% với kết quả chạy skill trong phiên Claude; file .docx mở được trong Word.

Mỗi giai đoạn kết thúc bằng Mr. Nobody dùng thử một tuần trước khi sang giai đoạn sau.

## 11. Để người xây tự quyết

- Cách sinh mã tăng dần (`cauhinh/dem` hay mã theo thời gian); khuyến nghị `dem` vì một người dùng.
- Thư viện giao diện: thuần HTML, CSS, JS hoặc một thư viện nhỏ từ CDN cho phép; không bắt buộc khung lớn.
- Cách lưu nhật ký trong tài liệu `viec` (mảng cắt bớt) hay tài liệu riêng theo tháng.
- Thư viện tạo .docx và đọc PDF, miễn là từ CDN cho phép và có phiên bản cố định.
- Cách trình bày lịch sử báo cáo.

## 12. Quyết định đã chốt

**Mr. Nobody quyết định:** nhu cầu và phạm vi (mục 1, 2); mô hình đôn đốc theo từng đơn vị với tin nhắn soạn sẵn; kiến trúc kết hợp artifact + Apps Script cầu nối; chia ba giai đoạn. Sau kiểm tra độc lập ngày 14/11/2026, Mr. Nobody chốt thêm bốn điểm: (1) sổ chỉ ghi việc năm mảng, việc mảng khác Claude liệt kê để chuyển đồng nghiệp; (2) báo cáo tháng dùng khung của báo cáo tuần; (3) nhiệm vụ HTTD tự vào báo cáo từ giai đoạn 2, khử trùng theo `lienKetHTTD`; (4) năm mảng gộp một tiểu mục, gom theo loại sản phẩm.

**Claude quyết định (có thể bác):** sổ việc một người dùng; danh mục lĩnh vực sáu dòng; cầu nối là dự án Apps Script độc lập thay vì sửa HTTD; quy tắc truy cập `admin`; token lưu `localStorage`; kỳ tuần thứ Bảy đến thứ Sáu theo báo cáo mẫu; cấu trúc hợp đồng ghi 7.2; hạn yêu cầu đầu vào mặc định sớm hơn hạn việc hai ngày làm việc; nhắc trước hạn hai ngày; bản sao Sheets là bắt buộc ở giai đoạn 2.
