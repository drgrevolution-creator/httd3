# BẢN THIẾT KẾ: HTTD 3.0 — HỆ THỐNG QUẢN LÝ NHIỆM VỤ, CHỈ TIÊU VÀ CHỈ SỐ ĐÁNH GIÁ, UBND XÃ PHƯỚC HẢI

Ngày: 14/11/2026, cập nhật 15/11/2026 · Phiên bản: 0.3 (đã qua kiểm tra độc lập và trả lời đủ câu hỏi; **chờ Mr. Nobody duyệt**) · Tên gọi tạm: HTTD 3.0 (Mr. Nobody có thể đặt tên khác)

Bản này thay thế và gộp bản `2026-11-14-so-viec-design.md` (sổ việc cá nhân): toàn bộ mô hình việc phát sinh, yêu cầu đầu vào, đôn đốc, báo cáo tuần của bản đó trở thành phân hệ Nhiệm vụ thường xuyên và màn Việc của tôi dưới đây.

---

## 1. Ý định và lý do

HTTD 2.0 đang vận hành tại Phòng Văn hóa – Xã hội là kết quả ghép hai hệ thống Google Sheets ngày 28/9/2026: phân hệ nhiệm vụ theo kế hoạch (khoảng 200 nhiệm vụ của 4 kế hoạch, 8 tài khoản, đơn vị báo cáo theo kỳ, kiểm duyệt) và Bộ chỉ tiêu hợp nhất về chuyển đổi số (53 chỉ tiêu, 75 nguồn quy định, 34 đầu mối báo cáo tử số và mẫu số). Hệ thống hoạt động ổn định (kiểm tra toàn vẹn hằng đêm 0 chỗ lệch, sao lưu hằng đêm), nhưng:

- hai phân hệ có hai mô hình tài khoản, hai bộ danh mục, hai cách nhật ký; mở rộng thêm phân hệ nào cũng phải ghép thêm một lần;
- không có chỗ cho nhiệm vụ thường xuyên phát sinh hằng ngày của chuyên viên, nên việc đôn đốc đơn vị và báo cáo tuần, tháng làm thủ công;
- minh chứng nằm rải trên Drive theo mã PAR, DTI do một người tự xếp, không gắn với nhiệm vụ hay chỉ tiêu nào trong hệ thống;
- dữ liệu chưa theo một khung chuẩn nên khó nối với Trung tâm điều hành thông minh Thành phố.

HTTD 3.0 là một hệ thống thống nhất xây mới: một cơ sở dữ liệu, một mô hình tài khoản, một bộ danh mục dùng chung theo Khung kiến trúc dữ liệu Thành phố, các phân hệ chuyên môn cắm vào lõi đó. Mr. Nobody chọn **chuyển một lần**: hệ thống mới phải đạt ngang HTTD 2.0 và chạy ổn định với một người dùng thử trước ngày chuyển; sau ngày chuyển HTTD 2.0 chỉ còn để tra cứu.

## 2. Mục tiêu, không phải mục tiêu, phản mục tiêu

**Mục tiêu**

1. Thay thế trọn vẹn HTTD 2.0: mọi việc HTTD 2.0 đang làm (mục 11.1) đều làm được trên HTTD 3.0, dữ liệu chuyển sang đầy đủ, có biên bản đối chiếu.
2. Một bảng nhiệm vụ duy nhất cho cả nhiệm vụ theo kế hoạch và nhiệm vụ thường xuyên; mỗi người có màn "Việc của tôi"; đôn đốc đơn vị bằng danh sách cần nhắc kèm tin nhắn soạn sẵn.
3. Danh mục dùng chung theo đúng trường của 13 danh mục mục IV Khung kiến trúc dữ liệu Thành phố, để xuất dữ liệu nối Trung tâm điều hành thông minh khi được yêu cầu.
4. Mỗi nhiệm vụ, chỉ tiêu, tiêu chí có thư mục minh chứng trên Google Drive, tự tạo, xem và tải lên ngay trong hệ thống.
5. Báo cáo định kỳ (tuần, tháng, quý, 6 tháng, năm) và chuyên đề sinh từ dữ liệu, dán được vào văn bản hoặc tải .docx.
6. Claude ghi được nhiệm vụ vào hệ thống từ văn bản Mr. Nobody gửi, không cần mật khẩu hay token trong hội thoại.
7. Sẵn khung để thêm phân hệ Bộ chỉ số DTI, PAR Index, SIPAS mà không đổi lõi.

**Không phải mục tiêu**

- Không kết nối Hệ thống quản lý văn bản và điều hành của Thành phố; không gửi Zalo tự động; không tự chấm điểm DTI, PAR thay cơ quan có thẩm quyền.
- Không lưu dữ liệu cá nhân của người dân (chỉ số liệu tổng hợp, tiêu đề, số ký hiệu, link).
- Không xây ứng dụng di động riêng: trang web đáp ứng trên điện thoại là đủ.

**Phản mục tiêu**

- Một thông tin phải nhập ở hai chỗ.
- Hệ thống mới khó dùng hơn HTTD 2.0 với các đơn vị, khiến họ quay lại gửi Excel, Zalo.
- Mất dữ liệu hoặc mất khả năng truy vết (ai sửa gì, lúc nào, căn cứ đâu).
- Chỉ Claude sửa được, Mr. Nobody không đọc nổi mã nguồn.

## 3. Ràng buộc

- Tài khoản Google cá nhân (Gmail), không có Google Workspace; nhiều người dùng của các đơn vị, trường, ấp cũng dùng Gmail cá nhân. Apps Script không tự nhận diện được người dùng Gmail cá nhân khi chạy dưới tài khoản chủ, nên phải tự xây lớp đăng nhập.
- Hạn mức Apps Script tài khoản cá nhân: 6 phút mỗi lần chạy, 100 email mỗi ngày, 20.000 lần gọi mạng mỗi ngày, 90 phút chạy theo lịch mỗi ngày, 30 lượt chạy đồng thời. Đủ cho quy mô xã nếu thiết kế gọn.
- Phiên Claude trên đám mây không gọi được script.google.com (đã kiểm tra, bị chặn); trình duyệt người dùng và Claude Code chạy trên máy Mr. Nobody gọi được. Kết nối Google Drive của Claude tạo được file mới trên Drive nhưng không ghi ô vào Sheets đang có.
- Zalo không có API cho tài khoản cá nhân.
- GitHub Pages miễn phí chỉ với kho mã công khai; mã nguồn không được chứa bí mật nào.
- Mr. Nobody mới lập trình: mã chia file nhỏ, chú thích tiếng Việt, mỗi chức năng một hàm, có tài liệu vận hành.
- Dữ liệu là dữ liệu công vụ nội bộ; không công khai ra ngoài hệ thống.

## 4. Các cách đã cân nhắc

### 4.1. Nền tảng

| Cách | Được | Mất | Kết luận |
|---|---|---|---|
| Google Sheets + Apps Script, giao diện do Apps Script phục vụ (như HTTD 2.0) | Một nền tảng, quen thuộc | Trang tải chậm vài giây, mã nguồn không có lịch sử, Claude khó sửa từ xa | Không chọn |
| Cloudflare Pages + Workers + D1 + GitHub | Nhanh, cơ sở dữ liệu thật, đăng nhập Google miễn phí tới 50 người | Hai nền tảng mới, dữ liệu rời Google, gắn Drive cần OAuth, khó bảo trì với một người mới lập trình | Để dành khi xã có nhân sự kỹ thuật |
| **Lai: giao diện tĩnh trên GitHub Pages, API Apps Script, dữ liệu Google Sheets, file trên Google Drive, mã nguồn trên GitHub (đã chọn)** | Trang tải nhanh, mã có lịch sử, dữ liệu vẫn mở bằng Sheets và Excel, thư mục Drive tự tạo bằng vài dòng, chuyển dữ liệu từ HTTD gần như sao chép | Phải tự viết lớp đăng nhập (HTTD 2.0 cũng đã tự viết), mỗi lần gọi API mất 1–2 giây | **Chọn**, Mr. Nobody xác nhận 14/11/2026 |

### 4.2. Cách Claude ghi dữ liệu vào hệ thống

| Đường | Cách hoạt động | Cần bí mật? | Dùng được từ đâu |
|---|---|---|---|
| **A. Hộp thư Drive (chính)** | Claude tạo một file JSON trong thư mục `HTTD3/HopThuClaude/ChoNhap` trên Drive của Mr. Nobody bằng kết nối Google Drive sẵn có. Một lịch Apps Script chạy mỗi 5 phút đọc file, tạo nhiệm vụ ở trạng thái chờ xác nhận, chuyển file sang `DaNhap`, ghi file kết quả | Không | Mọi phiên Claude có kết nối Google Drive: claude.ai, Claude Code web, Claude Desktop |
| B. Gọi thẳng API | Claude gửi JSON tới `doPost` kèm khóa API của tài khoản dịch vụ `claude-nhaplieu` | Có (khóa lưu trên máy Mr. Nobody, hoặc mở hai tên miền Apps Script trong môi trường Claude Code web) | Claude Code trên máy Mr. Nobody; Claude Code web nếu môi trường cho phép |
| C. Dán tay | Claude đưa JSON, Mr. Nobody dán vào màn "Nhập từ Claude", xem trước, lưu | Không | Mọi nơi |

Chọn A làm đường chính, giữ C làm dự phòng, B làm tùy chọn cho người quen dòng lệnh. Dù đường nào, nhiệm vụ do Claude tạo luôn ở trạng thái **chờ xác nhận** và chỉ thành chính thức khi Mr. Nobody bấm xác nhận.

### 4.3. Cách chuyển đổi

