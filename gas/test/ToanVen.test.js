const test = require('node:test');
const assert = require('node:assert/strict');
const { taiThuan } = require('./_moiTruong');

test('toàn vẹn phát hiện trùng khóa, tham chiếu gãy, tùy chọn sai, bắt buộc rỗng', () => {
  const { ToanVen } = taiThuan();
  const r = ToanVen.kiemTra({
    DM_DonVi: [
      { maDonVi: 'DV01', tenDayDu: 'VP', tenVietTat: 'VP', nhom: 'DV', tinhTrang: 'Hoạt động' },
      { maDonVi: 'DV01', tenDayDu: 'VP2', tenVietTat: 'VP2', nhom: 'DV', tinhTrang: 'Hoạt động' },
      { maDonVi: 'DV02', tenDayDu: 'PKT', tenVietTat: 'PKT', nhom: 'SAI', tinhTrang: 'Hoạt động' },
      { maDonVi: 'DV03', tenDayDu: '', tenVietTat: 'PVHXH', nhom: 'DV', tinhTrang: 'Hoạt động' },
      { maDonVi: 'DV08', tenDayDu: 'Cũ', tenVietTat: 'CU', nhom: 'DV', tinhTrang: 'Xóa mềm' }
    ],
    DM_NguoiDung: [
      { maNguoiDung: 'ND-0001', tenDangNhap: 'a', hoTen: 'A', email: 'a@x.com', vaiTro: ['QUANTRI'], danhSachDonVi: ['DV09', 'DV08'], tinhTrang: 'Hoạt động' },
      { maNguoiDung: 'ND-0002', tenDangNhap: 'b', hoTen: 'B', email: 'b@x.com', vaiTro: ['DONVI'], danhSachDonVi: ['DV01'], tinhTrang: 'Hoạt động' }
    ]
  });
  assert.ok(r.some((x) => x.quanHe === 'KHOA_TRUNG' && x.bang === 'DM_DonVi' && x.ma === 'DV01'));
  assert.ok(r.some((x) => x.quanHe === 'THAM_CHIEU' && x.bang === 'DM_NguoiDung' && x.ma === 'ND-0001' && /DV09/.test(x.giaTriHienTai)));
  assert.ok(r.some((x) => x.quanHe === 'THAM_CHIEU' && x.ma === 'ND-0001' && /DV08/.test(x.giaTriHienTai)), 'tham chiếu tới bản ghi Xóa mềm phải báo');
  assert.ok(r.some((x) => x.quanHe === 'TUY_CHON' && x.ma === 'DV02'));
  assert.ok(r.some((x) => x.quanHe === 'BAT_BUOC' && x.ma === 'DV03'));
  assert.ok(!r.some((x) => x.ma === 'ND-0002'), 'bản ghi đúng không được báo');
  for (const x of r) assert.equal(x.ketQua, 'LECH');
});

test('dữ liệu sạch trả mảng rỗng; bảng không có trong dữ liệu được bỏ qua', () => {
  const { ToanVen } = taiThuan();
  assert.deepEqual(ToanVen.kiemTra({ DM_LinhVuc: [{ maLinhVuc: 'CCHC', tenLinhVuc: 'Cải cách hành chính', tinhTrang: 'Hoạt động' }] }), []);
});
