"""Sinh lại toàn bộ file mẫu chuẩn bộ chỉ tiêu. Chạy từ thư mục gốc kho mã:

    python3 -I scripts/chuyen-doi/chay_tat_ca.py

- Văn bản Trung ương (đã công khai) ở data/nguon/ → data/bo-chi-tieu/ (có trong kho mã).
- Phụ lục 699 của Thành phố (nội bộ) ở data/rieng/TU-699-nguon.xlsx → data/rieng/ (KHÔNG đưa lên kho công khai).
  Thiếu file này thì bỏ qua TU-699 và đề xuất ghép.
"""
import os
import sys

THU_MUC = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, THU_MUC)
import de_xuat_ghep  # noqa: E402
import de_xuat_tu_mau  # noqa: E402
import mau_chuan  # noqa: E402
import tu699  # noqa: E402
import van_ban_tw  # noqa: E402

GOC = os.path.dirname(os.path.dirname(THU_MUC))
NGUON = os.path.join(GOC, 'data', 'nguon')
DICH = os.path.join(GOC, 'data', 'bo-chi-tieu')
RIENG = os.path.join(GOC, 'data', 'rieng')


def ghi_tu699(nguon_699, dich, da_duyet):
    """Ghi TU-699.xlsx; trộn file tử/mẫu đã duyệt nếu có. Trả câu thông báo (có cảnh báo khi CHƯA trộn)."""
    co = os.path.exists(da_duyet)
    bao_cao = []
    if co:
        de_xuat_tu_mau.doc_da_duyet(da_duyet, bao_cao=bao_cao)
    bo, dongs = tu699.chuyen(nguon_699, tu_mau=da_duyet if co else None)
    mau_chuan.ghi_mau(dich, bo, dongs)
    if co:
        return 'Đã ghi TU-699.xlsx: %d chỉ tiêu, đã trộn tử số/mẫu số đã duyệt.\n  ' % len(dongs) + '\n  '.join(bao_cao)
    return ('Đã ghi TU-699.xlsx: %d chỉ tiêu — CHƯA có file tử số/mẫu số đã duyệt (%s): bốn cột để trống. '
            'KHÔNG đưa file này cho Mr. Nobody nhập lại nếu hệ thống đã có tử số/mẫu số, vì nhập lại sẽ xóa các định nghĩa đó.'
            % (len(dongs), os.path.basename(da_duyet)))


def main():
    os.makedirs(DICH, exist_ok=True)
    tw = []
    for ma in ('LUAT-TK', 'TT13-BNV', 'TT45-BKHCN'):
        van_ban_tw.main(['', ma, NGUON, DICH])
        tw.extend(mau_chuan.doc_mau(os.path.join(DICH, ma + '.xlsx'))[1])
    nguon_699 = os.path.join(RIENG, 'TU-699-nguon.xlsx')
    if not os.path.exists(nguon_699):
        print('Bỏ qua TU-699: không có ' + nguon_699)
        return 0
    # Tử số/mẫu số: dùng file Mr. Nobody đã duyệt nếu có; luôn sinh lại file đề xuất để duyệt.
    print(ghi_tu699(nguon_699, os.path.join(RIENG, 'TU-699.xlsx'), os.path.join(RIENG, 'tu-mau-TU-699-da-duyet.xlsx')))
    dinh_nghia = os.path.join(RIENG, 'dinh-nghia-tu-mau-TU-699.json')
    if os.path.exists(dinh_nghia):
        _, d_tho = tu699.chuyen(nguon_699)
        dx = de_xuat_tu_mau.lap_de_xuat(d_tho, de_xuat_tu_mau.doc_dinh_nghia(dinh_nghia))
        de_xuat_tu_mau.ghi(os.path.join(RIENG, 'de-xuat-tu-mau-TU-699.xlsx'), dx)
        print('Đã ghi de-xuat-tu-mau-TU-699.xlsx: %d dòng' % len(dx))
    _, d699 = mau_chuan.doc_mau(os.path.join(RIENG, 'TU-699.xlsx'))
    bang = de_xuat_ghep.lap_bang(d699, tw)
    de_xuat_ghep.ghi(os.path.join(RIENG, 'de-xuat-ghep.xlsx'), bang)
    print('Đã ghi de-xuat-ghep.xlsx: %d dòng, %d chỉ tiêu có gợi ý'
          % (len(bang), len({r['maTrongBo'] for r in bang if r['goiY']})))
    return 0


if __name__ == '__main__':
    sys.exit(main())