Chạy song song từng phân hệ hay chuyển một lần: Mr. Nobody chọn **chuyển một lần** (14/11/2026), **ngày chuyển trong tuần đầu tháng 1/2027** (15/11/2026), sau khi chốt báo cáo năm 2026 (20/11) và quý IV (20/12), trước khi UBND xã ban hành kế hoạch năm 2027. Hệ quả: toàn bộ danh sách ngang HTTD (mục 11.1) phải xong trước ngày chuyển; Mr. Nobody **kiểm thử toàn hệ thống một mình ít nhất hai tuần** với bản sao dữ liệu thật (dự kiến từ 15/12/2026), có danh sách kịch bản thử và quyết định đi hay dừng vào 02/01/2027; ngày chuyển làm theo đúng quy trình khóa, chuyển, đối chiếu, mở mà HTTD 2.0 đã áp dụng ngày 28/9/2026.

## 5. Kiến trúc tổng thể

```
NGƯỜI DÙNG (máy tính, điện thoại)                      CLAUDE (mọi phiên)
   │ trình duyệt                                            │ kết nối Google Drive
   ▼                                                        ▼
┌───────────────────────────────┐                 ┌─────────────────────────────┐
│ GIAO DIỆN tĩnh trên GitHub    │                 │ Drive: HTTD3/HopThuClaude   │
│ Pages (HTML, CSS, JS thuần,   │                 │   ChoNhap/ *.json           │
│ một trang, tải một lần)       │                 │   DaNhap/, KetQua/          │
└──────────────┬────────────────┘                 └──────────────┬──────────────┘
               │ fetch GET/POST (text/plain, JSON)                │ lịch 5 phút
               ▼                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ API Apps Script (dự án độc lập, chạy dưới tài khoản Mr. Nobody, "Anyone")   │
│  doGet/doPost → kiểm tra phiên → điều phối theo action → nghiệp vụ → Sheets │
│  Lịch: 01:00 sao lưu · 02:00 kiểm tra toàn vẹn · 07:30 nhắc hạn email ·     │
│        mỗi 5 phút đọc Hộp thư Claude · theo kỳ: nhắc nộp báo cáo             │
└──────┬───────────────────────────────┬──────────────────────────┬───────────┘
       ▼                               ▼                          ▼
┌──────────────────┐   ┌───────────────────────────┐   ┌────────────────────────┐
│ Google Sheets    │   │ Google Drive               │   │ Gmail (MailApp)        │
│ HTTD3_DuLieu     │   │ HTTD3/MinhChung/<loại>/<mã>│   │ nhắc hạn, nhắc nộp     │
│ HTTD3_DanhMuc    │   │ HTTD3/SaoLuu/              │   │ (≤100 thư/ngày)        │
│ HTTD3_NhatKy     │   │ HTTD3/XuatDuLieu/          │   └────────────────────────┘
└──────────────────┘   └───────────────────────────┘
       ▲
       │ clasp push (từ máy Mr. Nobody hoặc GitHub Actions)
┌──────┴───────────────────────────────────────────────┐
│ GitHub: một kho `httd3` chứa /web (giao diện), /gas   │
│ (Apps Script), /docs (thiết kế, vận hành), /migrate   │
└──────────────────────────────────────────────────────┘
```

Ba file Sheets thay vì một: `HTTD3_DanhMuc` (ít đổi, 13 danh mục Thành phố và danh mục địa phương), `HTTD3_DuLieu` (nghiệp vụ), `HTTD3_NhatKy` (nhật ký, lịch sử, phiên đăng nhập, lớn dần theo thời gian). Tách để sao lưu nhanh và để file dữ liệu không phình vì nhật ký.

## 6. Đăng nhập và phân quyền

### 6.1. Đăng nhập

1. Trang hiện nút "Đăng nhập bằng Google" (thư viện Google Identity Services). Người dùng chọn tài khoản Gmail; trình duyệt nhận thẻ định danh (ID token) hạn 1 giờ do Google ký.
2. Trang gửi thẻ tới API (`action=dangNhapGoogle`). API xác minh thẻ qua địa chỉ `oauth2.googleapis.com/tokeninfo` (kiểm tra `aud` đúng Client ID, `iss`, `exp`, `email_verified`), tra email trong `DM_NguoiDung` (trạng thái Hoạt động).
3. Khớp thì API tạo mã phiên ngẫu nhiên 32 ký tự, lưu `PhienDangNhap` (mã, email, vai trò, mã đơn vị, hết hạn sau 12 giờ, thiết bị), đồng thời đặt vào CacheService 6 giờ để tra nhanh. Trang giữ mã phiên trong `localStorage` và gửi kèm mọi lần gọi.
4. Đăng nhập dự phòng bằng tên đăng nhập và mật khẩu (băm SHA-256 có muối, kế thừa `0A_TAIKHOAN`): dành cho người chưa có hoặc không muốn dùng Gmail. Sai 5 lần liên tiếp khóa 15 phút (kế thừa cột "Số lần sai liên tiếp", "Khóa đến").
5. Mọi hàm nghiệp vụ gọi `kiemTraPhien()` đầu tiên; vai trò và đơn vị lấy từ bản ghi phiên phía máy chủ, không bao giờ tin dữ liệu trang gửi lên.

Việc Mr. Nobody làm một lần: tạo OAuth Client ID loại ứng dụng web trong Google Cloud Console, khai nguồn `https://<tên>.github.io`; Client ID là giá trị công khai, đặt trong cấu hình trang. **Không tốn phí, không cần thẻ:** tạo dự án Google Cloud và Client ID không yêu cầu bật thanh toán; chỉ các dịch vụ trả tiền mới cần thẻ, hệ thống này không dùng dịch vụ nào như vậy. Màn hình đồng ý (OAuth consent screen) khai loại "Bên ngoài", chỉ xin ba phạm vi cơ bản (openid, email, profile) nên không phải qua xét duyệt của Google; đặt trạng thái "Đang hoạt động" để mọi Gmail đăng nhập được, không giới hạn 100 người thử. Claude hướng dẫn từng màn hình ở giai đoạn 1 (khoảng 10 phút).

### 6.2. Vai trò

| Vai trò | Kế thừa từ | Quyền |
|---|---|---|
| QUANTRI | QuanTri, QUANTRI | Toàn quyền: danh mục, người dùng, kỳ báo cáo, cấu hình, nhập Excel, chuyển đổi |
| KIEMDUYET | KiemDuyet | Duyệt, trả lại báo cáo tiến độ nhiệm vụ; xem toàn bộ (số liệu chỉ tiêu không qua duyệt, xem 8.2) |
| CHUYENVIEN | mới | Tạo và theo dõi nhiệm vụ trong lĩnh vực phụ trách; màn Việc của tôi; tạo yêu cầu đầu vào; sinh báo cáo |
| DONVI | NhapLieu | Báo cáo tiến độ nhiệm vụ của đơn vị mình; nhập số liệu chỉ tiêu của đầu mối mình; tải minh chứng vào bản ghi của mình; xem những gì liên quan đơn vị mình |
| LANHDAO | LANHDAO | Chỉ xem: bảng điều khiển, báo cáo, bảng theo dõi |

Một người có thể giữ nhiều vai trò (ví dụ Mr. Nobody: QUANTRI và CHUYENVIEN). Phạm vi dữ liệu của DONVI lọc theo `danhSachDonVi` trong phiên (một hoặc nhiều đầu mối); màn nhập số liệu kỳ và báo cáo tiến độ có ô chọn đầu mối khi danh sách có hơn một.

## 7. Mô hình dữ liệu

### 7.1. Nguyên tắc chung

- Mỗi bảng một sheet, dòng 1 là tên cột (khóa camelCase không dấu), dòng 2 là tên hiển thị tiếng Việt, dữ liệu từ dòng 3. API đọc theo tên cột, không theo vị trí, để thêm cột không vỡ mã.
- Mọi bảng có `ma` (khóa chính, tiền tố theo bảng, tăng dần), `taoLuc`, `taoBoi`, `capNhatLuc`, `capNhatBoi`, `tinhTrang` (Hoạt động, Ngừng, Xóa mềm). Không xóa dòng; xóa là `tinhTrang = Xóa mềm`.
- Danh mục có hiệu lực thời gian: `hieuLucTu`, `hieuLucDen`, `tinhTrangApDung` theo đúng Khung Thành phố.
- Mọi ghi vào bảng nghiệp vụ tạo một dòng `NhatKy` (ai, lúc nào, bảng, mã, trước, sau, căn cứ). Bản ghi bị thay thế (số liệu gửi lại, báo cáo gửi lại) chuyển nguyên vẹn sang bảng `_LichSu` tương ứng, kế thừa nguyên tắc của HTTD 2.0.
- Ngày lưu dạng `YYYY-MM-DD`, thời điểm dạng ISO 8601 múi giờ Việt Nam; hiển thị dạng Việt Nam trên trang.
- Ghi vào Sheets luôn trong `LockService.getScriptLock()` tối đa 30 giây; đọc không khóa.

### 7.2. Danh mục dùng chung theo Khung kiến trúc dữ liệu Thành phố (file `HTTD3_DanhMuc`)

Mười ba danh mục mục IV giữ **đúng tên và thứ tự trường** của Thành phố; danh sách trường đầy đủ của từng danh mục và mã cột tương ứng ở **Phụ lục A**. Mọi danh mục có thêm cột `maThanhPho` để trống, dành cho mã do Thành phố cấp khi Thành phố ban hành quy tắc mã; mã nội bộ hiện có (NV01, CPS-01, PAR-072...) giữ nguyên làm khóa chính. Cách dùng tại xã:

