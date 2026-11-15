# Sổ theo dõi thực hiện giai đoạn 1 (sao chép từ ledger, kết thúc 15/11/2026)

# SDD ledger — plan: docs/superpowers/plans/2026-11-15-httd3-giai-doan-1-nen-tang.md
Spec: docs/superpowers/specs/2026-11-14-httd3-design.md (bản 0.3, đã duyệt 15/11/2026)
Executor: inline (superpowers:executing-plans), branch giai-doan-1 from main@311dca0
Ruling: làm việc tại chỗ trên nhánh giai-doan-1 của kho mới, không tạo worktree — kho vừa khởi tạo, main chỉ có commit bootstrap, không có gì cần bảo vệ — nếu sai: phải tách nhánh lại, chi phí nhỏ.
Ruling: commit bootstrap (package.json, .gitignore) làm trước Task 1 vì script task-start cần một commit; phần còn lại của Task 1 (bộ nạp, test, README) làm theo kế hoạch — nếu sai: lịch sử commit lệch một chút so với kế hoạch, không ảnh hưởng sản phẩm.

## Pre-flight (giao diện giữa các task)
- T2 SoDo → T3 Bang (dongTieuDe, khoaChinh, cot.kieu/tuyChon/thamChieu/an): khớp.
- T2 SoDo → T4 MaSo (tienToMa, dinhDangMa): khớp; lưu ý T12 cần SoDo.BANG[t].ten (tên hiển thị) — Ruling: thêm trường `ten` cho mỗi bảng ngay ở T2 để T12 không phải sửa sơ đồ — nếu sai: thừa một trường, vô hại.
- T5 Phien.conHan/T6 DieuPhoi: DieuPhoi dùng Phien.conHan(phien, bayGioIso): khớp.
- T6 PhanQuyen.BANG ↔ T9 handlers ↔ T11/T12 goiApi actions ↔ T13 kiem-tra-api: cùng danh sách action; mã lỗi theo Global Constraints: khớp.
- T7 NhatKy.dong cần cột bảng NhatKy của T2: T2 phải có NhatKy với cột thoiGian, maNguoiDung, email, vaiTro, hanhDong, bang, ma, truocKhiSua, sauKhiSua, canCu: ghi nhớ khi viết T2.
- T8 DuLieuGieo ↔ T3 Bang.kiemTra ↔ T2 tuyChon: mã lĩnh vực không dấu (CDS, DMST, TDC): ghi nhớ.
- T9 KhoDuLieu.capMa dùng sheet BoDem (tienTo, nam, soHienTai): T2 phải khai báo BoDem trong HTTD3_DuLieu: ghi nhớ.
- T11 may-chu-gia dùng taiThuan() của T1 để lấy SoDo thật: khớp (CommonJS require từ .mjs qua createRequire).

