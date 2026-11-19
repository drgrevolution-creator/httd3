/**
 * SoDo — SƠ ĐỒ DỮ LIỆU HTTD 3.0 (lớp thuần, không gọi dịch vụ Google).
 * Nguồn: bản thiết kế §7, Phụ lục A (13 danh mục Thành phố), Phụ lục B (cột HTTD 2.0).
 * Mỗi bảng = một sheet; dòng 1 khóa cột, dòng 2 tên hiển thị, dữ liệu từ dòng 3.
 */
var SoDo = (function () {
  var FILE = ['HTTD3_DanhMuc', 'HTTD3_DuLieu', 'HTTD3_NhatKy'];
  var KIEU = ['text', 'textarea', 'number', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'ref', 'email', 'json'];
  var TINH_TRANG = ['Hoạt động', 'Ngừng', 'Xóa mềm'];
  var TINH_TRANG_AP_DUNG = ['Đang áp dụng', 'Hết hiệu lực', 'Dự thảo'];
  var CO_QUAN = ['Trung ương', 'Thành phố', 'Ngành', 'Xã'];
  var THUOC_TINH_TONG_HOP = ['Tỷ lệ', 'Lũy kế từ đầu năm', 'Thời điểm', 'Phát sinh trong kỳ'];
  var CAP_DU_LIEU = ['Trung ương', 'Thành phố', 'Xã', 'Thành phố/Xã'];
  var LOAI_HE_THONG = ['Quốc gia', 'Bộ, ngành', 'Địa phương', 'Theo dõi, đánh giá'];
  var LINH_VUC_LON = ['Thông tin chung', 'Kinh tế', 'Văn hóa – xã hội', 'Đô thị, môi trường', 'Cải cách hành chính', 'Quốc phòng – an ninh', 'Xây dựng Đảng', 'Hệ thống chính trị', 'Khác'];

  // Tạo một mô tả cột. them = {batBuoc, khoaChinh, tuyChon, thamChieu, an, macDinh}
  function c(khoa, ten, kieu, them) {
    var o = { khoa: khoa, ten: ten, kieu: kieu || 'text', batBuoc: false };
    if (them) for (var k in them) o[k] = them[k];
    return o;
  }
  var kc = function (khoa, ten) { return c(khoa, ten, 'text', { batBuoc: true, khoaChinh: true }); };
  var bb = function (khoa, ten, kieu, them) { var o = c(khoa, ten, kieu, them); o.batBuoc = true; return o; };
  var sel = function (khoa, ten, tuyChon, them) { var o = c(khoa, ten, 'select', them); o.tuyChon = tuyChon; return o; };
  var ref = function (khoa, ten, bang, them) { var o = c(khoa, ten, 'ref', them); o.thamChieu = bang; return o; };
  var msRef = function (khoa, ten, bang, them) { var o = c(khoa, ten, 'multiselect', them); o.thamChieu = bang; return o; };
  var msOpt = function (khoa, ten, tuyChon, them) { var o = c(khoa, ten, 'multiselect', them); o.tuyChon = tuyChon; return o; };
  var dt = function (khoa, ten) { return c(khoa, ten, 'date'); };
  var so = function (khoa, ten) { return c(khoa, ten, 'number'); };
  var ta = function (khoa, ten) { return c(khoa, ten, 'textarea'); };
  // Ba cột hiệu lực theo Thành phố (tên trường khác nhau giữa các danh mục nên truyền vào)
  function hieuLuc(tu, den) {
    return [dt(tu, 'Thời điểm bắt đầu áp dụng'), dt(den, 'Thời điểm kết thúc áp dụng'), sel('tinhTrangApDung', 'Tình trạng áp dụng', TINH_TRANG_AP_DUNG, { macDinh: 'Đang áp dụng' })];
  }

  var DM = 'HTTD3_DanhMuc', DL = 'HTTD3_DuLieu', NK = 'HTTD3_NhatKy';
  var BANG = {};
  function bang(ten, file, nhom, tienToMa, dinhDangMa, tenHienThi, cot) {
    BANG[ten] = { file: file, nhom: nhom, tienToMa: tienToMa, dinhDangMa: dinhDangMa, ten: tenHienThi, cot: cot };
  }

  // ===== 13 DANH MỤC THÀNH PHỐ (Phụ lục A) =====
  bang('DM_MucTieu', DM, 'danhmuc', 'MT', 'SO-4', 'Mục tiêu phát triển', [
    kc('maMucTieu', 'Mã mục tiêu phát triển'), bb('tenMucTieu', 'Tên mục tiêu phát triển'), c('giaiDoanApDung', 'Giai đoạn áp dụng'),
    sel('capMucTieu', 'Cấp mục tiêu', ['Quốc gia', 'Thành phố', 'Ngành', 'Xã']),
    sel('linhVucPhatTrien', 'Lĩnh vực phát triển', ['Kinh tế', 'Xã hội', 'Môi trường', 'Quốc phòng – An ninh']),
    sel('nhomMucTieu', 'Nhóm mục tiêu', ['Tổng quát', 'Cụ thể']), ta('noiDungMoTa', 'Nội dung mô tả mục tiêu'),
    ref('coQuanChuTriTheoDoi', 'Cơ quan chủ trì theo dõi', 'DM_DonVi'), msRef('coQuanPhoiHop', 'Cơ quan phối hợp thực hiện', 'DM_DonVi'),
    ref('vanBanCanCu', 'Văn bản định hướng/căn cứ pháp lý', 'DM_VanBan'), c('phamViApDung', 'Phạm vi áp dụng')
  ].concat(hieuLuc('hieuLucTu', 'hieuLucDen')));

  bang('DM_ChiTieu', DM, 'danhmuc', 'CT', 'TU_NHAP', 'Chỉ tiêu phát triển KT-XH', [
    kc('maChiTieu', 'Mã chỉ tiêu'), bb('tenChiTieu', 'Tên chỉ tiêu'), c('giaiDoanApDung', 'Giai đoạn áp dụng'),
    sel('linhVucThongKe', 'Lĩnh vực thống kê', ['Kinh tế', 'Xã hội', 'Môi trường']), sel('nhomChiTieu', 'Nhóm chỉ tiêu', ['Chủ yếu', 'Bổ sung']),
    ref('donViTinh', 'Đơn vị tính', 'DM_DonViDo'), so('giaTriMucTieu', 'Giá trị mục tiêu (Kế hoạch)'), c('giaTriThucHien', 'Giá trị thực hiện', 'number', { chiDoc: true }),
    ref('coQuanChuTriTheoDoi', 'Cơ quan chủ trì theo dõi, tổng hợp', 'DM_DonVi'), ref('nguonSoLieu', 'Nguồn số liệu thống kê', 'DM_NguonDuLieu'),
    sel('chuKyBaoCao', 'Chu kỳ báo cáo', ['Tháng', 'Quý', '6 tháng', 'Năm']), c('phamViApDung', 'Phạm vi áp dụng'),
    ref('vanBanQuyDinh', 'Văn bản quy định/phê duyệt chỉ tiêu', 'DM_VanBan')
  ].concat(hieuLuc('apDungTu', 'apDungDen')).concat([
    sel('nhom', 'Nhóm (CĐS)', ['Chính quyền số', 'Kinh tế số', 'Xã hội số', 'Ngành, lĩnh vực']),
    sel('chieuDanhGia', 'Chiều đánh giá', ['Càng cao càng tốt', 'Càng thấp càng tốt']),
    sel('mucLienQuanCapXa', 'Mức liên quan cấp xã', ['A', 'B', 'C']), ref('donViChuTriTaiXa', 'Đơn vị chủ trì tại xã', 'DM_DonVi'),
    msRef('donViPhoiHop', 'Đơn vị phối hợp', 'DM_DonVi'), c('tanSuatTheoDoi', 'Tần suất theo dõi'), ta('ghiChuKhacBiet', 'Ghi chú / khác biệt giữa các văn bản'),
    // Giai đoạn 1b: cây, phân loại và năm trường nội dung "chuẩn"
    ref('chaChiTieu', 'Thuộc chỉ tiêu cha', 'DM_ChiTieu'), sel('linhVucLon', 'Lĩnh vực lớn', LINH_VUC_LON), sel('thuocTinhTongHop', 'Thuộc tính tổng hợp', THUOC_TINH_TONG_HOP),
    sel('capDuLieu', 'Cấp dữ liệu', CAP_DU_LIEU), c('kyBaoCaoXa', 'Kỳ báo cáo cấp xã'),
    ta('khaiNiemPhuongPhapTinh', '1. Khái niệm, phương pháp tính'), ta('phanToChuYeu', '2. Phân tổ chủ yếu'), c('kyCongBo', '3. Kỳ công bố'),
    ta('nguonSoLieuNoiDung', '4. Nguồn số liệu'), ta('coQuanChuTriThuThap', '5. Cơ quan thu thập, tổng hợp — Chủ trì'), ta('coQuanPhoiHopThuThap', '5. Cơ quan thu thập, tổng hợp — Phối hợp')
  ]));

  bang('DM_ChiSo', DM, 'danhmuc', 'CS', 'TU_NHAP', 'KPI, chỉ số đánh giá', [
    kc('maChiSo', 'Mã KPI/chỉ số đánh giá'), bb('tenChiSo', 'Tên KPI/chỉ số đánh giá'),
    sel('linhVucDanhGia', 'Lĩnh vực đánh giá', ['KT–XH', 'Cải cách hành chính', 'Đầu tư công', 'Chuyển đổi số']),
    sel('mucTieuDoLuong', 'Mục tiêu đo lường', ['Hiệu quả', 'Tiến độ', 'Chất lượng']), ref('donViDoLuong', 'Đơn vị đo lường', 'DM_DonViDo'),
    c('nguongDanhGia', 'Ngưỡng đánh giá'), sel('chuKyDanhGia', 'Chu kỳ đánh giá', ['Tháng', 'Quý', 'Năm']),
    ref('coQuanChuTriTheoDoi', 'Cơ quan chủ trì theo dõi', 'DM_DonVi'), ref('nguonDuLieuDauVao', 'Nguồn dữ liệu đầu vào', 'DM_NguonDuLieu'),
    ref('vanBanQuyDinh', 'Văn bản quy định/phê duyệt KPI', 'DM_VanBan')
  ].concat(hieuLuc('apDungTu', 'apDungDen')).concat([
    sel('boChiSo', 'Bộ chỉ số', ['DTI', 'PAR', 'SIPAS', 'Khác']), ref('chaChiSo', 'Thuộc tiêu chí cha', 'DM_ChiSo'), so('thuTu', 'Thứ tự'), so('diemToiDa', 'Điểm tối đa')
  ]));

  bang('DM_ChuongTrinh', DM, 'danhmuc', 'CTR', 'TU_NHAP', 'Chương trình công tác, kế hoạch', [
    kc('maChuongTrinh', 'Mã chương trình công tác'), bb('tenChuongTrinh', 'Tên chương trình công tác'), sel('capChuongTrinh', 'Cấp chương trình', CO_QUAN),
    c('giaiDoanThucHien', 'Giai đoạn thực hiện'), ref('linhVucCongTac', 'Lĩnh vực công tác', 'DM_LinhVuc'), ref('coQuanChuTri', 'Cơ quan chủ trì chương trình', 'DM_DonVi'),
    msRef('coQuanPhoiHop', 'Cơ quan phối hợp', 'DM_DonVi'), ta('mucTieuChuongTrinh', 'Mục tiêu chương trình'), ref('vanBanPheDuyet', 'Văn bản phê duyệt chương trình', 'DM_VanBan'),
    c('phamViThucHien', 'Phạm vi thực hiện'), dt('thoiDiemBatDau', 'Thời điểm bắt đầu'), dt('thoiDiemKetThuc', 'Thời điểm kết thúc'),
    sel('tinhTrangApDung', 'Tình trạng áp dụng', TINH_TRANG_AP_DUNG, { macDinh: 'Đang áp dụng' }),
    c('soKyHieu', 'Số ký hiệu'), dt('ngayBanHanh', 'Ngày ban hành'), c('trichYeu', 'Trích yếu'), c('vbChiDaoGoc', 'Văn bản chỉ đạo gốc')
  ]);

  bang('DM_TrangThai', DM, 'danhmuc', 'TT', 'TU_NHAP', 'Trạng thái thực hiện', [
    kc('maTrangThai', 'Mã trạng thái'), bb('tenTrangThai', 'Tên trạng thái'), c('moTa', 'Mô tả trạng thái'), so('mucDoHoanThanh', 'Mức độ hoàn thành (%)'),
    sel('yNghiaQuanLy', 'Ý nghĩa quản lý', ['Theo dõi', 'Cảnh báo', 'Kết thúc']),
    sel('apDungChoLoai', 'Áp dụng cho loại', ['Nhiệm vụ', 'Duyệt', 'Yêu cầu đầu vào', 'Chung'])
  ].concat(hieuLuc('apDungTu', 'apDungDen')));

  bang('DM_LoaiBaoCaoDinhKy', DM, 'danhmuc', 'LBC', 'SO-4', 'Loại báo cáo định kỳ', [
    kc('maLoaiBaoCao', 'Mã loại báo cáo định kỳ'), bb('tenLoaiBaoCao', 'Tên loại báo cáo định kỳ'),
    sel('capBaoCao', 'Cấp báo cáo', ['Trung ương', 'Thành phố', 'Ngành', 'Đơn vị', 'Xã']), ref('linhVucBaoCao', 'Lĩnh vực báo cáo', 'DM_LinhVuc'),
    sel('chuKyBaoCao', 'Chu kỳ báo cáo', ['Tuần', 'Tháng', 'Quý', '6 tháng', 'Năm']), c('thoiHanNop', 'Thời hạn nộp báo cáo'),
    ref('coQuanLap', 'Cơ quan lập báo cáo', 'DM_DonVi'), c('coQuanNhan', 'Cơ quan nhận báo cáo'), sel('hinhThucBaoCao', 'Hình thức báo cáo', ['Văn bản', 'Biểu mẫu', 'Điện tử']),
    ref('nguonDuLieuChinh', 'Nguồn dữ liệu đầu vào chính', 'DM_NguonDuLieu'), sel('mucDoCongKhai', 'Mức độ công khai', ['Công khai', 'Hạn chế', 'Không công khai'])
  ].concat(hieuLuc('apDungTu', 'apDungDen')).concat([c('mauSinh', 'Mẫu sinh báo cáo trong hệ thống')]));

  bang('DM_LoaiBaoCaoChuyenDe', DM, 'danhmuc', 'LCD', 'SO-4', 'Loại báo cáo chuyên đề', [
    kc('maLoaiBaoCao', 'Mã loại báo cáo chuyên đề'), bb('tenLoaiBaoCao', 'Tên loại báo cáo chuyên đề'), ref('linhVucBaoCao', 'Lĩnh vực báo cáo', 'DM_LinhVuc'),
    c('mucTieu', 'Mục tiêu báo cáo chuyên đề'), ta('phamViNoiDung', 'Phạm vi nội dung báo cáo'), sel('capYeuCau', 'Cấp yêu cầu báo cáo', ['Trung ương', 'Thành phố', 'Ngành']),
    ref('coQuanChuTri', 'Cơ quan chủ trì thực hiện báo cáo', 'DM_DonVi'), msRef('coQuanPhoiHop', 'Cơ quan phối hợp', 'DM_DonVi'),
    sel('hinhThucBaoCao', 'Hình thức báo cáo', ['Văn bản', 'Biểu mẫu', 'Điện tử']), ref('nguonDuLieuDauVao', 'Nguồn dữ liệu đầu vào', 'DM_NguonDuLieu'),
    dt('thoiHanHoanThanh', 'Thời hạn hoàn thành báo cáo'), ref('vanBanYeuCau', 'Văn bản giao nhiệm vụ/yêu cầu báo cáo', 'DM_VanBan'),
    sel('mucDoCongKhai', 'Mức độ công khai', ['Công khai', 'Hạn chế', 'Không công khai'])
  ].concat(hieuLuc('apDungTu', 'apDungDen')));

  bang('DM_NguonDuLieu', DM, 'danhmuc', 'NDL', 'SO-4', 'Nguồn dữ liệu đầu vào', [
    kc('maNguon', 'Mã nguồn dữ liệu'), bb('tenNguon', 'Tên nguồn dữ liệu'), c('coQuanChuQuan', 'Cơ quan chủ quản nguồn dữ liệu'),
    ref('donViCungCap', 'Đơn vị cung cấp dữ liệu', 'DM_DonVi'), sel('tanSuatCapNhat', 'Tần suất cập nhật dữ liệu', ['Thời gian thực', 'Ngày', 'Tháng', 'Quý', 'Năm']),
    sel('phuongThucTichHop', 'Phương thức tích hợp dữ liệu', ['API', 'Đồng bộ CSDL', 'File', 'Nhập tay']),
    sel('mucDichSuDung', 'Mục đích sử dụng dữ liệu', ['Lập báo cáo', 'Phân tích', 'Điều hành'])
  ]);

  bang('DM_DonViDo', DM, 'danhmuc', 'DVD', 'TU_NHAP', 'Đơn vị đo lường', [
    kc('maDonViDo', 'Mã đơn vị đo lường'), bb('tenDonViDo', 'Tên đơn vị đo lường'), c('kyHieu', 'Ký hiệu đơn vị đo lường'),
    sel('nhomDonViDo', 'Nhóm đơn vị đo lường', ['Số lượng', 'Tiền tệ', 'Tỷ lệ', 'Diện tích', 'Khối lượng', 'Thời gian', 'Chiều dài', 'Điểm']),
    sel('loaiDuLieu', 'Loại dữ liệu áp dụng', ['Số nguyên', 'Số thực', 'Phần trăm']), c('moTa', 'Mô tả đơn vị đo lường'),
    sel('heDoLuong', 'Hệ đo lường áp dụng', ['SI', 'Quy ước thống kê']), ref('donViGoc', 'Đơn vị đo lường gốc/tương đương', 'DM_DonViDo'),
    so('heSoQuyDoi', 'Hệ số quy đổi'), sel('tinhTrangApDung', 'Tình trạng áp dụng', TINH_TRANG_AP_DUNG, { macDinh: 'Đang áp dụng' })
  ]);

  bang('DM_MucDo', DM, 'danhmuc', 'MD', 'TU_NHAP', 'Mức độ, cấp độ đánh giá', [
    kc('maMucDo', 'Mã mức độ/cấp độ'), bb('tenMucDo', 'Tên mức độ/cấp độ'),
    sel('loaiMucDoApDung', 'Loại mức độ áp dụng', ['Đánh giá KPI', 'Trạng thái điều hành', 'Cảnh báo']), so('thuTu', 'Thứ tự mức độ'),
    so('giaTriDinhLuong', 'Giá trị định lượng tương ứng'), c('khoangGiaTri', 'Khoảng giá trị áp dụng'),
    sel('yNghiaQuanLy', 'Ý nghĩa quản lý', ['Tốt', 'Đạt', 'Chưa đạt', 'Cảnh báo', 'Nguy cơ']), sel('mauSacHienThi', 'Màu sắc hiển thị', ['Xanh', 'Vàng', 'Đỏ', 'Xám']),
    sel('mucDoUuTienXuLy', 'Mức độ ưu tiên xử lý', ['Cao', 'Trung bình', 'Thấp']), c('hanhDongGoiY', 'Hành động điều hành gợi ý'), c('phamViApDung', 'Phạm vi áp dụng'),
    sel('doiTuongApDung', 'Đối tượng áp dụng', ['KPI', 'Nhiệm vụ', 'Dự án', 'Báo cáo', 'Chỉ tiêu', 'Yêu cầu đầu vào']), c('canCu', 'Căn cứ quy định/chuẩn áp dụng')
  ].concat(hieuLuc('apDungTu', 'apDungDen')));

  bang('DM_KichBan', DM, 'danhmuc', 'KB', 'SO-4', 'Kịch bản điều hành, phát triển', [
    kc('maKichBan', 'Mã kịch bản'), bb('tenKichBan', 'Tên kịch bản'), c('linhVuc', 'Lĩnh vực điều hành, phát triển'), ta('dieuKienKichHoat', 'Điều kiện kích hoạt'),
    c('mucTieuDieuHanh', 'Mục tiêu điều hành'), c('phamViApDung', 'Phạm vi áp dụng'), c('capDoDieuHanh', 'Cấp độ điều hành'), ref('coQuanChuTri', 'Cơ quan chủ trì điều hành', 'DM_DonVi'),
    ta('moTa', 'Mô tả'), c('thoiGianApDungDuKien', 'Thời gian áp dụng dự kiến'), c('nguonDuLieuTheoDoi', 'Nguồn dữ liệu theo dõi, đánh giá'),
    ref('vanBanCanCu', 'Văn bản chỉ đạo/căn cứ xây dựng kịch bản', 'DM_VanBan'), dt('thoiDiemBanHanh', 'Thời điểm ban hành kịch bản'),
    sel('tinhTrangKichBan', 'Tình trạng kịch bản', ['Dự thảo', 'Đang áp dụng', 'Hết hiệu lực'])
  ]);

  bang('DM_MoHinh', DM, 'danhmuc', 'MH', 'SO-4', 'Mô hình phân tích, dự báo', [
    kc('maMoHinh', 'Mã mô hình phân tích/dự báo'), bb('tenMoHinh', 'Tên mô hình phân tích/dự báo'), c('linhVucApDung', 'Lĩnh vực áp dụng'), c('mucTieu', 'Mục tiêu phân tích/dự báo'),
    c('phamViApDung', 'Phạm vi áp dụng'), sel('capDoSuDung', 'Cấp độ sử dụng', ['Chiến lược', 'Điều hành', 'Tác nghiệp']),
    sel('phuongPhap', 'Phương pháp/kỹ thuật sử dụng', ['Thống kê', 'Kinh tế lượng', 'ML/AI', 'Quy tắc']), c('nguonDuLieuDauVao', 'Nguồn dữ liệu đầu vào chính'),
    sel('thoiGianDuLieuDauVao', 'Thời gian dữ liệu đầu vào', ['Quá khứ', 'Thời gian thực', 'Theo kỳ']), sel('chuKyChay', 'Chu kỳ chạy mô hình', ['Theo yêu cầu', 'Ngày', 'Tháng', 'Quý']),
    sel('ketQuaDauRa', 'Kết quả đầu ra chính', ['Chỉ số', 'Dự báo', 'Cảnh báo', 'Kịch bản']), c('doTinCay', 'Độ tin cậy/mức độ kiểm định'),
    c('coQuanChuTriXayDung', 'Cơ quan chủ trì xây dựng mô hình'), c('donViVanHanh', 'Đơn vị vận hành/khai thác mô hình'), c('heThongTrienKhai', 'Hệ thống thông tin triển khai mô hình'),
    ref('vanBanCanCu', 'Văn bản phê duyệt/căn cứ xây dựng mô hình', 'DM_VanBan'), dt('thoiDiemSuDung', 'Thời điểm đưa vào sử dụng'),
    sel('tinhTrangMoHinh', 'Tình trạng mô hình', ['Đang sử dụng', 'Thử nghiệm', 'Ngừng sử dụng'])
  ]);

  // ===== DANH MỤC ĐỊA PHƯƠNG =====
  bang('DM_BoChiTieu', DM, 'danhmuc', 'BO', 'TU_NHAP', 'Bộ chỉ tiêu', [
    kc('maBo', 'Mã bộ'), bb('tenBo', 'Tên bộ chỉ tiêu'), bb('loaiHeThong', 'Loại hệ thống', 'select', { tuyChon: LOAI_HE_THONG }),
    ref('vanBanBanHanh', 'Văn bản ban hành', 'DM_VanBan'), c('soKyHieuVanBan', 'Số ký hiệu văn bản'), c('coQuanBanHanh', 'Cơ quan ban hành'),
    sel('capApDung', 'Cấp áp dụng', ['Trung ương', 'Thành phố', 'Xã']), c('giaiDoan', 'Giai đoạn'), dt('hieuLucTu', 'Hiệu lực từ'), dt('hieuLucDen', 'Hiệu lực đến'),
    ref('thayTheBo', 'Thay thế bộ', 'DM_BoChiTieu'), sel('tinhTrangApDung', 'Tình trạng áp dụng', TINH_TRANG_AP_DUNG, { macDinh: 'Đang áp dụng' }),
    so('soChiTieu', 'Số chỉ tiêu'), ta('ghiChu', 'Ghi chú')
  ]);
  bang('DM_DonVi', DM, 'danhmuc', 'DV', 'TU_NHAP', 'Đơn vị, đầu mối', [
    kc('maDonVi', 'Mã đầu mối'), bb('tenDayDu', 'Tên đầy đủ'), bb('tenVietTat', 'Tên viết tắt'), bb('nhom', 'Nhóm', 'select', { tuyChon: ['DV', 'TH', 'AP', 'NGOAI'] }),
    c('phanLoai', 'Phân loại'), c('nguoiLienHe', 'Người phụ trách'), c('email', 'Email', 'email'), c('dienThoai', 'Điện thoại'),
    c('dangHoatDong', 'Đang hoạt động', 'boolean', { macDinh: true }), so('thuTu', 'Thứ tự'), c('ghiChu', 'Ghi chú')
  ]);
  bang('DM_LinhVuc', DM, 'danhmuc', 'LV', 'TU_NHAP', 'Lĩnh vực', [
    kc('maLinhVuc', 'Mã lĩnh vực'), bb('tenLinhVuc', 'Tên lĩnh vực'), c('tenNgan', 'Tên ngắn'), so('thuTu', 'Thứ tự'), c('mau', 'Màu nhãn'), c('ghiChu', 'Ghi chú')
  ]);
  bang('DM_VanBan', DM, 'danhmuc', 'VB', 'SO-4', 'Văn bản căn cứ', [
    kc('maVanBan', 'Mã văn bản'), bb('soKyHieu', 'Số ký hiệu'), dt('ngayBanHanh', 'Ngày ban hành'), sel('capBanHanh', 'Cấp ban hành', ['Trung ương', 'Thành phố', 'Sở ngành', 'Xã', 'Khác']),
    c('coQuanBanHanh', 'Cơ quan ban hành'), bb('trichYeu', 'Trích yếu'),
    sel('loaiVanBan', 'Loại văn bản', ['Luật', 'Nghị định', 'Quyết định', 'Kế hoạch', 'Công văn', 'Chỉ thị', 'Thông báo', 'Hướng dẫn', 'Khác']),
    sel('tinhTrangHieuLuc', 'Tình trạng hiệu lực', ['Còn hiệu lực', 'Hết hiệu lực', 'Dự thảo'], { macDinh: 'Còn hiệu lực' }), ref('biThayTheBoi', 'Bị thay thế bởi', 'DM_VanBan'),
    c('phamViGiaiDoan', 'Phạm vi / giai đoạn'), c('linkFile', 'Link file'), c('ghiChu', 'Ghi chú')
  ]);
  bang('DM_KyBaoCao', DM, 'danhmuc', 'KY', 'TU_NHAP', 'Kỳ báo cáo', [
    kc('maKy', 'Mã kỳ'), bb('tenKy', 'Tên kỳ'), bb('loaiKy', 'Loại kỳ', 'select', { tuyChon: ['Tuần', 'Tháng', 'Quý', '6 tháng', '9 tháng', 'Năm'] }), so('nam', 'Năm'),
    dt('tuNgay', 'Từ ngày'), dt('denNgay', 'Đến ngày'), dt('hanChot', 'Hạn chốt'), sel('apDungCho', 'Áp dụng cho', ['Nhiệm vụ', 'Chỉ tiêu', 'Cả hai'], { macDinh: 'Cả hai' }),
    c('laKyHienTai', 'Là kỳ hiện tại', 'boolean', { macDinh: false })
  ]);
  bang('DM_NguoiDung', DM, 'danhmuc', 'ND', 'SO-4', 'Người dùng', [
    kc('maNguoiDung', 'Mã người dùng'), bb('tenDangNhap', 'Tên đăng nhập'), bb('hoTen', 'Họ tên'), c('email', 'Email Google', 'email', { goiY: 'Để trống nếu người này không đăng nhập bằng Google' }),
    msOpt('vaiTro', 'Vai trò', ['QUANTRI', 'KIEMDUYET', 'CHUYENVIEN', 'DONVI', 'LANHDAO'], { batBuoc: true }),
    msRef('danhSachDonVi', 'Đơn vị, đầu mối đại diện', 'DM_DonVi'), msRef('linhVucPhuTrach', 'Lĩnh vực phụ trách', 'DM_LinhVuc'),
    c('matKhauBam', 'Mật khẩu (băm)', 'text', { an: true }), c('muoi', 'Muối', 'text', { an: true }), c('phienBanBam', 'Phiên bản băm', 'number', { an: true }),
    c('batBuocDoiMatKhau', 'Bắt buộc đổi mật khẩu', 'boolean', { macDinh: true }), so('soLanSai', 'Số lần sai liên tiếp'), c('khoaDen', 'Khóa đến', 'datetime'),
    c('lanDangNhapCuoi', 'Lần đăng nhập cuối', 'datetime'), sel('trangThai', 'Trạng thái tài khoản', ['Hoạt động', 'Khóa'], { macDinh: 'Hoạt động' }), c('ghiChu', 'Ghi chú')
  ]);
  bang('DM_CauTruc', DM, 'danhmuc', 'CAU', 'SO-4', 'Cấu trúc danh mục', [
    kc('maCauTruc', 'Mã'), bb('bang', 'Bảng'), bb('khoa', 'Khóa cột'), c('ten', 'Tên hiển thị'), c('kieu', 'Kiểu'), c('batBuoc', 'Bắt buộc', 'boolean'),
    c('tuyChon', 'Tùy chọn', 'json'), c('thamChieu', 'Tham chiếu'), so('thuTu', 'Thứ tự')
  ]);
  bang('CauHinh', DM, 'danhmuc', 'CH', 'TU_NHAP', 'Cấu hình chung', [
    kc('khoa', 'Khóa'), ta('giaTri', 'Giá trị'), c('moTa', 'Mô tả')
  ]);

  // ===== BẢNG NGHIỆP VỤ =====
  var TRANG_THAI_DUYET = ['CHO_DUYET', 'DA_DUYET', 'TRA_LAI'];
  bang('NhiemVu', DL, 'nghiepvu', 'NV', 'NAM-4', 'Nhiệm vụ', [
    kc('maNhiemVu', 'Mã nhiệm vụ'), bb('tenNhiemVu', 'Tên nhiệm vụ'), ref('linhVucThucHien', 'Lĩnh vực thực hiện', 'DM_LinhVuc'),
    ref('chuongTrinhLienQuan', 'Chương trình công tác liên quan', 'DM_ChuongTrinh'), ref('coQuanChuTri', 'Cơ quan chủ trì thực hiện', 'DM_DonVi'),
    msRef('coQuanPhoiHop', 'Cơ quan phối hợp thực hiện', 'DM_DonVi'), ref('mucTieuNhiemVu', 'Mục tiêu nhiệm vụ', 'DM_MucTieu'), c('sanPhamDauRa', 'Sản phẩm đầu ra'),
    dt('thoiHanThucHien', 'Thời hạn thực hiện'), ref('vanBanGiaoNhiemVu', 'Văn bản giao nhiệm vụ', 'DM_VanBan'), sel('mucDoUuTien', 'Mức độ ưu tiên', ['Cao', 'Thường', 'Thấp'], { macDinh: 'Thường' }),
    c('phamViThucHien', 'Phạm vi thực hiện'), sel('tinhTrangApDung', 'Tình trạng áp dụng', TINH_TRANG_AP_DUNG, { macDinh: 'Đang áp dụng' }),
    bb('nguon', 'Nguồn', 'select', { tuyChon: ['KE_HOACH', 'THUONG_XUYEN'] }), sel('loaiNguonPhatSinh', 'Loại nguồn phát sinh', ['van_ban', 'chi_dao', 'hop', 'tu_phat_sinh']),
    c('nguoiGiao', 'Người giao'), dt('ngayGiao', 'Ngày giao'), sel('loaiSanPham', 'Loại sản phẩm', ['bao_cao', 'cong_van', 'ke_hoach', 'quyet_dinh', 'to_trinh', 'gop_y', 'minh_chung', 'khac']),
    ta('noiDung', 'Nội dung'), c('chiTieuGiao', 'Chỉ tiêu giao'), ref('kyBaoCao', 'Kỳ báo cáo', 'DM_KyBaoCao'), c('maLienKet', 'Mã liên kết'), c('maIndex', 'Mã index'),
    msRef('maCDS', 'Chỉ tiêu CĐS liên quan', 'DM_ChiTieu'), c('maCDS_HoTro', 'Chỉ tiêu CĐS hỗ trợ'), c('thoiHanGoc', 'Thời hạn gốc'), c('ngungTheoDoi', 'Ngừng theo dõi', 'boolean', { macDinh: false }),
    c('chuyenVien', 'Chuyên viên'), c('emailPhuTrach', 'Email phụ trách', 'email'),
    ref('trangThai', 'Trạng thái', 'DM_TrangThai'), so('phanTram', 'Phần trăm'), ta('ketQua', 'Kết quả'), ta('vuongMac', 'Vướng mắc'), c('ketQuaVanBan', 'Văn bản đi (số, ngày, link)', 'json'),
    c('minhChung', 'Thư mục minh chứng (Drive)'), msRef('maChiSo', 'Là minh chứng cho tiêu chí', 'DM_ChiSo'), ref('lienKetNhiemVu', 'Phục vụ nhiệm vụ kế hoạch', 'NhiemVu'),
    sel('nhapTu', 'Nhập từ', ['tay', 'excel', 'claude'], { macDinh: 'tay' }), sel('trangThaiXacNhan', 'Trạng thái xác nhận', ['cho_xac_nhan', 'da_xac_nhan', 'bo'], { macDinh: 'da_xac_nhan' }),
    c('xacNhanBoi', 'Xác nhận bởi'), c('xacNhanLuc', 'Xác nhận lúc', 'datetime'), c('hoanThanhLuc', 'Hoàn thành lúc', 'datetime')
  ]);
  bang('YeuCauDauVao', DL, 'nghiepvu', 'YC', 'NAM-4', 'Yêu cầu đầu vào', [
    kc('maYeuCau', 'Mã yêu cầu'), bb('maNhiemVu', 'Nhiệm vụ', 'ref', { thamChieu: 'NhiemVu' }), bb('maDonVi', 'Đơn vị', 'ref', { thamChieu: 'DM_DonVi' }), bb('noiDung', 'Nội dung cần cung cấp'),
    dt('hanCungCap', 'Hạn cung cấp'), sel('trangThai', 'Trạng thái', ['CHUA_GUI', 'DA_GUI', 'DA_NHAN', 'NHAN_CHUA_DAT'], { macDinh: 'CHUA_GUI' }), dt('ngayGui', 'Ngày gửi'), dt('ngayNhan', 'Ngày nhận'),
    c('lanNhacCuoi', 'Lần nhắc cuối', 'datetime'), so('soLanNhac', 'Số lần nhắc'), c('fileNhan', 'File nhận (Drive)'), c('ghiChu', 'Ghi chú')
  ]);
  var COT_BAO_CAO_NV = [
    kc('maBanGhi', 'Mã bản ghi'), ref('donVi', 'Đơn vị', 'DM_DonVi'), c('loai', 'Loại'), ref('ma', 'Mã nhiệm vụ', 'NhiemVu'), sel('vaiTroDonVi', 'Vai trò đơn vị', ['Chủ trì', 'Phối hợp']),
    ref('kyBaoCao', 'Kỳ báo cáo', 'DM_KyBaoCao'), dt('ngayBaoCao', 'Ngày báo cáo'), ref('trangThai', 'Trạng thái', 'DM_TrangThai'), so('phanTram', 'Phần trăm'), ta('ketQua', 'Kết quả'), ta('vuongMac', 'Vướng mắc'),
    c('sanPham', 'Sản phẩm'), c('nguoiGui', 'Người gửi'), c('thoiDiem', 'Thời điểm', 'datetime'), sel('trangThaiDuyet', 'Trạng thái duyệt', TRANG_THAI_DUYET, { macDinh: 'CHO_DUYET' }),
    c('nguoiDuyet', 'Người duyệt'), c('thoiDiemDuyet', 'Thời điểm duyệt', 'datetime'), c('ghiChuDuyet', 'Ghi chú duyệt'), c('minhChung', 'Thư mục minh chứng (Drive)')
  ];
  bang('BaoCaoNhiemVu', DL, 'nghiepvu', 'BC', 'SO-6', 'Báo cáo tiến độ nhiệm vụ', COT_BAO_CAO_NV.slice());
  bang('BaoCaoNhiemVu_LichSu', DL, 'nghiepvu', 'BC', 'TU_NHAP', 'Lịch sử báo cáo tiến độ', COT_BAO_CAO_NV.concat([
    c('thoiDiemThayThe', 'Thời điểm thay thế', 'datetime'), c('nguoiThayThe', 'Người thay thế'), c('maBanGhiMoi', 'Mã bản ghi mới'), c('lyDo', 'Lý do')
  ]));
  bang('TongHopNhiemVuKy', DL, 'nghiepvu', 'TH', 'SO-6', 'Tổng hợp nhiệm vụ theo kỳ', [
    kc('maTongHop', 'Mã tổng hợp'), c('loai', 'Loại'), ref('ma', 'Mã nhiệm vụ', 'NhiemVu'), ref('kyBaoCao', 'Kỳ báo cáo', 'DM_KyBaoCao'), so('soDonViPhaiBC', 'Số đơn vị phải báo cáo'),
    so('soDonViDaBC', 'Số đơn vị đã báo cáo'), c('donViChuaBC', 'Đơn vị chưa báo cáo'), so('phanTramChung', 'Phần trăm chung'), c('trangThaiChung', 'Trạng thái chung'),
    c('trangThaiDuyet', 'Trạng thái duyệt'), ta('ketQuaGhep', 'Kết quả ghép'), ta('vuongMacGhep', 'Vướng mắc ghép')
  ]);
  // Giai đoạn 1b: mỗi dòng = một chỉ tiêu trong một bộ (nguyên văn văn bản). Thay ChiTieu_NguonQuyDinh.
  bang('ChiTieu_TrongBo', DL, 'nghiepvu', 'TB', 'TU_NHAP', 'Chỉ tiêu trong bộ', [
    kc('maTrongBo', 'Mã trong bộ'), bb('maBo', 'Bộ chỉ tiêu', 'ref', { thamChieu: 'DM_BoChiTieu' }), c('maGoc', 'Mã gốc trong văn bản'), c('sttTrongBo', 'Số thứ tự trong văn bản'),
    c('nhomMa', 'Mã nhóm'), c('nhomTen', 'Tên nhóm'), ref('chaTrongBo', 'Thuộc chỉ tiêu cha', 'ChiTieu_TrongBo'), bb('tenNguyenVan', 'Tên chỉ tiêu (nguyên văn)', 'textarea'),
    ta('khaiNiemPhuongPhapTinh', '1. Khái niệm, phương pháp tính'), ta('phanToChuYeu', '2. Phân tổ chủ yếu'), c('kyCongBo', '3. Kỳ công bố'),
    ta('nguonSoLieu', '4. Nguồn số liệu'), ta('coQuanChuTriThuThap', '5. Cơ quan thu thập, tổng hợp — Chủ trì'), ta('coQuanPhoiHopThuThap', '5. Cơ quan thu thập, tổng hợp — Phối hợp'),
    c('donViTinh', 'Đơn vị tính'), sel('thuocTinhTongHop', 'Thuộc tính tổng hợp', THUOC_TINH_TONG_HOP), sel('capDuLieu', 'Cấp dữ liệu', CAP_DU_LIEU),
    c('kyBaoCaoTP', 'Kỳ báo cáo cấp Thành phố'), c('kyBaoCaoXa', 'Kỳ báo cáo cấp xã'), c('thoiDiemChotSoLieu', 'Thời điểm chốt số liệu'),
    c('mucTieu', 'Mục tiêu theo giai đoạn', 'json'), c('viTriTrongVanBan', 'Vị trí trong văn bản'), ta('canCuNguyenVan', 'Căn cứ (nguyên văn)'), ta('coQuanXacNhanSoLieu', 'Cơ quan xác nhận số liệu'),
    ref('maChiTieu', 'Chỉ tiêu chuẩn (cùng nội hàm)', 'DM_ChiTieu'), sel('linhVucLon', 'Lĩnh vực lớn', LINH_VUC_LON),
    sel('tinhTrangHieuLuc', 'Tình trạng hiệu lực', ['Còn hiệu lực', 'Hết hiệu lực'], { macDinh: 'Còn hiệu lực' }), ref('biThayTheBoi', 'Bị thay thế bởi', 'ChiTieu_TrongBo'), ta('ghiChu', 'Ghi chú')
  ]);
  bang('ChiTieu_PhanCong', DL, 'nghiepvu', 'PC', 'SO-4', 'Phân công nhập số liệu chỉ tiêu', [
    kc('maPhanCong', 'Mã'), bb('maChiTieu', 'Mã chỉ tiêu', 'ref', { thamChieu: 'DM_ChiTieu' }), c('tenChiTieu', 'Tên chỉ tiêu'), sel('nhomDauMoiNhap', 'Nhóm đầu mối nhập', ['DV', 'TH', 'AP', 'XA']),
    so('soDauMoiPhaiNop', 'Số đầu mối phải nộp'), sel('cachTongHop', 'Cách tổng hợp', ['Cộng tử số / cộng mẫu số', 'Cộng dồn', 'Đầu mối nhập trực tiếp']),
    c('cauHoiTuSo', 'Câu hỏi TỬ SỐ'), c('cauHoiMauSo', 'Câu hỏi MẪU SỐ'), c('donViTinh', 'Đơn vị tính'), c('ghiChuBieuMau', 'Ghi chú hiện trên biểu mẫu')
  ]);
  var COT_SO_LIEU = [
    kc('maBanGhi', 'Mã bản ghi'), bb('maChiTieu', 'Mã chỉ tiêu', 'ref', { thamChieu: 'DM_ChiTieu' }), bb('maDauMoi', 'Mã đầu mối', 'ref', { thamChieu: 'DM_DonVi' }), c('tenDauMoi', 'Tên đầu mối'), c('nhom', 'Nhóm'),
    ref('kyBaoCao', 'Kỳ báo cáo', 'DM_KyBaoCao'), dt('ngayChotSoLieu', 'Ngày chốt số liệu'), so('tuSo', 'Tử số'), so('mauSo', 'Mẫu số'), so('giaTri', 'Giá trị'), c('donViTinh', 'Đơn vị tính'),
    c('nguonSoLieu', 'Nguồn số liệu'), c('nguoiNhap', 'Người nhập'), c('ghiChu', 'Ghi chú'), sel('cachNhap', 'Cách nhập', ['Web app', 'Thủ công', 'Biểu mẫu', 'Excel', 'Claude']),
    c('thoiDiemGhiNhan', 'Thời điểm ghi nhận', 'datetime'), c('canGuiLai', 'Cần gửi lại', 'boolean', { macDinh: false }), c('lyDoGuiLai', 'Lý do yêu cầu gửi lại'), c('minhChung', 'Thư mục minh chứng (Drive)')
  ];
  bang('SoLieuChiTieu', DL, 'nghiepvu', 'SL', 'SO-6', 'Số liệu chỉ tiêu theo đầu mối', COT_SO_LIEU.slice());
  bang('SoLieuChiTieu_LichSu', DL, 'nghiepvu', 'SL', 'TU_NHAP', 'Lịch sử số liệu chỉ tiêu', COT_SO_LIEU.concat([
    c('thoiDiemBiThayThe', 'Thời điểm bị thay thế', 'datetime'), c('biThayTheBoi', 'Bị thay thế bởi (mã bản ghi)'), c('nguoiThayThe', 'Người thay thế'), c('lyDo', 'Lý do')
  ]));
  bang('TongHopChiTieuKy', DL, 'nghiepvu', 'THC', 'SO-6', 'Tổng hợp chỉ tiêu theo kỳ', [
    kc('maTongHop', 'Mã tổng hợp'), ref('maChiTieu', 'Mã chỉ tiêu', 'DM_ChiTieu'), c('tenChiTieu', 'Tên chỉ tiêu'), ref('kyBaoCao', 'Kỳ báo cáo', 'DM_KyBaoCao'), dt('ngayChot', 'Ngày chốt'),
    so('tongTuSo', 'Tổng tử số'), so('tongMauSo', 'Tổng mẫu số'), so('giaTriToanXa', 'Giá trị toàn xã'), c('donViTinh', 'Đơn vị tính'), so('dauMoiDaNop', 'Đầu mối đã nộp'), so('dauMoiPhaiNop', 'Đầu mối phải nộp'),
    c('trangThaiThuThap', 'Trạng thái thu thập')
  ]);
  bang('ChiSo_TuDanhGia', DL, 'nghiepvu', 'TDG', 'SO-4', 'Tự đánh giá bộ chỉ số', [
    kc('maTuDanhGia', 'Mã'), bb('maChiSo', 'Tiêu chí', 'ref', { thamChieu: 'DM_ChiSo' }), so('ky', 'Năm đánh giá'), so('diemToiDa', 'Điểm tối đa'), so('diemTuDanhGia', 'Điểm tự đánh giá'), so('diemCongBo', 'Điểm công bố'),
    sel('tinhTrangMinhChung', 'Tình trạng minh chứng', ['Chưa có', 'Đã có', 'Đủ']), c('minhChung', 'Thư mục minh chứng (Drive)'), msRef('nhiemVuLienQuan', 'Nhiệm vụ liên quan', 'NhiemVu'), c('ghiChu', 'Ghi chú')
  ]);
  bang('MinhChung', DL, 'nghiepvu', 'MC', 'SO-6', 'Chỉ mục minh chứng', [
    kc('maMinhChung', 'Mã minh chứng'), sel('loaiDoiTuong', 'Loại đối tượng', ['NhiemVu', 'BaoCaoNhiemVu', 'SoLieuChiTieu', 'ChiSo', 'YeuCauDauVao']), bb('maDoiTuong', 'Mã đối tượng'),
    bb('fileId', 'ID file Drive'), bb('tenFile', 'Tên file'), c('link', 'Link'), c('loaiFile', 'Loại file'), so('kichThuoc', 'Kích thước (byte)'), c('taiLenBoi', 'Tải lên bởi'), c('taiLenLuc', 'Tải lên lúc', 'datetime'), c('moTa', 'Mô tả')
  ]);
  bang('BaoCaoDaSinh', DL, 'nghiepvu', 'BCS', 'SO-4', 'Báo cáo đã sinh', [
    kc('maBaoCao', 'Mã báo cáo'), c('loaiBaoCao', 'Loại báo cáo'), dt('tuNgay', 'Từ ngày'), dt('denNgay', 'Đến ngày'), c('phamVi', 'Phạm vi'), ta('noiDung', 'Nội dung'), c('fileDocx', 'File .docx (Drive)'), c('ghiChu', 'Ghi chú')
  ]);
  bang('HopThuClaude', DL, 'nghiepvu', 'HT', 'TU_NHAP', 'Hộp thư Claude', [
    kc('maFile', 'ID file'), c('tenFile', 'Tên file'), c('thoiDiemDoc', 'Thời điểm đọc', 'datetime'), so('soNhiemVuTao', 'Số nhiệm vụ tạo'), sel('ketQua', 'Kết quả', ['OK', 'LOI', 'CANH_BAO']), ta('loi', 'Lỗi / cảnh báo')
  ]);
  bang('BoDem', DL, 'nghiepvu', 'BD', 'TU_NHAP', 'Bộ đếm mã', [
    kc('tienTo', 'Tiền tố'), so('nam', 'Năm'), so('soHienTai', 'Số hiện tại')
  ]);

  // ===== BẢNG NHẬT KÝ (mã do lớp kết nối cấp theo thời gian, nên TU_NHAP) =====
  bang('NhatKy', NK, 'nhatky', 'NK', 'TU_NHAP', 'Nhật ký hệ thống', [
    kc('maNhatKy', 'Mã'), c('thoiGian', 'Thời gian', 'datetime'), c('maNguoiDung', 'Mã người dùng'), c('email', 'Email'), c('vaiTro', 'Vai trò', 'json'),
    sel('hanhDong', 'Hành động', ['THEM', 'SUA', 'NGUNG', 'DANG_NHAP', 'DANG_NHAP_SAI', 'DANG_XUAT', 'DOI_MAT_KHAU', 'DAT_LAI_MAT_KHAU', 'SAO_LUU', 'TOAN_VEN', 'THIET_LAP', 'KHAC']),
    c('bang', 'Bảng'), c('ma', 'Mã bản ghi'), c('truocKhiSua', 'Trước khi sửa', 'json'), c('sauKhiSua', 'Sau khi sửa', 'json'), c('canCu', 'Căn cứ / ghi chú')
  ]);
  bang('PhienDangNhap', NK, 'nhatky', 'PH', 'TU_NHAP', 'Phiên đăng nhập', [
    kc('maPhien', 'Mã phiên'), c('maNguoiDung', 'Mã người dùng'), c('email', 'Email'), c('vaiTro', 'Vai trò', 'json'), c('danhSachDonVi', 'Đơn vị đại diện', 'json'),
    c('hetHanLuc', 'Hết hạn lúc', 'datetime'), c('thietBi', 'Thiết bị'), sel('trangThaiPhien', 'Trạng thái phiên', ['hoatDong', 'thuHoi'], { macDinh: 'hoatDong' }),
    c('batBuocDoiMatKhau', 'Còn mật khẩu tạm', 'boolean', { macDinh: false })
  ]);
  bang('KiemTraToanVen', NK, 'nhatky', 'TV', 'TU_NHAP', 'Kiểm tra toàn vẹn', [
    kc('maKiemTra', 'Mã'), c('thoiGian', 'Thời gian', 'datetime'), c('quanHe', 'Quan hệ'), c('bang', 'Bảng'), c('ma', 'Mã bản ghi'), c('giaTriHienTai', 'Giá trị hiện tại'), c('giaTriDung', 'Giá trị đúng'),
    sel('ketQua', 'Kết quả', ['DAT', 'LECH']), c('ghiChu', 'Ghi chú')
  ]);
  bang('SaoLuu', NK, 'nhatky', 'SLU', 'TU_NHAP', 'Sao lưu', [
    kc('maSaoLuu', 'Mã'), c('thoiGian', 'Thời gian', 'datetime'), c('tenFileGoc', 'File gốc'), c('tenFileSaoLuu', 'File sao lưu'), c('fileId', 'ID file sao lưu'), sel('ketQua', 'Kết quả', ['OK', 'LOI']), c('ghiChu', 'Ghi chú')
  ]);
  bang('DoiChieuChuyenDoi', NK, 'nhatky', 'DC', 'TU_NHAP', 'Đối chiếu chuyển đổi', [
    kc('maDoiChieu', 'Mã'), c('thoiGian', 'Thời gian', 'datetime'), c('sheet', 'Sheet'), c('hangMuc', 'Hạng mục'), c('nguon', 'Nguồn'), c('dich', 'Đích'), sel('ketQua', 'Kết quả', ['DAT', 'LECH']), ta('chiTiet', 'Chi tiết')
  ]);

  // Thêm cột hệ thống vào mọi bảng (danh mục có thêm maThanhPho).
  function _themCotHeThong(ten) {
    var b = BANG[ten], hs = [];
    if (b.nhom === 'danhmuc') hs.push(c('maThanhPho', 'Mã do Thành phố cấp', 'text', { heThong: true }));
    hs.push(c('taoLuc', 'Tạo lúc', 'datetime', { heThong: true }), c('taoBoi', 'Tạo bởi', 'text', { heThong: true }),
      c('capNhatLuc', 'Cập nhật lúc', 'datetime', { heThong: true }), c('capNhatBoi', 'Cập nhật bởi', 'text', { heThong: true }),
      c('tinhTrang', 'Tình trạng bản ghi', 'select', { heThong: true, tuyChon: TINH_TRANG, macDinh: 'Hoạt động' }));
    b.cot = b.cot.concat(hs);
  }
  Object.keys(BANG).forEach(_themCotHeThong);

  // Khóa chính của bảng (cột có khoaChinh = true).
  function khoaChinh(tenBang) { var b = BANG[tenBang]; if (!b) return undefined; var k = b.cot.filter(function (x) { return x.khoaChinh; })[0]; return k ? k.khoa : undefined; }
  // Các cột hệ thống của bảng.
  function cotHeThong(tenBang) { return BANG[tenBang].cot.filter(function (x) { return x.heThong; }); }
  // Danh sách tên bảng, lọc theo nhóm nếu có.
  function danhSachBang(nhom) { return Object.keys(BANG).filter(function (t) { return !nhom || BANG[t].nhom === nhom; }); }
  // Mô tả một cột theo khóa.
  function cot(tenBang, khoa) { return BANG[tenBang].cot.filter(function (x) { return x.khoa === khoa; })[0]; }

  return { FILE: FILE, KIEU: KIEU, TINH_TRANG: TINH_TRANG, THUOC_TINH_TONG_HOP: THUOC_TINH_TONG_HOP, CAP_DU_LIEU: CAP_DU_LIEU, LOAI_HE_THONG: LOAI_HE_THONG, LINH_VUC_LON: LINH_VUC_LON, BANG: BANG, khoaChinh: khoaChinh, cotHeThong: cotHeThong, danhSachBang: danhSachBang, cot: cot };
})();