| # | Danh mục Thành phố | Sheet | Dùng tại xã | Gieo ban đầu từ |
|---|---|---|---|---|
| 1 | Mục tiêu phát triển theo giai đoạn | `DM_MucTieu` | Mục tiêu của Nghị quyết Đảng bộ xã, kế hoạch 5 năm; nhiệm vụ và chỉ tiêu trỏ về mục tiêu | Nhập tay sau |
| 2 | Chỉ tiêu phát triển KT–XH | `DM_ChiTieu` | Chỉ tiêu chuẩn (53 chỉ tiêu CĐS hiện có và chỉ tiêu KT-XH khác); giá trị thực hiện lấy từ `TongHopChiTieuKy` | `2_DM_CHITIEU` |
| 3 | KPI, chỉ số đánh giá điều hành | `DM_ChiSo` | Tiêu chí, chỉ số thành phần của DTI, PAR Index, SIPAS; ngưỡng Đạt/Chưa đạt | PAR-xxx, DTI-xx đang dùng trên Drive |
| 4 | Nhiệm vụ | `DM_NhiemVu` không dùng riêng; trường của Thành phố nằm trong bảng nghiệp vụ `NhiemVu` (7.3) | | `DM_NhiemVu` HTTD |
| 5 | Chương trình công tác | `DM_ChuongTrinh` | Kế hoạch, chương trình, đề án mà nhiệm vụ thuộc về (KH09, KH92, KHDTI, KHNQ57...) | `DM_KeHoach` |
| 6 | Trạng thái thực hiện nhiệm vụ | `DM_TrangThai` | Bộ trạng thái dùng chung, có mức hoàn thành và ý nghĩa quản lý; nhiệm vụ, báo cáo, yêu cầu đầu vào đều tra ở đây | Mục 7.4 |
| 7 | Loại báo cáo định kỳ | `DM_LoaiBaoCaoDinhKy` | Báo cáo tuần Phòng, tháng, quý CCHC, 6 tháng, năm, báo cáo DTI, PAR; hạn nộp và nơi nhận | `CauHinh` kỳ báo cáo |
| 8 | Loại báo cáo chuyên đề | `DM_LoaiBaoCaoChuyenDe` | Báo cáo theo công văn yêu cầu đột xuất | Nhập khi phát sinh |
| 9 | Nguồn dữ liệu đầu vào | `DM_NguonDuLieu` | Hệ thống thông tin giải quyết TTHC, Cổng DVC, sổ theo dõi... (cột "Nguồn số liệu tại xã" hiện có) | `2_DM_CHITIEU` cột I |
| 10 | Đơn vị đo lường | `DM_DonViDo` | %, người, hồ sơ, tỷ đồng, điểm... | Suy từ dữ liệu hiện có |
| 11 | Mức độ, cấp độ đánh giá | `DM_MucDo` | Ngưỡng màu xanh, vàng, đỏ cho tiến độ, tỷ lệ đạt, cảnh báo quá hạn; hành động gợi ý | Mục 7.4 |
| 12 | Kịch bản điều hành | `DM_KichBan` | Tạo sẵn, chưa dùng; giữ để tương thích | Trống |
| 13 | Mô hình phân tích, dự báo | `DM_MoHinh` | Tạo sẵn, chưa dùng | Trống |

Danh mục địa phương bổ sung, cùng cách tổ chức: `DM_DonVi` (34 đầu mối từ `1B_DM_DAUMOI` cộng Công an xã, Ban CHQS, nhóm cơ quan ngoài xã), `DM_LinhVuc` (CCHC, CĐS, KHCN, ĐMST, SHTT, TĐC, TTTT, HTTT, KTS, XHS... từ `CauHinh`), `DM_VanBan` (văn bản căn cứ, từ `1_DM_VANBAN` và cột VBChiDaoGoc), `DM_KyBaoCao` (một bảng kỳ dùng chung cho nhiệm vụ và chỉ tiêu, vì `CauHinh` HTTD 2.0 đang dùng chung một danh sách: cột `maKy`, `tenKy` như "Quý III/2026", `loaiKy` (tháng, quý, 6 tháng, 9 tháng, năm), `tuNgay`, `denNgay`, `hanChot`, `apDungCho` (nhiệm vụ, chỉ tiêu, cả hai)), `DM_NguoiDung` (hợp nhất `PhanQuyen_CU` và `0A_TAIKHOAN` theo `CHUYENDOI_TAIKHOAN`; cột `danhSachDonVi` là danh sách mã, vì một tài khoản có thể đại diện nhiều đầu mối, ví dụ một người nhập thay nhiều ấp), `DM_CauTruc` (mô tả cột của mọi danh mục: tên, kiểu, bắt buộc, danh sách chọn; dùng để một màn "Danh mục" duy nhất sửa được mọi bảng danh mục mà không viết màn riêng).

### 7.3. Bảng nghiệp vụ (file `HTTD3_DuLieu`)

**`NhiemVu`** — một bảng cho cả hai nguồn. Trường của danh mục 4 Thành phố giữ nguyên tên; trường vận hành thêm sau.

| Nhóm | Trường |
|---|---|
| Theo Thành phố (danh mục 4) | `maNhiemVu`, `tenNhiemVu`, `linhVucThucHien`, `chuongTrinhLienQuan` (→ `DM_ChuongTrinh`), `coQuanChuTri`, `coQuanPhoiHop` (danh sách mã `DM_DonVi`), `mucTieuNhiemVu` (→ `DM_MucTieu`), `sanPhamDauRa`, `thoiHanThucHien`, `vanBanGiaoNhiemVu` (→ `DM_VanBan`), `mucDoUuTien`, `phamViThucHien`, `tinhTrangApDung` |
| Nguồn và phân loại | `nguon` (`KE_HOACH` hay `THUONG_XUYEN`), `loaiNguonPhatSinh` (văn bản đến, chỉ đạo, họp, tự phát sinh; chỉ với thường xuyên), `nguoiGiao`, `ngayGiao`, `loaiSanPham` (báo cáo, công văn, kế hoạch, quyết định, tờ trình, góp ý, minh chứng, khác) |
| Kế thừa HTTD | `chiTieuGiao`, `kyBaoCao`, `maLienKet`, `maIndex`, `maCDS` (→ `DM_ChiTieu`), `maCDS_HoTro`, `thoiHanGoc`, `ngungTheoDoi`, `chuyenVien`, `emailPhuTrach` |
| Theo dõi | `trangThai` (→ `DM_TrangThai`), `phanTram`, `ketQua`, `vuongMac`, `ketQuaVanBan` (số ký hiệu, ngày, link văn bản đi), `minhChung` (mã thư mục Drive), `maChiSo` (danh sách mã `DM_ChiSo` mà nhiệm vụ này là minh chứng, thay cho tên file PAR-xxx hiện nay), `lienKetNhiemVu` (nhiệm vụ thường xuyên phục vụ nhiệm vụ kế hoạch nào) |
| Xác nhận | `nhapTu` (tay, excel, claude), `trangThaiXacNhan` (chờ xác nhận, đã xác nhận, bỏ), `xacNhanBoi`, `xacNhanLuc` |

**`YeuCauDauVao`** — đơn vị phải cung cấp đầu vào cho một nhiệm vụ: `maYeuCau`, `maNhiemVu`, `maDonVi`, `noiDung`, `hanCungCap`, `trangThai` (chưa gửi, đã gửi, đã nhận, nhận chưa đạt), `ngayGui`, `ngayNhan`, `lanNhacCuoi`, `soLanNhac`, `fileNhan` (mã file Drive), `ghiChu`.

Tiêu đề cột thật của mọi sheet HTTD 2.0 được nhắc đến dưới đây nằm ở **Phụ lục B** (đã trích từ file đang chạy ngày 14/11/2026).

**`BaoCaoNhiemVu`** và **`BaoCaoNhiemVu_LichSu`** — đơn vị báo cáo tiến độ theo kỳ: giữ nguyên 18 cột của `BC_NHIEMVU` (`MaBanGhi, DonVi, Loai, Ma, VaiTroDonVi, KyBaoCao, NgayBaoCao, TrangThai, PhanTram, KetQua, VuongMac, SanPham, NguoiGui, ThoiDiem, TrangThaiDuyet, NguoiDuyet, ThoiDiemDuyet, GhiChuDuyet`) đổi sang camelCase, thêm `minhChung`. Lịch sử thêm `thoiDiemThayThe, nguoiThayThe, maBanGhiMoi, lyDo` như HTTD.

**`TongHopNhiemVuKy`** — tự sinh: 12 cột của `TH_NHIEMVU_KY`. Quy tắc gộp kế thừa: số đơn vị phải báo cáo = chủ trì + phối hợp; phần trăm chung = của chủ trì nếu có, nếu không lấy trung bình; tùy chọn `chiTinhSoLieuDaDuyet`.

**`ChiTieu_NguonQuyDinh`** — 14 cột của `3_NGUON_QUYDINH`, giữ nguyên năm nguyên tắc của Bộ chỉ tiêu (hai lớp; không sửa văn bản gốc, không xóa dòng; mốc gần trước, ngưỡng cao trước; báo cáo tử số và mẫu số; chỉ tiêu mới trùng nội hàm thì chỉ thêm nguồn).

**`ChiTieu_PhanCong`** — 9 cột của `2B_PHANCONG`: nhóm đầu mối nhập, câu hỏi tử số, mẫu số, cách tổng hợp.

**`SoLieuChiTieu`** và **`SoLieuChiTieu_LichSu`** — 16 cột của `5_SOLIEU` (thêm `minhChung`), 20 cột của `5X_LICHSU`. Mỗi lần báo cáo một dòng mới; gửi lại cùng chỉ tiêu cùng kỳ thì dòng cũ sang lịch sử.

**`TongHopChiTieuKy`** — 11 cột của `5C_TONGHOP_KY`; tỷ lệ = tổng tử số chia tổng mẫu số.