## Tiến độ
Task 1: Ruling: script test đổi từ 'node --test gas/test/' sang glob "gas/test/**/*.test.js" vì Node 22 không nhận thư mục làm đối số; đã kiểm tra lại RED đúng lý do (Cannot find module './_moiTruong') và GREEN; commit Task 1 được amend trước khi đẩy — nếu sai: không, vì nhánh chưa đẩy.
Task 1: complete (commits 311dca0..c6c2bcf, tests: npm test → # duration_ms 47.374426)
Task 2: Ruling: bộ nạp đổi từ vm.createContext sang vm.runInThisContext (cùng realm với test) vì assert.deepEqual nghiêm ngặt so sánh nguyên mẫu, mảng/đối tượng từ realm khác luôn lệch; mỗi file test là một tiến trình riêng nên biến toàn cục không rò giữa các file — nếu sai: test có thể bị ảnh hưởng bởi global của Node, rủi ro thấp.
Task 2: Ruling: TongHopNhiemVuKy bỏ cột riêng capNhatLuc vì trùng cột hệ thống cùng tên — nếu sai: không, ý nghĩa giống nhau.
Task 2: Ruling: bảng nhật ký (NhatKy, PhienDangNhap, KiemTraToanVen, SaoLuu, DoiChieuChuyenDoi) và bảng *_LichSu dùng dinhDangMa TU_NHAP; mã do lớp kết nối cấp theo thời gian (<tienTo>-<yyyyMMddHHmmss>-<4 ký tự>), tránh khóa BoDem cho mỗi dòng log — nếu sai: trùng mã log cực hiếm, vô hại.
Task 2: thêm SoDo.cot(bang, khoa), SoDo.TINH_TRANG, trường ten mỗi bảng (theo pre-flight), cột chiDoc trên giaTriThucHien.
Task 2: complete (commits c6c2bcf..daddbba, tests: npm test → # duration_ms 73.745722)
Task 3: complete (commits daddbba..749f828, tests: npm test → # duration_ms 81.44745)
Task 4: Ruling: MaSo.sinh nhận thêm namHienTai (mặc định năm hiện tại) để test xác định; test reset năm viết lại với namHienTai thay vì new Date() — nếu sai: không ảnh hưởng hành vi chạy thật.
Task 4: complete (commits 749f828..2c44403, tests: npm test → # duration_ms 111.658071)
Task 5: Ruling: tách tiện ích thời gian +07:00 thành file thuần ThoiGian.gs (sangMs, tuMs, cong, ngay, truoc) dùng chung cho Phien, MatKhau, NhatKy, SaoLuu thay vì hàm nội bộ Phien._dinhDangIso — nếu sai: thêm một file, vô hại.
Task 5: complete (commits 2c44403..75512a2, tests: npm test → # duration_ms 154.487493)
Task 6: thêm PhanQuyen.tonTai/canPhien; DieuPhoi trả DU_LIEU_KHONG_HOP_LE khi thiếu action; thông báo lỗi hệ thống không lộ chi tiết nội bộ.
Task 6: complete (commits 75512a2..90f2226, tests: npm test → # duration_ms 215.093583)
Task 7: NhatKy.dong không có phiên ghi email 'he-thong'; ToanVen chỉ kiểm tra tham chiếu khi bảng đích có trong dữ liệu truyền vào (lớp kết nối truyền đủ bảng danh mục + nghiệp vụ).
Task 7: complete (commits 90f2226..22de9e0, tests: npm test → # duration_ms 250.34318)
Task 8: Ruling: DM_ChuongTrinh gieo không điền vanBanPheDuyet (DM_VanBan chưa có dữ liệu) để toàn vẹn đêm không báo tham chiếu gãy; bổ sung khi nhập danh mục văn bản — nếu sai: thiếu một liên kết, bổ sung sau bằng màn Danh mục.
Task 8: complete (commits 22de9e0..a1dbf50, tests: npm test → # duration_ms 223.432462)
Task 9: Ruling: kiểm tra cú pháp bằng cách chép .gs sang .js tạm rồi node --check (process substitution <() không đọc được bởi node) — nếu sai: không ảnh hưởng sản phẩm.
Task 9: Ruling: ghi nhật ký gộp vào KhoDuLieu.ghiNhatKy (không tách NhatKyGas) đúng danh sách file của kế hoạch; mỗi dòng ghi đặt định dạng '@' cho cột chữ ngay tại dòng đó (Review Focus 1) — nếu sai: Sheets đổi kiểu số/ngày, đã phòng.
Task 9: Ruling: ngẫu nhiên lấy từ Utilities.getUuid() (UUID v4, 122 bit) vì Apps Script không có crypto.getRandomValues — nếu sai: độ ngẫu nhiên vẫn đủ cho mã phiên và muối.
Task 9: Ruling: cột ghi thời gian khóa `khoaDen` trả '' khi mở khóa (sơ đồ datetime cho phép rỗng); heThong.sucKhoe không ném lỗi khi chưa thiết lập, trả daThietLap=false.
Task 9: complete (commits a1dbf50..7c37178, tests: npm test → # duration_ms 267.410992)
Task 10: Ruling: thietLapLanDau đọc EMAIL_QUAN_TRI, HO_TEN_QUAN_TRI từ Script Properties (người dùng điền trong trình soạn) thay vì tham số, vì nút Run không truyền được tham số — nếu sai: không, vẫn nhận tham số khi gọi từ mã.
Task 10: Ruling: thêm hai hàm toàn cục chayThietLapLanDau, chayKiemTraThietLap và hai hàm trigger saoLuuHangDem, kiemTraToanVenHangDem (trigger phải gọi hàm toàn cục theo tên) — nếu sai: không.
Task 10: Ruling: kiểm tra toàn vẹn ghi tối đa 500 dòng lệch mỗi lần (tránh phình sheet), dòng TONG_KET luôn ghi — nếu sai: lệch thứ 501 trở đi chỉ có trong email/tổng số.
Task 10: complete (commits 7c37178..1f0d6a5, tests: npm test → # duration_ms 280.023216)
Task 11: Ruling: không dùng config.local.js (gây 404 trên trang thật); máy chủ giả ghi đè config.js khi kiểm thử — nếu sai: không.
Task 11: Ruling: biểu mẫu đổi mật khẩu có ô "Nhập lại mật khẩu mới"; test phiên hết hạn điền thêm ô này — nếu sai: không.
Task 11: Ruling: test chặn yêu cầu tới accounts.google.com và fonts.g* (môi trường không có mạng ngoài) bằng page.route; trang thật vẫn tải bình thường — nếu sai: không.
Task 11: Ruling: máy chủ giả dùng lại DieuPhoi, PhanQuyen, Bang, SoDo, DuLieuGieo thật (qua taiThuan) để hành vi sát bản triển khai; chỉ xác thực mật khẩu là giả lập (so sánh chuỗi) — nếu sai: test giao diện có thể bỏ sót lỗi băm, đã có test thuần cho MatKhau.
Task 11: ảnh chụp web/test/anh/ (gitignored) đã xem: điện thoại 360 px thanh dưới, máy tính 1280 px thanh trái, đúng thiết kế.
Task 11: complete (commits 1f0d6a5..c2af52b, tests: npm run test:all → # duration_ms 3173.003831)
Task 12: Ruling: test "phiên hết hạn giữa chừng" làm hết hạn phiên SAU khi màn Quản trị đã tải xong (vì màn này giờ tự tải Người dùng, Sức khỏe nền; phiên hết hạn từ đầu sẽ mở tấm trượt đăng nhập ngay khi vào trang, đúng ý thiết kế) — nếu sai: không, hành vi hết hạn giữa chừng vẫn được kiểm chứng.
Task 12: Ruling: danh sách bảng danh mục trên màn hẹp (<1024 px) hiển thị dạng dải chọn cuộn ngang (CSS), máy tính giữ cột trái — nếu sai: chỉ là bố cục.
Task 12: Ruling: màn Danh mục ẩn DM_NguoiDung (quản lý ở Quản trị), các bảng còn lại kể cả CauHinh và DM_CauTruc sửa được qua màn chung; đổi trạng thái Khóa/Mở tài khoản dùng nguoiDung.sua với căn cứ tự điền — nếu sai: không.
Task 12: ảnh chụp web/test/anh/ đã xem: Danh mục máy tính (cột trái + bảng cột mã cố định) và điện thoại (dải chọn ngang) đúng ý.
Task 12: complete (commits c2af52bf5..24f8e8a, tests: npm run test:all → # duration_ms 4507.628024)
Task 13: Ruling: thêm .claspignore loại trừ gas/test/** và *.md khỏi clasp push — nếu thiếu, file test (require node:test) sẽ được đẩy lên Apps Script và làm MỌI lần chạy lỗi ngay khi nạp — nếu sai: không.
Task 13: Ruling: GitHub Pages không phục vụ được thư mục /web trực tiếp (chỉ root hoặc /docs), nên thêm workflow .github/workflows/pages.yml xuất bản web/ bằng GitHub Actions; tài liệu 03 hướng dẫn chọn Source = GitHub Actions — nếu sai: Mr. Nobody phải chuyển web/ ra gốc kho, tốn vài phút.
Task 13: Ruling: tài liệu 02 hướng dẫn deploy web app qua giao diện Apps Script (Deploy → New deployment, Execute as Me, Anyone) làm đường chính, clasp deploy là tùy chọn — nếu sai: không.
Task 13: bước 4–5 (Mr. Nobody triển khai và điền bảng kiểm 04) thuộc giai đoạn nghiệm thu sau khi bàn giao; lỗi phát hiện sẽ sửa theo TDD.
Task 13: complete (commits 24f8e8a..3a9ca3b, tests: npm run test:all → # duration_ms 4368.962632)

## Soát toàn nhánh (người soát độc lập, model fable) — kết quả: With fixes
Final: fixed [Critical 1] tham chiếu KhoDuLieu lúc nạp trong 4 file ketnoi → ReferenceError trên Apps Script — test "nạp toàn bộ file theo thứ tự ASCII" (KetNoi.test.js) RED→GREEN; thêm filePushOrder vào .clasp.json; suite 54/54 + 10/10.
Final: fixed [Important 2] themDongThang ghi ngoài khóa → đè dòng khi đồng thời — test "mọi ghi vào Sheets đều dưới khóa" RED→GREEN (khóa tái nhập trong KhoDuLieu.khoa).
Final: fixed [Important 3] không thu hồi phiên khi đổi mật khẩu/khóa tài khoản — test "đổi mật khẩu thu hồi các phiên khác; khóa tài khoản thu hồi mọi phiên" RED→GREEN (XacThuc.thuHoiMoiPhien).
Final: fixed [Important 4] lớp phủ đăng nhập lại xóa biểu mẫu trong tấm trượt — test Playwright "hết hạn phiên đúng lúc bấm Lưu trong tấm trượt" RED→GREEN (#dang-nhap-lai riêng).
Final: fixed [Important 5] DieuPhoi nuốt LOI_HE_THONG — test "lỗi hệ thống được ghi console.error" RED→GREEN.
Final: fixed [Important 6] email bắt buộc với người không dùng Gmail — test Bang "người dùng không có Gmail" RED→GREEN.
Final: fixed [Important 7] sheet mới 26 cột, NhiemVu 47 cột — test thiết lập lần đầu với sheet giả 26 cột RED→GREEN (insertColumnsAfter).
Final: fixed [Minor, tái xếp Important vì sao lưu đêm im lặng dừng] _thuMuc ngoài try trong saoLuuHangDem — test "thư mục sao lưu bị xóa" RED→GREEN.
Final: fixed [Minor, tái xếp Important vì trái lời hứa tài liệu 04] batBuocDoiMatKhau chỉ ép phía trang — test DieuPhoi "phiên còn mật khẩu tạm chỉ được..." RED→GREEN (cờ trên phiên, chặn ở DieuPhoi).
Final: fixed [kèm] ThietLap chạy lại xóa sheet người dùng tự thêm → chỉ xóa Sheet1/Trang tính1 còn trống (không có test riêng, thay đổi một điều kiện).
Final: fixed [kèm] _kiemTrung chạy trên cache cũ → themDong xóa cache đầu khóa (một phần Minor "kiểm trùng ngoài khóa").
Final: fixed [kèm] nhatKy.doc cùng giây xếp sai thứ tự → thêm tiêu chí dòng ghi sau đứng trước (phát hiện bởi test kết nối mới).
Final: minor (deferred): heThong.sucKhoe qua GET không cần phiên lộ tên file sao lưu, số lệch, danh sách thiếu thiết lập — nên trả bản rút gọn khi không có phiên.
Final: minor (deferred): DM_CauTruc sửa được trên giao diện nhưng không có tác dụng (giao diện sinh từ SoDo trong mã) — nên đặt chỉ đọc.
Final: minor (deferred): chuỗi bắt đầu bằng = + - @ ghi qua setValues vẫn thành công thức dù định dạng '@' — chặn hoặc thêm dấu ' ở Bang.thanhDong.
Final: minor (deferred): bản tối theo prefers-color-scheme vẫn dùng nền --blue-50 sáng cho mục chọn/chip; chip lọc 36 px dưới ngưỡng 44 px.
Final: minor (deferred): _kiemTrung tên đăng nhập vẫn ngoài khóa (hai quản trị tạo cùng tên đồng thời có thể lọt).
Final: minor (deferred): thông báo "Tài khoản chưa có mật khẩu" để lộ tài khoản tồn tại.
Final: minor (deferred): taoMatKhauTam dùng Math.random (mật khẩu tạm bắt buộc đổi); MatKhau.khop không hằng thời gian.
Final: minor (deferred): kiemTraToanVenHangDem ghi tối đa 501 dòng bằng 501 lần setValues — nên gộp một lần.
Final: minor (deferred): KIEU_CHU khai báo trùng ở KhoDuLieu và ThietLap; vài hàm thiếu chú thích tiếng Việt.
Final: minor (deferred): kiem-tra-api.mjs để lại một dòng THU… mỗi lần chạy — nên dùng mã cố định và bỏ qua nếu đã có.
Final: minor (deferred): dọn PhienDangNhap quá hạn trong việc đêm; đọc NhatKy theo khoảng dòng cuối khi bảng lớn.
Final: Ruling: 11 mục "từ chối phán xét" của người soát (làm mới sau 10 phút, sức khỏe thiếu số thư/Hộp thư Claude, lọc maDonVi, nhập Excel, KHOA_API_CLAUDE chưa dùng, GitHub Actions clasp, vanBanPheDuyet trống, maThanhPho ẩn, 5.000 vòng băm, đọc toàn bảng, UUID thay crypto) — tất cả thuộc giai đoạn sau hoặc là quyết định thiết kế đã chốt; giữ nguyên — nếu sai: bổ sung ở giai đoạn 2–4, không ảnh hưởng dữ liệu.
Final: suite sau fix pass: npm run test:all → 54/54 thuần+kết nối, 10/10 trình duyệt.
