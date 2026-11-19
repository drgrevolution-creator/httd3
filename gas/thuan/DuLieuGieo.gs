/**
 * DuLieuGieo — dữ liệu gieo ban đầu cho danh mục (từ HTTD 2.0 và thiết kế §7.4). Lớp thuần.
 * ThietLap.thietLapLanDau ghi các bảng này vào HTTD3_DanhMuc nếu bảng còn trống.
 */
var DuLieuGieo = (function () {
  function dv(ma, ten, tat, nhom, loai, thuTu) { return { maDonVi: ma, tenDayDu: ten, tenVietTat: tat, nhom: nhom, phanLoai: loai, dangHoatDong: true, thuTu: thuTu }; }
  var DM_DonVi = [
    dv('DV01', 'Văn phòng Hội đồng nhân dân và Ủy ban nhân dân xã Phước Hải', 'VP', 'DV', 'Cơ quan hành chính', 1),
    dv('DV02', 'Phòng Kinh tế', 'PKT', 'DV', 'Cơ quan hành chính', 2),
    dv('DV03', 'Phòng Văn hóa - Xã hội', 'PVHXH', 'DV', 'Cơ quan hành chính', 3),
    dv('DV04', 'Trung tâm Phục vụ hành chính công xã Phước Hải', 'TTPVHCC', 'DV', 'Cơ quan hành chính', 4),
    dv('DV05', 'Trạm Y tế xã Phước Hải', 'TYT', 'DV', 'Đơn vị sự nghiệp', 5),
    dv('DV06', 'Trung tâm Cung ứng dịch vụ công xã Phước Hải', 'TTCƯDVC', 'DV', 'Đơn vị sự nghiệp', 6),
    dv('DV07', 'Ban Quản lý dự án đầu tư xây dựng xã Phước Hải', 'BQLDA', 'DV', 'Đơn vị sự nghiệp', 7),
    dv('DV08', 'Công an xã Phước Hải', 'CAX', 'DV', 'Cơ quan ngành dọc', 8),
    dv('DV09', 'Ban Chỉ huy Quân sự xã Phước Hải', 'BCHQS', 'DV', 'Cơ quan ngành dọc', 9)
  ];
  [['Lộc An', 'Mầm non'], ['Phước Hội', 'Mầm non'], ['Phước Điền', 'Mầm non'], ['Phước Hải', 'Mầm non'], ['Phước An', 'Mầm non'],
   ['Lộc An', 'Tiểu học'], ['Phước Hội', 'Tiểu học'], ['Nguyễn Hùng Mạnh', 'Tiểu học'], ['Long Mỹ', 'Tiểu học'], ['Phước Hải 1', 'Tiểu học'], ['Phước Hải 2', 'Tiểu học'], ['Phước Hải 3', 'Tiểu học'],
   ['Lộc An', 'Trung học cơ sở'], ['Châu Văn Biếc', 'Trung học cơ sở'], ['Minh Đạm', 'Trung học cơ sở'], ['Phước Hải', 'Trung học cơ sở']
  ].forEach(function (t, i) {
    var tat = (t[1] === 'Mầm non' ? 'MN ' : t[1] === 'Tiểu học' ? 'TH ' : 'THCS ') + t[0];
    DM_DonVi.push(dv('TH' + (i < 9 ? '0' : '') + (i + 1), 'Trường ' + t[1] + ' ' + t[0], tat, 'TH', 'Trường ' + t[1].toLowerCase(), 20 + i));
  });
  ['Lộc An', 'Hải An', 'Hải Trung', 'Hải Lạc', 'Hải Tân', 'Phước Điền', 'Long Mỹ', 'Phước Lợi', 'Hội Mỹ', 'An Hải', 'An Hòa'].forEach(function (t, i) {
    DM_DonVi.push(dv('AP' + (i < 9 ? '0' : '') + (i + 1), 'Ấp ' + t, t, 'AP', 'Ấp', 40 + i));
  });

  var DM_LinhVuc = [
    ['CCHC', 'Cải cách hành chính', 'CCHC', 1, '#2563eb'], ['CDS', 'Chuyển đổi số', 'CĐS', 2, '#7c3aed'], ['KHCN', 'Khoa học - Công nghệ', 'KHCN', 3, '#0891b2'],
    ['DMST', 'Đổi mới sáng tạo', 'ĐMST', 4, '#0d9488'], ['SHTT', 'Sở hữu trí tuệ', 'SHTT', 5, '#ca8a04'], ['TDC', 'Tiêu chuẩn đo lường chất lượng', 'TĐC', 6, '#9333ea'],
    ['TTTT', 'Thông tin - Truyền thông', 'TTTT', 7, '#db2777'], ['HTTT', 'Hạ tầng thông tin', 'HTTT', 8, '#4f46e5'], ['KTS', 'Kinh tế số', 'KTS', 9, '#16a34a'],
    ['XHS', 'Xã hội số', 'XHS', 10, '#ea580c'], ['KHAC', 'Khác', 'Khác', 99, '#6b7280']
  ].map(function (r) { return { maLinhVuc: r[0], tenLinhVuc: r[1], tenNgan: r[2], thuTu: r[3], mau: r[4] }; });

  function tt(ma, ten, muc, yNghia, loai, moTa) { return { maTrangThai: ma, tenTrangThai: ten, mucDoHoanThanh: muc, yNghiaQuanLy: yNghia, apDungChoLoai: loai, moTa: moTa || '', tinhTrangApDung: 'Đang áp dụng' }; }
  var DM_TrangThai = [
    tt('CHO_XAC_NHAN', 'Chờ xác nhận', 0, 'Theo dõi', 'Nhiệm vụ', 'Do Claude hoặc nhập Excel tạo, chưa được người phụ trách xác nhận'),
    tt('CHUA_TRIEN_KHAI', 'Chưa triển khai', 0, 'Theo dõi', 'Nhiệm vụ'), tt('DANG_THUC_HIEN', 'Đang thực hiện', 50, 'Theo dõi', 'Nhiệm vụ', 'Mức hoàn thành lấy theo phần trăm của nhiệm vụ'),
    tt('CHO_DAU_VAO', 'Chờ đầu vào từ đơn vị', 50, 'Cảnh báo', 'Nhiệm vụ'), tt('CHO_KY', 'Chờ ký', 90, 'Theo dõi', 'Nhiệm vụ'), tt('HOAN_THANH', 'Hoàn thành', 100, 'Kết thúc', 'Nhiệm vụ'),
    tt('QUA_HAN', 'Quá hạn', 0, 'Cảnh báo', 'Nhiệm vụ', 'Suy ra khi quá hạn mà chưa kết thúc'), tt('TAM_DUNG', 'Tạm dừng', 0, 'Theo dõi', 'Nhiệm vụ'), tt('HUY', 'Hủy', 0, 'Kết thúc', 'Nhiệm vụ'),
    tt('CHO_DUYET', 'Chờ duyệt', 0, 'Theo dõi', 'Duyệt'), tt('DA_DUYET', 'Đã duyệt', 100, 'Kết thúc', 'Duyệt'), tt('TRA_LAI', 'Trả lại', 0, 'Cảnh báo', 'Duyệt'),
    tt('CHUA_GUI', 'Chưa gửi yêu cầu', 0, 'Theo dõi', 'Yêu cầu đầu vào'), tt('DA_GUI', 'Đã gửi yêu cầu', 30, 'Theo dõi', 'Yêu cầu đầu vào'),
    tt('DA_NHAN', 'Đã nhận', 100, 'Kết thúc', 'Yêu cầu đầu vào'), tt('NHAN_CHUA_DAT', 'Nhận chưa đạt', 50, 'Cảnh báo', 'Yêu cầu đầu vào')
  ];

  function md(ma, ten, loai, thuTu, khoang, yNghia, mau, uuTien, hanhDong, doiTuong) {
    return { maMucDo: ma, tenMucDo: ten, loaiMucDoApDung: loai, thuTu: thuTu, khoangGiaTri: khoang, yNghiaQuanLy: yNghia, mauSacHienThi: mau, mucDoUuTienXuLy: uuTien, hanhDongGoiY: hanhDong, phamViApDung: 'Toàn xã', doiTuongApDung: doiTuong, tinhTrangApDung: 'Đang áp dụng' };
  }
  var DM_MucDo = [
    md('TD_XANH', 'Tiến độ tốt', 'Trạng thái điều hành', 1, '>= 80%', 'Tốt', 'Xanh', 'Thấp', 'Theo dõi bình thường', 'Nhiệm vụ'),
    md('TD_VANG', 'Tiến độ chậm', 'Trạng thái điều hành', 2, '50% - 79%', 'Chưa đạt', 'Vàng', 'Trung bình', 'Đôn đốc đơn vị chủ trì', 'Nhiệm vụ'),
    md('TD_DO', 'Tiến độ rất chậm hoặc quá hạn', 'Trạng thái điều hành', 3, '< 50% hoặc quá hạn', 'Nguy cơ', 'Đỏ', 'Cao', 'Báo cáo lãnh đạo, họp xử lý', 'Nhiệm vụ'),
    md('CT_XANH', 'Đạt ngưỡng', 'Đánh giá KPI', 1, '>= 100% ngưỡng', 'Đạt', 'Xanh', 'Thấp', 'Duy trì', 'Chỉ tiêu'),
    md('CT_VANG', 'Gần đạt', 'Đánh giá KPI', 2, '80% - 99% ngưỡng', 'Chưa đạt', 'Vàng', 'Trung bình', 'Rà soát giải pháp', 'Chỉ tiêu'),
    md('CT_DO', 'Chưa đạt', 'Đánh giá KPI', 3, '< 80% ngưỡng', 'Cảnh báo', 'Đỏ', 'Cao', 'Xây dựng kế hoạch khắc phục', 'Chỉ tiêu'),
    md('HAN_VANG', 'Sắp đến hạn', 'Cảnh báo', 1, 'Còn <= số ngày nhắc hạn (mặc định 7)', 'Cảnh báo', 'Vàng', 'Trung bình', 'Nhắc người phụ trách', 'Nhiệm vụ'),
    md('HAN_DO', 'Quá hạn', 'Cảnh báo', 2, 'Đã qua thời hạn', 'Nguy cơ', 'Đỏ', 'Cao', 'Đôn đốc, báo cáo lãnh đạo', 'Nhiệm vụ'),
    md('YC_VANG', 'Đầu vào sắp đến hạn', 'Cảnh báo', 1, 'Còn <= 2 ngày', 'Cảnh báo', 'Vàng', 'Trung bình', 'Nhắn Zalo đơn vị', 'Yêu cầu đầu vào'),
    md('YC_DO', 'Đầu vào quá hạn', 'Cảnh báo', 2, 'Đã qua hạn cung cấp', 'Nguy cơ', 'Đỏ', 'Cao', 'Nhắn lại, gọi điện, báo lãnh đạo đơn vị', 'Yêu cầu đầu vào')
  ];

  var DM_DonViDo = [
    ['PT', 'Phần trăm', '%', 'Tỷ lệ', 'Phần trăm'], ['NGUOI', 'Người', 'người', 'Số lượng', 'Số nguyên'], ['HOSO', 'Hồ sơ', 'hồ sơ', 'Số lượng', 'Số nguyên'],
    ['DIEM', 'Điểm', 'điểm', 'Điểm', 'Số thực'], ['TYDONG', 'Tỷ đồng', 'tỷ đồng', 'Tiền tệ', 'Số thực'], ['TRIEUDONG', 'Triệu đồng', 'triệu đồng', 'Tiền tệ', 'Số thực'],
    ['DONVI', 'Đơn vị', 'đơn vị', 'Số lượng', 'Số nguyên'], ['LUOT', 'Lượt', 'lượt', 'Số lượng', 'Số nguyên'], ['TAIKHOAN', 'Tài khoản', 'tài khoản', 'Số lượng', 'Số nguyên'],
    ['VANBAN', 'Văn bản', 'văn bản', 'Số lượng', 'Số nguyên'], ['NGAY', 'Ngày', 'ngày', 'Thời gian', 'Số nguyên'], ['KM', 'Ki-lô-mét', 'km', 'Chiều dài', 'Số thực']
  ].map(function (r) { return { maDonViDo: r[0], tenDonViDo: r[1], kyHieu: r[2], nhomDonViDo: r[3], loaiDuLieu: r[4], heDoLuong: 'Quy ước thống kê', tinhTrangApDung: 'Đang áp dụng' }; });

  function ky(ma, ten, loai, tu, den, han, hienTai) { return { maKy: ma, tenKy: ten, loaiKy: loai, nam: 2026, tuNgay: tu, denNgay: den, hanChot: han, apDungCho: 'Cả hai', laKyHienTai: !!hienTai }; }
  var DM_KyBaoCao = [
    ky('6T-2026', '6 tháng đầu năm 2026', '6 tháng', '2026-01-01', '2026-06-30', '2026-06-20'),
    ky('T07-2026', 'Tháng 7/2026', 'Tháng', '2026-07-01', '2026-07-31', '2026-07-20'),
    ky('Q3-2026', 'Quý III/2026', 'Quý', '2026-07-01', '2026-09-30', '2026-09-20'),
    ky('9T-2026', '9 tháng năm 2026', '9 tháng', '2026-01-01', '2026-09-30', '2026-09-20'),
    ky('N-2026', 'Năm 2026', 'Năm', '2026-01-01', '2026-12-31', '2026-11-20'),
    ky('Q4-2026', 'Quý IV/2026', 'Quý', '2026-10-01', '2026-12-31', '2026-12-20', true)
  ];

  function ctr(ma, ten, lv, soKyHieu, ngay) { return { maChuongTrinh: ma, tenChuongTrinh: ten, capChuongTrinh: 'Xã', giaiDoanThucHien: '2026', linhVucCongTac: lv, coQuanChuTri: 'DV03', tinhTrangApDung: 'Đang áp dụng', soKyHieu: soKyHieu, ngayBanHanh: ngay, trichYeu: ten, vbChiDaoGoc: 'KH-UBND' }; }
  var DM_ChuongTrinh = [
    ctr('KH09', 'Kế hoạch cải cách hành chính năm 2026', 'CCHC', '09/KH-UBND', '2026-01-08'),
    ctr('KH92', 'Kế hoạch chuyển đổi số (KH92)', 'CDS', 'KH92', ''),
    ctr('KHDTI', 'Kế hoạch nâng cao Chỉ số chuyển đổi số DTI', 'CDS', 'KHDTI', ''),
    ctr('KHNQ57', 'Kế hoạch thực hiện Nghị quyết 57-NQ/TW', 'CDS', 'KHNQ57', '')
  ];

  // Giai đoạn 1b: năm bộ chỉ tiêu (dữ liệu chỉ tiêu nạp qua màn Nhập từ file mẫu chuẩn).
  function bo(ma, ten, loai, soKyHieu, coQuan, cap, giaiDoan, tu, ghiChu) { return { maBo: ma, tenBo: ten, loaiHeThong: loai, soKyHieuVanBan: soKyHieu, coQuanBanHanh: coQuan, capApDung: cap, giaiDoan: giaiDoan, hieuLucTu: tu, tinhTrangApDung: 'Đang áp dụng', soChiTieu: 0, ghiChu: ghiChu || '' }; }
  var DM_BoChiTieu = [
    bo('LUAT-TK', 'Hệ thống chỉ tiêu thống kê quốc gia', 'Quốc gia', 'Phụ lục Luật Thống kê (VBHN 37/VBHN-VPQH)', 'Quốc hội', 'Trung ương', '', '2026-01-01', 'Nội dung chỉ tiêu theo NĐ 94/2022/NĐ-CP'),
    bo('TT13-BNV', 'Hệ thống chỉ tiêu thống kê ngành Nội vụ', 'Bộ, ngành', '13/2025/TT-BNV', 'Bộ Nội vụ', 'Trung ương', '', '2025-07-04'),
    bo('TT45-BKHCN', 'Hệ thống chỉ tiêu thống kê ngành Khoa học và Công nghệ', 'Bộ, ngành', '45/2025/TT-BKHCN', 'Bộ Khoa học và Công nghệ', 'Trung ương', '', '2025-12-15'),
    bo('TU-699', 'Danh mục chỉ tiêu, chỉ số theo dõi, lãnh đạo, chỉ đạo của Thành ủy', 'Theo dõi, đánh giá', 'Phụ lục kèm CV 699-CV/TU', 'Thành ủy Thành phố Hồ Chí Minh', 'Thành phố', '2026-2030', ''),
    bo('CDS-HN', 'Bộ chỉ tiêu hợp nhất về chuyển đổi số - kinh tế số - xã hội số', 'Theo dõi, đánh giá', 'QĐ 1266/QĐ-TTg; QĐ 2629/QĐ-TTg', 'UBND xã Phước Hải (hợp nhất)', 'Xã', '2026-2030', '', 'Chuyển từ HTTD 2.0 ở giai đoạn 5')
  ];

  var CauHinh = [
    ['tenCoQuan', 'ỦY BAN NHÂN DÂN XÃ PHƯỚC HẢI', 'Tên cơ quan in trên báo cáo'],
    ['diaDanh', 'Phước Hải', 'Địa danh ghi ngày tháng văn bản'],
    ['tenDonViKy', 'Phòng Văn hóa – Xã hội', 'Đơn vị tham mưu, ký tin nhắn đôn đốc'],
    ['emailQuanTri', '', 'Email nhận cảnh báo sao lưu, toàn vẹn (điền khi thiết lập)'],
    ['kyHienTai', 'Q4-2026', 'Mã kỳ báo cáo hiện tại (DM_KyBaoCao)'],
    ['soNgayNhacHan', '7', 'Nhắc trước hạn bấy nhiêu ngày (kế thừa HTTD 2.0)'],
    ['chiTinhSoLieuDaDuyet', 'Không', 'Chỉ tính báo cáo tiến độ nhiệm vụ đã duyệt khi tổng hợp (Có/Không)'],
    ['noiNhanBaoCao', '- TT. Đảng ủy, HĐND xã (b/c);\n- CT, các PCT UBND xã;\n- Lưu: VT, VHXH.', 'Nơi nhận mặc định của báo cáo'],
    ['ngayDauTuan', '6', 'Ngày đầu kỳ báo cáo tuần: 0 = Chủ nhật ... 6 = Thứ Bảy (báo cáo tuần Phòng tính từ thứ Bảy đến thứ Sáu)'],
    ['mauTinNhac', 'Kính gửi {donVi}, {tenDonViKy} đề nghị đơn vị cung cấp: {danhSach} (phục vụ {tieuDeViec}, theo {soKyHieuVBGoc}). Hạn gửi: {han}. Trân trọng cảm ơn.', 'Mẫu tin nhắn đôn đốc'],
    ['mauTinNhacQuaHan', 'Đến nay {tenDonViKy} chưa nhận được, mong đơn vị gửi sớm để kịp tổng hợp.', 'Câu thêm khi quá hạn'],
    ['gioiHanThuMoiNgay', '90', 'Dừng gửi email khi vượt số thư này trong ngày (hạn mức Google 100)'],
    ['phienBan', '3.0.0-gd1', 'Phiên bản hệ thống']
  ].map(function (r) { return { khoa: r[0], giaTri: r[1], moTa: r[2] }; });

  // Sinh nội dung bảng DM_CauTruc từ SoDo (mỗi cột một dòng) để người đọc tra cứu trong Sheets.
  function cauTruc() {
    var ds = [], i = 0;
    SoDo.danhSachBang('danhmuc').forEach(function (t) {
      SoDo.BANG[t].cot.forEach(function (c, j) {
        i++;
        ds.push({ maCauTruc: 'CAU-' + ('0000' + i).slice(-4), bang: t, khoa: c.khoa, ten: c.ten, kieu: c.kieu, batBuoc: !!c.batBuoc, tuyChon: c.tuyChon || [], thamChieu: c.thamChieu || '', thuTu: j + 1 });
      });
    });
    return ds;
  }

  return {
    BANG: { DM_BoChiTieu: DM_BoChiTieu, DM_DonVi: DM_DonVi, DM_LinhVuc: DM_LinhVuc, DM_TrangThai: DM_TrangThai, DM_MucDo: DM_MucDo, DM_DonViDo: DM_DonViDo, DM_KyBaoCao: DM_KyBaoCao, DM_ChuongTrinh: DM_ChuongTrinh, CauHinh: CauHinh },
    cauTruc: cauTruc
  };
})();