**`ChiSo_TuDanhGia`** (phân hệ Bộ chỉ số, xây khung ở giai đoạn 1, giao diện ở giai đoạn 6) — `maChiSo`, `ky` (năm đánh giá), `diemToiDa`, `diemTuDanhGia`, `diemCongBo`, `tinhTrangMinhChung`, `minhChung`, `nhiemVuLienQuan`, `ghiChu`.

**`MinhChung`** — chỉ mục file: `maMinhChung`, `loaiDoiTuong` (nhiệm vụ, báo cáo nhiệm vụ, số liệu chỉ tiêu, chỉ số, yêu cầu đầu vào), `maDoiTuong`, `fileId` (Drive), `tenFile`, `link`, `loaiFile`, `kichThuoc`, `taiLenBoi`, `taiLenLuc`, `moTa`. Thư mục Drive theo mẫu `HTTD3/MinhChung/<loại>/<mã>/`; tạo lần đầu khi có file; `folderId` lưu ở bản ghi gốc.

**`BaoCaoDaSinh`** — `maBaoCao`, `loaiBaoCao` (→ danh mục 7 hoặc 8), `tuNgay`, `denNgay`, `phamVi` (toàn xã, lĩnh vực, cá nhân), `noiDung` (văn bản sinh ra, sửa được), `fileDocx`, `taoBoi`, `taoLuc`.

**`HopThuClaude`** — nhật ký đường A: `maFile`, `tenFile`, `thoiDiemDoc`, `soNhiemVuTao`, `ketQua`, `loi`.

### 7.4. Bộ trạng thái và mức độ (gieo vào `DM_TrangThai`, `DM_MucDo`)

Trạng thái nhiệm vụ (mã, tên, mức hoàn thành, ý nghĩa quản lý): `CHO_XAC_NHAN` (0, Theo dõi), `CHUA_TRIEN_KHAI` (0, Theo dõi; kế thừa "Chưa triển khai"), `DANG_THUC_HIEN` (theo `phanTram`, Theo dõi), `CHO_DAU_VAO` (giữ nguyên %, Cảnh báo), `CHO_KY` (90, Theo dõi), `HOAN_THANH` (100, Kết thúc), `QUA_HAN` (suy ra khi quá hạn và chưa kết thúc, Cảnh báo), `TAM_DUNG` (giữ, Theo dõi), `HUY` (0, Kết thúc). Trạng thái duyệt: `CHO_DUYET`, `DA_DUYET`, `TRA_LAI`. Trạng thái yêu cầu đầu vào: `CHUA_GUI`, `DA_GUI`, `DA_NHAN`, `NHAN_CHUA_DAT`.

Mức độ (danh mục 11): tiến độ nhiệm vụ Xanh ≥ 80 %, Vàng 50–79 %, Đỏ < 50 % hoặc quá hạn; tỷ lệ đạt chỉ tiêu Xanh ≥ 100 % ngưỡng, Vàng 80–99 %, Đỏ < 80 %; hạn sắp đến: Vàng còn ≤ `soNgayNhacHan` (mặc định 7, kế thừa), Đỏ quá hạn. Tất cả sửa được trong danh mục, mã không gắn cứng màu.

### 7.5. Bản đồ chuyển dữ liệu từ HTTD 2.0

| HTTD 2.0 | HTTD 3.0 | Ghi chú |
|---|---|---|
| `DM_KeHoach` | `DM_ChuongTrinh` | thêm cấp, giai đoạn, cơ quan chủ trì |
| `DM_NhiemVu` | `NhiemVu` với `nguon = KE_HOACH`, `trangThaiXacNhan = đã xác nhận` | giữ nguyên mã NVxx; làm sạch ô nhiều dòng |
| `BC_NHIEMVU`, `_LICHSU`, `TH_NHIEMVU_KY`, `CapNhat_TienDo` | `BaoCaoNhiemVu`, `_LichSu`, `TongHopNhiemVuKy`, `NhatKy` | |
| `PhanQuyen_CU` + `0A_TAIKHOAN` theo `CHUYENDOI_TAIKHOAN` | `DM_NguoiDung` | giữ băm mật khẩu và muối; thêm cột email Google |
| `CauHinh` | `CauHinh` (khóa, giá trị) + `DM_LinhVuc` + `DM_KyBaoCao` + `DM_DonVi` | tách phần danh mục ra khỏi cấu hình |
| `1_DM_VANBAN`, `1B_DM_DAUMOI`, `2_DM_CHITIEU`, `2B_PHANCONG`, `3_NGUON_QUYDINH`, `9_DANHMUC` | `DM_VanBan`, `DM_DonVi`, `DM_ChiTieu`, `ChiTieu_PhanCong`, `ChiTieu_NguonQuyDinh`, các danh mục tương ứng | |
| `5_SOLIEU`, `5X_LICHSU`, `5C_TONGHOP_KY`, `5D_TIENDO`, `6_BANG_THEODOI`, `7_CANHBAO` | `SoLieuChiTieu`, `_LichSu`, `TongHopChiTieuKy`; ba bảng còn lại thành màn hình tính lúc xem, không lưu | |
| `NhatKy_HeThong`, `4_NHATKY` | `NhatKy` (một bảng) | giữ toàn bộ dòng cũ |
| `KIEMTRA_TOANVEN`, `DOICHIEU_CHUYENDOI`, `CHUYENDOI_TAIKHOAN` | `KiemTraToanVen`, `DoiChieuChuyenDoi` trong `HTTD3_NhatKy` | |

## 8. Phân hệ và luồng nghiệp vụ

### 8.1. Nhiệm vụ

- **Giao nhiệm vụ kế hoạch:** QUANTRI hoặc CHUYENVIEN tạo từ màn hình, hoặc nhập Excel theo mẫu (kế thừa `NhapExcel_ThemMoi`, `NhapExcel_CapNhat`: khớp theo mã, báo trước số dòng thêm, sửa, bỏ qua).
- **Nhiệm vụ thường xuyên:** tạo nhanh với ba trường bắt buộc (tên, lĩnh vực, hạn); có thể trỏ về nhiệm vụ kế hoạch; có thể do Claude tạo (8.6).
- **Đơn vị báo cáo theo kỳ:** DONVI mở "Nhiệm vụ của đơn vị", chọn kỳ, điền trạng thái, phần trăm, kết quả, vướng mắc, sản phẩm, tải minh chứng, gửi. Gửi lại trong cùng kỳ thì bản cũ sang lịch sử. API tính lại `TongHopNhiemVuKy` cho mã đó ngay khi gửi.
- **Duyệt:** KIEMDUYET xem hàng chờ, duyệt hoặc trả lại kèm ghi chú; đơn vị nhận email khi bị trả lại.
- **Nhắc hạn:** lịch 07:30 hằng ngày gửi email cho `emailPhuTrach` và email đơn vị chủ trì những nhiệm vụ đến hạn trong `soNgayNhacHan` ngày hoặc đã quá hạn, gộp một thư mỗi người; lịch theo kỳ nhắc đơn vị chưa nộp báo cáo trước hạn chốt 3 ngày và 1 ngày. Giới hạn 100 thư mỗi ngày: gộp theo người, ưu tiên quá hạn.
- **Việc của tôi:** lọc `emailPhuTrach` hoặc `chuyenVien` bằng người đăng nhập, gộp cả hai nguồn, sắp theo hạn; bốn ô số: quá hạn, đến hạn 3 ngày, chờ xác nhận, cần nhắc.
- **Yêu cầu đầu vào và đôn đốc:** trong chi tiết nhiệm vụ thêm dòng theo đơn vị; màn "Cần nhắc" gom theo đơn vị, tin nhắn soạn theo mẫu trong `CauHinh` (`mauTinNhac`, `mauTinNhacQuaHan`), nút Sao chép và Đã nhắc. Đơn vị đăng nhập cũng thấy "Đầu vào đơn vị tôi còn nợ" và có thể tải file trả lời ngay trong hệ thống, khi đó trạng thái chuyển `DA_NHAN` chờ chuyên viên xác nhận đạt.

### 8.2. Chỉ tiêu

- Giữ nguyên năm nguyên tắc và ba nhóm biểu mẫu (7 cơ quan, 16 trường, 11 ấp) nhưng thay Google Forms bằng màn "Nhập số liệu kỳ" trong hệ thống: đầu mối đăng nhập chỉ thấy chỉ tiêu được phân công cho nhóm mình, nhập tử số, mẫu số, nguồn số liệu, minh chứng; hệ thống tính giá trị. Giữ thêm nhập từ Excel cho đầu mối chưa quen.
- **Không có bước duyệt số liệu chỉ tiêu** (Mr. Nobody chốt 15/11/2026): số liệu đầu mối gửi có hiệu lực ngay như hiện nay. Chuyên viên phụ trách thấy sai thì bấm "Yêu cầu gửi lại" kèm lý do: hệ thống gửi email cho đầu mối, đánh dấu dòng `canGuiLai = true`; khi đầu mối gửi lại, dòng cũ sang `SoLieuChiTieu_LichSu` với lý do. Tùy chọn `chiTinhSoLieuDaDuyet` chỉ còn áp dụng cho báo cáo tiến độ nhiệm vụ.
- Tổng hợp kỳ, bảng theo dõi ngưỡng (mốc gần nhất chưa tới, ngưỡng cao nhất trong các văn bản còn hiệu lực), bảng tiến độ nộp, cảnh báo lệch ngưỡng giữa văn bản: tính lúc xem từ `ChiTieu_NguonQuyDinh` và `SoLieuChiTieu`, có nút "Chốt kỳ" ghi vào `TongHopChiTieuKy`.
- Chỉ tiêu trỏ về mục tiêu (danh mục 1) và chỉ số (danh mục 3) khi có, để một màn xem được mạch mục tiêu → chỉ tiêu → nhiệm vụ.

