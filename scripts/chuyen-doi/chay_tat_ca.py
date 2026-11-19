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
import mau_chuan  # noqa: E402
import tu699  # noqa: E402
import van_ban_tw  # noqa: E402

GOC = os.path.dirname(os.path.dirname(THU_MUC))
NGUON = os.path.join(GOC, 'data', 'nguon')
DICH = os.path.join(GOC, 'data', 'bo-chi-tieu')
RIENG = os.path.join(GOC, 'data', 'rieng')


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
    tu699.main(['', nguon_699, os.path.join(RIENG, 'TU-699.xlsx')])
    _, d699 = mau_chuan.doc_mau(os.path.join(RIENG, 'TU-699.xlsx'))
    bang = de_xuat_ghep.lap_bang(d699, tw)
    de_xuat_ghep.ghi(os.path.join(RIENG, 'de-xuat-ghep.xlsx'), bang)
    print('Đã ghi de-xuat-ghep.xlsx: %d dòng, %d chỉ tiêu có gợi ý'
          % (len(bang), len({r['maTrongBo'] for r in bang if r['goiY']})))
    return 0


if __name__ == '__main__':
    sys.exit(main())