### 8.3. Bộ chỉ số đánh giá (DTI, PAR Index, SIPAS)

- `DM_ChiSo` chứa cây tiêu chí: `maChiSo` (PAR-072, DTI-29...), `tenChiSo`, `boChiSo`, `chaChiSo`, `diemToiDa`, `nguongDanhGia`, `chuKy`, `coQuanChuTri`, `nguonDuLieu`, `vanBanQuyDinh`, hiệu lực.
- Mỗi tiêu chí có thư mục minh chứng `HTTD3/MinhChung/ChiSo/<maChiSo>/<năm>/`; nhiệm vụ gắn `maChiSo` thì minh chứng của nhiệm vụ tự xuất hiện dưới tiêu chí.
- **Kho minh chứng theo tiêu chí**, làm theo cách Hệ thống phần mềm dùng chung của Thành phố đang dùng để nộp minh chứng DTI, PAR Index (Mr. Nobody yêu cầu 15/11/2026): cột trái là cây tiêu chí (bộ chỉ số → nhóm → tiêu chí → tiêu chí thành phần, kèm điểm tối đa); cột phải là danh sách minh chứng của tiêu chí đang chọn (tên file, loại, người tải, ngày, mô tả, nút Xem, nút Tải); nút "Tải minh chứng lên" ngay tại tiêu chí; trạng thái từng tiêu chí (chưa có, đã có, đủ) và thanh tổng số tiêu chí đã có minh chứng. Xuất danh mục minh chứng theo bộ chỉ số ra Excel để đối chiếu với hệ thống Thành phố. Claude sẽ xin Mr. Nobody một ảnh chụp màn hình hệ thống Thành phố ở giai đoạn 6 để dùng đúng thuật ngữ và thứ tự cột.
- Màn "Tự đánh giá năm": nhập điểm tự chấm, trạng thái minh chứng, so điểm công bố năm trước; xuất bảng tổng hợp. Giao diện làm ở giai đoạn 6; bảng và thư mục làm từ giai đoạn 1 để Mr. Nobody dọn kho PAR, DTI hiện có vào đúng chỗ ngay khi chuyển.

### 8.4. Minh chứng và tài liệu

- Tải lên ngay trong trang: file đọc thành base64, gửi `doPost action=taiMinhChung` (text/plain), API tạo file trong thư mục đúng bằng `DriveApp`, ghi `MinhChung`. Giới hạn 10 MB mỗi file; lớn hơn thì hướng dẫn kéo vào thư mục Drive rồi bấm "Quét lại thư mục".
- **Xem minh chứng không phụ thuộc Gmail** (chốt 15/11/2026): người dùng bấm Xem, trang gọi `action=xemMinhChung`, API kiểm tra phiên và phạm vi rồi trả nội dung file (base64, tối đa 10 MB) để trang hiển thị ngay bằng trình xem PDF (pdf.js từ CDN), ảnh, hoặc tải xuống với file Word, Excel. Thư mục Drive vẫn chỉ tài khoản Mr. Nobody sở hữu. Bổ sung: tài khoản có Gmail được hệ thống tự chia sẻ quyền xem thư mục đúng phạm vi đơn vị mình, để mở trực tiếp trên Drive và tải file lớn hơn 10 MB; nút "Mở thư mục Drive" chỉ hiện với người được chia sẻ.
- Tài liệu văn bản đi (kết quả) gắn vào `ketQuaVanBan.link`, có thể là link Drive hoặc link hệ thống văn bản.

### 8.5. Báo cáo

- Báo cáo định kỳ theo `DM_LoaiBaoCaoDinhKy`: tuần Phòng (kỳ thứ Bảy đến thứ Sáu, cấu trúc đã xác định ở bản sổ việc: đã hoàn thành gom theo loại sản phẩm, tồn đọng, kỳ tới, khó khăn), tháng (cùng khung), quý CCHC và CĐS (bảng nhiệm vụ theo kế hoạch kèm tiến độ, bảng chỉ tiêu kèm giá trị và ngưỡng), 6 tháng, năm.
- Mọi báo cáo sinh thành văn bản sửa được trên trang, lưu `BaoCaoDaSinh`, sao chép được, tải .docx (thư viện docx từ CDN, thể thức phần nội dung theo NĐ 30, phông Times New Roman 14).
- Báo cáo chuyên đề: chọn loại trong danh mục 8 hoặc tạo mới, chọn phạm vi nhiệm vụ, chỉ tiêu, kỳ; sinh khung và bảng số liệu.
- Phạm vi: LANHDAO và KIEMDUYET sinh toàn xã; CHUYENVIEN sinh theo lĩnh vực của mình; DONVI sinh phần đơn vị mình.

### 8.6. Cổng Claude

- **Hợp đồng JSON** (một file một văn bản): `{"nguon": {...văn bản...}, "nhiemVu": [{"tenNhiemVu", "noiDung", "linhVucThucHien", "thoiHanThucHien", "mucDoUuTien", "loaiSanPham", "coQuanChuTri", "coQuanPhoiHop": [...], "maChiSo": [...], "lienKetNhiemVu", "yeuCauDauVao": [{"maDonVi", "noiDung", "hanCungCap"}]}], "nguoiTao": "claude", "phienBanHopDong": 1}`.
- **Đường A, Hộp thư Drive:** lịch 5 phút đọc `ChoNhap`, kiểm tra hợp đồng (mã đơn vị, lĩnh vực có trong danh mục; thiếu thì vẫn tạo nhưng ghi cảnh báo), tạo `NhiemVu` với `nhapTu = claude`, `trangThaiXacNhan = chờ xác nhận`, tạo `YeuCauDauVao`, chuyển file sang `DaNhap/<ngày>/`, ghi `KetQua/<tên file>.ketqua.json` (mã đã cấp, cảnh báo). Claude đọc file kết quả để báo lại cho Mr. Nobody.
- **Quy tắc lọc khi Claude trích xuất** (chốt 14/11/2026): chỉ việc thuộc năm mảng CCHC, CĐS, KHCN ĐMST, TCĐL và SHTT, TTTT; việc mảng khác liệt kê trong câu trả lời để chuyển đồng nghiệp, không ghi.
- **Skill `ghi-nhiem-vu-httd3`:** mô tả chuỗi skill trích xuất hiện có, cách ánh xạ sang hợp đồng, cách tạo file trong thư mục Hộp thư bằng kết nối Google Drive, cách đọc file kết quả. Đây là sản phẩm bàn giao của giai đoạn 4.
- **Đường B:** `doPost action=nhapTuClaude` với `apiKey` của tài khoản dịch vụ `claude-nhaplieu` (vai trò chỉ được tạo bản ghi chờ xác nhận). Khóa lưu `PropertiesService` và trên máy Mr. Nobody.
- **Đường C:** màn "Nhập từ Claude" dán JSON, xem trước, lưu.
- **Chiều đọc:** lịch 06:00 hằng ngày xuất `HTTD3/XuatDuLieu/tomtat_hom_nay.json` (việc của Mr. Nobody, quá hạn, cần nhắc, chỉ tiêu chưa nộp) để Claude đọc qua Drive khi được hỏi "hôm nay có gì".

### 8.7. Quản trị và vận hành

- Người dùng: tạo, khóa, đặt lại mật khẩu, gán vai trò và đơn vị, gán email Google; nhật ký đăng nhập.
- Kỳ báo cáo và hạn chốt; kỳ hiện tại; cấu hình chung (tên cơ quan, địa danh, nơi nhận báo cáo, số ngày nhắc hạn, chỉ tính số liệu đã duyệt, mẫu tin nhắn).
- Nhập Excel cho nhiệm vụ, chỉ tiêu, số liệu; xuất Excel mọi bảng.
- Lịch 01:00 sao lưu ba file Sheets vào `HTTD3/SaoLuu/` (giữ 30 ngày, giữ bản ngày 1 hằng tháng 24 tháng); 02:00 kiểm tra toàn vẹn (khóa ngoài tồn tại, tổng hợp khớp chi tiết, mã không trùng, trạng thái hợp lệ) ghi `KiemTraToanVen` và email QUANTRI khi có lệch.
- Màn "Sức khỏe hệ thống": lần sao lưu cuối, kết quả toàn vẹn, số thư đã gửi hôm nay, hạn mức còn lại, lỗi Hộp thư Claude.

## 9. Giao diện

### 9.1. Màn hình theo vai trò

| Màn | QUANTRI | KIEMDUYET | CHUYENVIEN | DONVI | LANHDAO |
|---|---|---|---|---|---|
| Bảng điều khiển (số liệu toàn xã, cảnh báo đỏ vàng, tiến độ nộp) | ✓ | ✓ | theo lĩnh vực | theo đơn vị | ✓ |
| Việc của tôi, Cần nhắc, Chờ xác nhận | ✓ | | ✓ | | |
| Nhiệm vụ (danh sách, chi tiết, giao, nhập Excel) | ✓ | xem | lĩnh vực | xem của mình | xem |
| Báo cáo tiến độ kỳ (đơn vị) | ✓ | | | ✓ | |
| Duyệt | ✓ | ✓ | | | |
| Chỉ tiêu (danh mục, nguồn quy định, bảng theo dõi, cảnh báo) | ✓ | ✓ | lĩnh vực | | xem |
| Nhập số liệu kỳ (đầu mối) | ✓ | | | ✓ | |
| Bộ chỉ số, tự đánh giá (giai đoạn 6) | ✓ | ✓ | ✓ | | xem |
| Báo cáo (sinh, lịch sử) | ✓ | ✓ | ✓ | của mình | ✓ |
| Danh mục (màn chung theo `DM_CauTruc`) | ✓ | | | | |
| Quản trị (người dùng, kỳ, cấu hình, sức khỏe) | ✓ | | | | |

Điện thoại: thanh điều hướng dưới với bốn mục theo vai trò và nút Thêm; máy tính: thanh bên trái. Chi tiết mở dạng tấm trượt. Tải dữ liệu một lần theo vai trò khi mở (`action=khoiDong` trả danh mục và dữ liệu trong phạm vi), làm việc trên bộ nhớ, ghi theo lô, làm mới khi quay lại tab sau 10 phút.

### 9.2. Hệ thống thiết kế

Giữ nguyên hệ thống thiết kế đã xác định ở bản sổ việc (token ba tầng, màu trạng thái lấy từ `DM_MucDo`, màu lĩnh vực chỉ là nhãn phụ, phông Inter, cỡ gốc 16 px, thành phần nút, nhãn trạng thái, thẻ, ô nhập, chip lọc, tấm trượt, ô số, thông báo nổi, trạng thái rỗng, mỗi thành phần đủ trạng thái). Bổ sung: bảng dữ liệu có sắp xếp, lọc, cố định cột mã; biểu mẫu nhập số liệu theo kỳ dạng lưới một chỉ tiêu một dòng; thanh tiến độ nộp theo nhóm đầu mối; cây tiêu chí cho Bộ chỉ số. Văn bản giao diện tiếng Việt, động từ ngắn, không lẫn tiếng Anh. Tương phản 4,5:1, bàn phím đủ, đích chạm 44 px.

## 10. Bảo mật và dữ liệu

- Mọi yêu cầu qua một cửa `doPost` với `{phien, action, duLieu}`; API từ chối action không có trong bảng phân quyền theo vai trò; mọi truy vấn của DONVI thêm điều kiện `maDonVi` phía máy chủ.
- Mã phiên 32 ký tự ngẫu nhiên, 12 giờ, thu hồi khi đổi mật khẩu hoặc khóa tài khoản; mỗi người tối đa 5 phiên.
- Không bí mật nào trong kho GitHub: Client ID công khai; khóa API, muối, cấu hình thư trong `PropertiesService`.
- Sheets chỉ chia sẻ với tài khoản Mr. Nobody; không ai khác mở trực tiếp.
- Nhật ký không xóa; sao lưu 30 ngày; biên bản đối chiếu mỗi lần chuyển đổi hay nâng cấp lớn.
- Hạn mức thư: gộp theo người; nếu vượt 90 thư một ngày thì dừng và ghi cảnh báo.

## 11. Chuyển đổi một lần

### 11.1. Danh sách ngang HTTD 2.0 (bắt buộc trước ngày chuyển)

Suy từ nhật ký hệ thống, cấu trúc bảng và hướng dẫn sử dụng của HTTD 2.0; **cần đối chiếu với mã nguồn `Code_v2.gs`, `index_v2_1.html` khi Mr. Nobody cung cấp**:

1. Đăng nhập tên và mật khẩu băm có muối, khóa sau sai liên tiếp, bắt buộc đổi mật khẩu lần đầu; đặt lại PIN.
2. Vai trò QuanTri, KiemDuyet, NhapLieu, LANHDAO với phạm vi đơn vị.
3. Danh mục kế hoạch, nhiệm vụ (26 cột), lĩnh vực, đơn vị, kỳ báo cáo và hạn chốt, cấu hình chung.
4. Nhập Excel nhiệm vụ: thêm mới và cập nhật theo mã (566 lượt ghi nhật ký).
5. Đơn vị gửi báo cáo tiến độ theo kỳ; gửi lại sang lịch sử; tổng hợp kỳ theo nhiệm vụ.
6. Kiểm duyệt: duyệt, trả lại, ghi chú.
7. Email nhắc hạn nhiệm vụ (47 lượt), nhắc nộp báo cáo.
8. Bộ chỉ tiêu: 53 chỉ tiêu, 75 nguồn quy định có hiệu lực, 34 đầu mối, phân công nhập theo ba nhóm, số liệu tử số mẫu số theo kỳ, lịch sử số liệu, tổng hợp kỳ, tiến độ nộp, bảng theo dõi ngưỡng theo quy tắc mốc gần ngưỡng cao, cảnh báo lệch giữa văn bản, nhật ký thay đổi danh mục.
9. Kiểm tra toàn vẹn hằng đêm; sao lưu hằng đêm hai file.
10. Biên bản đối chiếu chuyển đổi và kế hoạch hợp nhất tài khoản.

### 11.2. Kịch bản ngày chuyển

1. Từ khoảng 15/12/2026: Mr. Nobody kiểm thử một mình ít nhất hai tuần với bản sao dữ liệu thật, theo danh sách kịch bản thử Claude soạn cho từng vai trò (đăng nhập, giao việc, đơn vị báo cáo, duyệt, nhập số liệu, tổng hợp, nhắc email, Claude ghi việc, sinh báo cáo, sao lưu, toàn vẹn); mọi mục 11.1 có bằng chứng chạy được; lỗi tìm thấy sửa xong trước 02/01/2027.
2. 02/01/2027: quyết định đi hay dừng. Đi thì tài liệu hướng dẫn cho đơn vị (2 trang) và video 5 phút đã có; thông báo lãnh đạo Phòng và các đơn vị ngày chuyển và tài khoản mới. Dừng thì lùi sang tuần sau, không chuyển nửa chừng.
3. Ngày D (dự kiến thứ Hai 04/01/2027), 17:00: khóa HTTD 2.0 (đặt mọi tài khoản trừ quản trị về trạng thái Khóa), sao lưu cuối.
4. Chạy bộ chuyển đổi `/migrate` (Apps Script, một nút): đọc hai file nguồn, ghi vào ba file đích theo bản đồ 7.5, ghi `DoiChieuChuyenDoi` theo từng bảng: số dòng nguồn, số dòng đích, tổng kiểm theo cột khóa, kết luận ĐẠT hay LỆCH.
5. Lệch thì sửa và chạy lại từ bản sao lưu; ĐẠT toàn bộ mới mở HTTD 3.0 cho người dùng (bật tài khoản, gửi email hướng dẫn kèm link).
6. Ngày D+1 đến D+14: Mr. Nobody trực hỗ trợ; HTTD 2.0 để chế độ chỉ đọc để tra cứu; sau 14 ngày đổi tên file HTTD 2.0 thành `LUUTRU_HTTD2_...`.

## 12. Giai đoạn xây dựng

Tất cả giai đoạn 1 đến 5 hoàn thành trước ngày chuyển; mỗi giai đoạn kết thúc bằng Mr. Nobody dùng thử và duyệt.

**Vòng phát triển và kiểm thử.** Phiên Claude trên đám mây không gọi được Apps Script, nên mã Apps Script chia hai lớp: lớp nghiệp vụ thuần (tính toán, kiểm tra, ánh xạ, sinh báo cáo) viết dưới dạng hàm không đụng `SpreadsheetApp`, có bộ kiểm thử chạy bằng Node ngay trong kho GitHub; lớp mỏng gắn với Sheets, Drive, Mail chỉ gọi lớp trên. Giao diện kiểm thử bằng trình duyệt tự động trong phiên Claude với API giả lập. Mr. Nobody đã có tài khoản GitHub và Claude Code trên máy tính (15/11/2026). Triển khai Apps Script: giai đoạn 1 bắt đầu bằng cách (a) Mr. Nobody chạy `clasp login` một lần rồi `clasp push` và `clasp deploy` trên máy mình theo hướng dẫn từng bước (Claude Code trên máy có thể chạy giúp); khi đã quen, chuyển sang (b) GitHub Actions chạy clasp bằng thông tin đăng nhập lưu trong bí mật của kho, để mỗi lần Claude đẩy mã lên nhánh chính là Apps Script được cập nhật. Mỗi lần bàn giao kèm danh sách bước thử cụ thể để Mr. Nobody xác nhận trên hệ thống thật.

| Giai đoạn | Nội dung | Nghiệm thu |
|---|---|---|
| 1. Nền tảng | Kho GitHub, cấu trúc `/web`, `/gas`, clasp; ba file Sheets với toàn bộ bảng và `DM_CauTruc`; đăng nhập Google và mật khẩu; khung API một cửa; màn Danh mục chung; nhật ký; sao lưu và toàn vẹn đêm; thư mục Drive gốc | Đăng nhập được hai cách trên điện thoại; sửa một danh mục và thấy nhật ký; sao lưu đêm chạy |
| 2. Nhiệm vụ | Toàn bộ 8.1, nhập Excel, email nhắc hạn, Việc của tôi, yêu cầu đầu vào, Cần nhắc, duyệt | Chuyển thử 200 nhiệm vụ HTTD; một đơn vị gửi báo cáo kỳ, kiểm duyệt duyệt; email nhắc đúng người |
| 3. Chỉ tiêu | Toàn bộ 8.2 | Chuyển thử 53 chỉ tiêu, 75 nguồn, số liệu hiện có; bảng theo dõi ra đúng ngưỡng như `6_BANG_THEODOI`; cảnh báo ra đúng như `7_CANHBAO` |
| 4. Minh chứng, báo cáo, cổng Claude | 8.4, 8.5 (tuần, tháng, quý), 8.6 ba đường, skill `ghi-nhiem-vu-httd3`, xuất tóm tắt hằng ngày | Tải file lên từ điện thoại; sinh báo cáo tuần đúng cấu trúc Phòng; Claude ghi 5 nhiệm vụ từ một công văn thật qua Hộp thư Drive |
| 5. Chuyển đổi | Bộ `/migrate`, đối chiếu, tài liệu hướng dẫn, kịch bản 11.2 | Chạy thử chuyển đổi trên bản sao: ĐẠT toàn bộ bảng |
| 6. Bộ chỉ số (sau chuyển) | Giao diện 8.3, nạp cây tiêu chí DTI, PAR Index, SIPAS năm hiện hành, dọn kho minh chứng hiện có | Tự đánh giá một bộ chỉ số, xuất bảng |

## 13. Để người xây tự quyết

- Cách sinh mã tăng dần an toàn trong Sheets (bảng đếm + khóa) hay mã theo thời gian.
- Cấu trúc file JS của giao diện (một file hay chia theo màn), có dùng thư viện nhỏ từ CDN hay không; không dùng khung lớn cần bước biên dịch.
- Thư viện .docx và cách tạo bảng trong .docx.
- Cách phân trang và tìm kiếm khi bảng nhiệm vụ vượt 1.000 dòng.
- Bố cục email nhắc hạn.
- Cách đặt lịch GitHub Actions để `clasp push` tự động, nếu Mr. Nobody muốn; nếu không, hướng dẫn chạy tay trên máy.

## 14. Quyết định đã chốt và điều cần đối chiếu

**Mr. Nobody quyết định (14/11/2026):** xây hệ thống mới thống nhất thay HTTD 2.0; lấy Khung kiến trúc dữ liệu Thành phố làm danh mục dùng chung; nền tảng lai GitHub Pages + Apps Script + Sheets + Drive + GitHub; chuyển một lần; mô hình đôn đốc theo đơn vị với tin nhắn soạn sẵn; bốn điểm về phạm vi năm mảng, báo cáo tháng theo khung tuần, nhiệm vụ kế hoạch tự vào báo cáo, gom theo loại sản phẩm. **(15/11/2026):** ngày chuyển tuần đầu tháng 1/2027 sau khi tự kiểm thử; đã có GitHub và Claude Code trên máy, Google Cloud Console sẽ tạo mới không dùng thẻ; kho minh chứng theo tiêu chí làm giống hệ thống DTI, PAR Index của Thành phố; số liệu chỉ tiêu không qua duyệt, có "Yêu cầu gửi lại".

**Claude quyết định (có thể bác):** xem minh chứng qua hệ thống bằng nội dung file tối đa 10 MB, không bắt buộc Gmail; chia sẻ Drive chỉ là bổ sung cho tài khoản có Gmail; kiểm thử hai tuần từ 15/12/2026, đi hay dừng 02/01/2027, ngày D dự kiến 04/01/2027; cột `maThanhPho` dự phòng cho mã Thành phố, mã nội bộ giữ làm khóa; một bảng kỳ dùng chung có `loaiKy` và `apDungCho`; tài khoản có `danhSachDonVi`; hai lớp mã Apps Script có kiểm thử Node; ba file Sheets; tên bảng và cột; bộ trạng thái và mức độ ở 7.4; Hộp thư Drive là đường ghi chính cho Claude; đăng nhập Google kèm mật khẩu dự phòng; vai trò CHUYENVIEN tách khỏi QUANTRI; thay Google Forms bằng màn nhập trong hệ thống; màn Danh mục chung theo `DM_CauTruc`; bảng theo dõi và cảnh báo chỉ tiêu tính lúc xem; giới hạn 10 MB mỗi file tải lên; thứ tự sáu giai đoạn.

**Cần đối chiếu với mã nguồn HTTD 2.0** (Mr. Nobody tải `Code_v2.gs` và `index_v2_1.html` lên Drive, hoặc dán nội dung): quy tắc tính `TongHopNhiemVuKy`; nội dung email nhắc hạn và nhắc báo cáo; mẫu Excel nhập nhiệm vụ; các bước chuyển đổi B1 đến B3 đã làm; cách biểu mẫu Google Forms đổ vào `5_SOLIEU`; bất kỳ chức năng nào chưa thấy trong nhật ký.


---

## Phụ lục A. Trường của 13 danh mục mục IV, Khung kiến trúc dữ liệu Thành phố (do Mr. Nobody cung cấp 14/11/2026)

Quy ước mã cột: bỏ dấu, viết camelCase, giữ nguyên nghĩa; cột hệ thống (`ma`, `taoLuc`, `taoBoi`, `capNhatLuc`, `capNhatBoi`, `tinhTrang`, `maThanhPho`) thêm sau các cột của Thành phố.

**A1. `DM_MucTieu` — Danh mục mục tiêu phát triển theo giai đoạn:** maMucTieu; tenMucTieu; giaiDoanApDung; capMucTieu (quốc gia, Thành phố, ngành, xã); linhVucPhatTrien (Kinh tế, Xã hội, Môi trường, Quốc phòng – An ninh); nhomMucTieu (Tổng quát, Cụ thể); noiDungMoTa; coQuanChuTriTheoDoi; coQuanPhoiHop; vanBanCanCu; phamViApDung; hieuLucTu; hieuLucDen; tinhTrangApDung.

**A2. `DM_ChiTieu` — Danh mục chỉ tiêu phát triển kinh tế – xã hội:** maChiTieu; tenChiTieu; giaiDoanApDung; linhVucThongKe; nhomChiTieu (Chủ yếu, Bổ sung); donViTinh (→ `DM_DonViDo`); giaTriMucTieu; giaTriThucHien (lấy từ `TongHopChiTieuKy`, không nhập tay); coQuanChuTriTheoDoi; nguonSoLieu (→ `DM_NguonDuLieu`); chuKyBaoCao; phamViApDung; vanBanQuyDinh; apDungTu; apDungDen; tinhTrangApDung. Cột kế thừa từ `2_DM_CHITIEU` giữ thêm: nhom (Chính quyền số, Kinh tế số, Xã hội số), chieuDanhGia, mucLienQuanCapXa (A, B, C), donViChuTriTaiXa, donViPhoiHop, tanSuatTheoDoi, ghiChuKhacBiet.

**A3. `DM_ChiSo` — Danh mục KPI, chỉ số đánh giá điều hành:** maChiSo; tenChiSo; linhVucDanhGia (KT–XH, CCHC, Đầu tư công, CĐS); mucTieuDoLuong (Hiệu quả, Tiến độ, Chất lượng); donViDoLuong; nguongDanhGia (Đạt, Chưa đạt, Vượt); chuKyDanhGia; coQuanChuTriTheoDoi; nguonDuLieuDauVao; vanBanQuyDinh; apDungTu; apDungDen; tinhTrangApDung. Cột bổ sung cho cây tiêu chí: boChiSo (DTI, PAR, SIPAS), chaChiSo, thuTu, diemToiDa.

**A4. Danh mục nhiệm vụ (nằm trong bảng `NhiemVu`):** maNhiemVu; tenNhiemVu; linhVucThucHien; chuongTrinhLienQuan; coQuanChuTri; coQuanPhoiHop; mucTieuNhiemVu; sanPhamDauRa; thoiHanThucHien; vanBanGiaoNhiemVu; mucDoUuTien; phamViThucHien; tinhTrangApDung. (Bảng Thành phố đánh số bỏ qua số 3.)

**A5. `DM_ChuongTrinh` — Danh mục chương trình công tác:** maChuongTrinh; tenChuongTrinh; capChuongTrinh (trung ương, tỉnh, ngành; thêm xã); giaiDoanThucHien; linhVucCongTac; coQuanChuTri; coQuanPhoiHop; mucTieuChuongTrinh; vanBanPheDuyet; phamViThucHien; thoiDiemBatDau; thoiDiemKetThuc; tinhTrangApDung. Kế thừa từ `DM_KeHoach`: soKyHieu, ngayBanHanh, trichYeu, vbChiDaoGoc.

**A6. `DM_TrangThai` — Danh mục trạng thái thực hiện nhiệm vụ:** maTrangThai; tenTrangThai; moTa; mucDoHoanThanh; yNghiaQuanLy (Theo dõi, Cảnh báo, Kết thúc); apDungChoLoai; apDungTu; apDungDen; tinhTrangApDung.

**A7. `DM_LoaiBaoCaoDinhKy`:** maLoaiBaoCao; tenLoaiBaoCao; capBaoCao; linhVucBaoCao; chuKyBaoCao (Tháng, Quý, 6 tháng, Năm; thêm Tuần); thoiHanNop; coQuanLap; coQuanNhan; hinhThucBaoCao; nguonDuLieuChinh; mucDoCongKhai; apDungTu; apDungDen; tinhTrangApDung. Cột bổ sung: mauSinh (tên mẫu sinh báo cáo trong hệ thống).

**A8. `DM_LoaiBaoCaoChuyenDe`:** maLoaiBaoCao; tenLoaiBaoCao; linhVucBaoCao; mucTieu; phamViNoiDung; capYeuCau; coQuanChuTri; coQuanPhoiHop; hinhThucBaoCao; nguonDuLieuDauVao; thoiHanHoanThanh; vanBanYeuCau; mucDoCongKhai; apDungTu; apDungDen; tinhTrangApDung.

**A9. `DM_NguonDuLieu`:** maNguon; tenNguon; coQuanChuQuan; donViCungCap; tanSuatCapNhat; phuongThucTichHop (API, Đồng bộ CSDL, File, Nhập tay); mucDichSuDung.

**A10. `DM_DonViDo`:** maDonViDo; tenDonViDo; kyHieu; nhomDonViDo; loaiDuLieu (Số nguyên, Số thực, Phần trăm); moTa; heDoLuong; donViGoc; heSoQuyDoi; tinhTrangApDung.

**A11. `DM_MucDo`:** maMucDo; tenMucDo; loaiMucDoApDung (Đánh giá KPI, Trạng thái điều hành, Cảnh báo); thuTu; giaTriDinhLuong; khoangGiaTri; yNghiaQuanLy; mauSacHienThi; mucDoUuTienXuLy; hanhDongGoiY; phamViApDung; doiTuongApDung; canCu; apDungTu; apDungDen; tinhTrangApDung.

**A12. `DM_KichBan`:** maKichBan; tenKichBan; linhVuc; dieuKienKichHoat; mucTieuDieuHanh; phamViApDung; capDoDieuHanh; coQuanChuTri; moTa; thoiGianApDungDuKien; nguonDuLieuTheoDoi; vanBanCanCu; thoiDiemBanHanh; tinhTrangKichBan. (Tạo sẵn, chưa có giao diện riêng.)

**A13. `DM_MoHinh`:** maMoHinh; tenMoHinh; linhVucApDung; mucTieu; phamViApDung; capDoSuDung; phuongPhap; nguonDuLieuDauVao; thoiGianDuLieuDauVao; chuKyChay; ketQuaDauRa; doTinCay; coQuanChuTriXayDung; donViVanHanh; heThongTrienKhai; vanBanCanCu; thoiDiemSuDung; tinhTrangMoHinh. (Tạo sẵn, chưa có giao diện riêng.)

## Phụ lục B. Tiêu đề cột thật của HTTD 2.0 (trích ngày 14/11/2026)

- `DM_KeHoach` (7): MaKH, SoKyHieu, NgayBanHanh, TrichYeu, LinhVuc, VBChiDaoGoc, TrangThai.
- `DM_NhiemVu` (26): Ma, MaKH, LinhVuc, NoiDung, ChiTieuGiao, SanPham, VBChiDaoGoc, DonViChuTri, DonViPhoiHop, ChuyenVien, EmailPhuTrach, ThoiHan, KyBaoCao, MaLienKet, MaIndex, TrangThai, PhanTram, KetQua, VuongMac, BaoCaoDonVi, TrangThaiDuyet, CapNhatCuoi, MaCDS, MaCDS_HoTro, ThoiHanGoc, NgungTheoDoi. Lưu ý: một số ô NoiDung, KetQua, VuongMac chứa xuống dòng; bộ chuyển đổi phải đọc theo ô, không theo dòng văn bản.
- `CapNhat_TienDo` (14): ThoiGian, Loai, Ma, DonViBaoCao, KyBaoCao, TrangThai, PhanTram, KetQua, VuongMac, HoTenNguoiCapNhat, Email, VaiTro, GhiChu, TrangThaiDuyet.
- `BC_NHIEMVU` (18): MaBanGhi, DonVi, Loai, Ma, VaiTroDonVi, KyBaoCao, NgayBaoCao, TrangThai, PhanTram, KetQua, VuongMac, SanPham, NguoiGui, ThoiDiem, TrangThaiDuyet, NguoiDuyet, ThoiDiemDuyet, GhiChuDuyet. `BC_NHIEMVU_LICHSU` thêm: ThoiDiemThayThe, NguoiThayThe, MaBanGhiMoi, LyDo.
- `TH_NHIEMVU_KY` (12): Loai, Ma, KyBaoCao, SoDonViPhaiBC, SoDonViDaBC, DonViChuaBC, PhanTramChung, TrangThaiChung, TrangThaiDuyet, KetQuaGhep, VuongMacGhep, CapNhatLuc.
- `PhanQuyen_CU` (8): Email, HoTen, VaiTro (QuanTri, KiemDuyet, NhapLieu), DonVi, LinhVucPhuTrach, PinHash, TrangThai, GhiChu.
- `0A_TAIKHOAN` (15): Tên đăng nhập, Họ tên, Vai trò (QUANTRI, LANHDAO, ...), Mã đầu mối, Mật khẩu (băm SHA-256), Muối, Trạng thái, Lần đăng nhập cuối, Số lần sai liên tiếp, Khóa đến, Ghi chú, Email, Đơn vị (phân hệ nhiệm vụ), Lĩnh vực phụ trách, Bắt buộc đổi mật khẩu.
- `CHUYENDOI_TAIKHOAN` (10): Tên đăng nhập 2.0, Họ tên, Vai trò 2.0, Đơn vị, Mã đầu mối, Email, Tài khoản Bộ chỉ tiêu (nguồn), Tài khoản HTTD (email nguồn), Cùng người?, Ghi chú.
- `CauHinh`: cặp khóa và giá trị (TenCoQuan, DiaDanh, KyHienTai, EmailQuanTri, SoNgayNhacHan = 7, ChiTinhSoLieuDaDuyet = Không, NoiNhanBaoCao, KyChuyenDoi1x, BCT_SPREADSHEET) và ba danh sách đặt cạnh: lĩnh vực (CĐS, CCHC, KHCN, TTTT, ĐMST, SHTT, TĐC, HTTT, KTS, XHS), đơn vị chủ trì, kỳ báo cáo kèm hạn chốt (Tháng 7/2026 → 20/07/2026; Quý III/2026 và 9 tháng → 20/09/2026; Năm 2026 → 20/11/2026; Quý IV/2026 → 20/12/2026; 6 tháng đầu năm → 20/06/2026).
- `NhatKy_HeThong` (8): ThoiGian, Email, HoTen, VaiTro, HanhDong, DoiTuong, TruocKhiSua, SauKhiSua. Hành động đã thấy: NhapExcel_ThemMoi, NhapExcel_CapNhat, GuiEmailNhacHan, GuiEmailNhacBaoCao, GuiBaoCaoNhiemVu, DangNhap, DangXuat, DatPin, WebApp, ChuyenDoi_B1_SaoChep, ChuyenDoi_B2_TaiKhoan, ChuyenDoi_B3_DoiChieu, DongBoToanVen_QH5, NangCap_v20.
- `1_DM_VANBAN` (8): Mã VB, Số hiệu, Ngày ban hành, Cấp ban hành, Trích yếu, Tình trạng, Phạm vi / giai đoạn, Ghi chú.
- `1B_DM_DAUMOI` (9): Mã đầu mối, Tên đầy đủ, Tên viết tắt, Nhóm (DV, TH, AP), Phân loại, Người phụ trách, Email, Đang hoạt động, Ghi chú. 34 dòng: DV01–DV07, TH01–TH16, AP01–AP11.
- `2_DM_CHITIEU` (11): Mã chỉ tiêu, Tên chỉ tiêu (chuẩn hóa), Nhóm, Đơn vị tính, Chiều đánh giá, Mức liên quan cấp xã, Đơn vị chủ trì tại xã, Đơn vị phối hợp, Nguồn số liệu tại xã, Tần suất theo dõi, Ghi chú / khác biệt giữa các văn bản.
- `2B_PHANCONG` (9): Mã chỉ tiêu, Tên chỉ tiêu, Nhóm đầu mối nhập (DV, TH, AP, XA), Số đầu mối phải nộp, Cách tổng hợp, Câu hỏi TỬ SỐ, Câu hỏi MẪU SỐ, Đơn vị tính, Ghi chú hiện trên biểu mẫu.
- `3_NGUON_QUYDINH` (14): Mã chỉ tiêu, Mã VB, Số hiệu văn bản, Vị trí trong văn bản, Nguyên văn chỉ tiêu, Ngưỡng (nguyên văn), Ngưỡng (số), Đơn vị tính, Mốc hoàn thành (năm), Cơ quan chủ trì đo lường, Ghi chú, Tình trạng hiệu lực, Bị thay thế bởi (mã VB), Ngày cập nhật.
- `4_NHATKY` (9): Thời điểm, Người thực hiện, Sheet, Ô, Loại thay đổi, Mã chỉ tiêu / Mã VB, Giá trị cũ, Giá trị mới, Căn cứ / ghi chú.
- `5_SOLIEU` (16): Mã chỉ tiêu, Mã đầu mối, Tên đầu mối, Nhóm, Kỳ báo cáo, Ngày chốt số liệu, Tử số, Mẫu số, Giá trị, Đơn vị tính, Nguồn số liệu, Người nhập, Ghi chú, Cách nhập (Web app, Thủ công, Biểu mẫu), Thời điểm ghi nhận, Mã bản ghi (SL-000001...). `5X_LICHSU` thêm: Thời điểm bị thay thế, Bị thay thế bởi (mã bản ghi), Người thay thế, Lý do.
- `5C_TONGHOP_KY` (11): Mã chỉ tiêu, Tên chỉ tiêu, Kỳ báo cáo, Ngày chốt, Tổng tử số, Tổng mẫu số, Giá trị toàn xã, Đơn vị tính, Đầu mối đã nộp, Đầu mối phải nộp, Trạng thái thu thập.
- `6_BANG_THEODOI` (16): Mã chỉ tiêu, Tên chỉ tiêu, Nhóm, Mức liên quan, Đơn vị chủ trì tại xã, Số VB quy định, Mốc áp dụng, Ngưỡng áp dụng, Đơn vị tính, Ngày chốt gần nhất, Giá trị mới nhất, Tỷ lệ đạt, Trạng thái, Đầu mối đã nộp, Đầu mối phải nộp, Ghi chú / cảnh báo. Tham số: năm đang theo dõi.
- `7_CANHBAO` (7): Mã chỉ tiêu, Tên chỉ tiêu, Số VB quy định, Loại khác biệt, Chi tiết ngưỡng theo từng văn bản, Cơ quan chủ trì đo lường, Khuyến nghị xử lý.
- `9_DANHMUC` (8): Nhóm chỉ tiêu, Mức liên quan cấp xã, Đơn vị chủ trì tại xã, Tần suất, Chiều đánh giá, Mốc hoàn thành, Nhóm đầu mối, Cách tổng hợp.
- `KIEMTRA_TOANVEN` (7): Quan hệ, Sheet, Ô, Giá trị hiện tại, Giá trị đúng, Kết quả, Ghi chú; dòng tiêu đề ghi thời điểm chạy và số chỗ lệch. `DOICHIEU_CHUYENDOI` (6): Sheet, Hạng mục, Nguồn, Đích, Kết quả, Chi tiết.
