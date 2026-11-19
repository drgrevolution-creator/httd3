"""Đọc nội dung .docx theo đúng thứ tự trong văn bản: đoạn văn và bảng.

Chỉ dùng thư viện chuẩn (zipfile + xml). Chấp nhận file có tên phần dùng dấu "\\"
(một số file văn bản hợp nhất được nén như vậy).
"""
import zipfile
import xml.etree.ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'


def _xml_tai_lieu(duong_dan):
    with zipfile.ZipFile(duong_dan) as z:
        ten = {n.replace('\\', '/'): n for n in z.namelist()}
        return z.read(ten['word/document.xml'])


def _chu_doan(p):
    phan = []
    for el in p.iter():
        if el.tag == W + 't':
            phan.append(el.text or '')
        elif el.tag == W + 'tab':
            phan.append('\t')
        elif el.tag in (W + 'br', W + 'cr'):
            phan.append('\n')
    return ''.join(phan)


def doc_khoi(duong_dan):
    """Trả danh sách khối theo thứ tự: ('p', chữ) hoặc ('tbl', [[ô, ...], ...])."""
    goc = ET.fromstring(_xml_tai_lieu(duong_dan))
    than = goc.find(W + 'body')
    khoi = []
    for el in than:
        if el.tag == W + 'p':
            khoi.append(('p', _chu_doan(el)))
        elif el.tag == W + 'tbl':
            bang = []
            for tr in el.iter(W + 'tr'):
                dong = []
                for tc in tr.findall(W + 'tc'):
                    dong.append('\n'.join(_chu_doan(p) for p in tc.findall('.//' + W + 'p')).strip())
                bang.append(dong)
            khoi.append(('tbl', bang))
        elif el.tag == W + 'sdt':
            for p in el.iter(W + 'p'):
                khoi.append(('p', _chu_doan(p)))
    return khoi


def doc_dong(duong_dan):
    """Phẳng hóa thành danh sách dòng chữ: đoạn văn giữ nguyên, mỗi dòng bảng nối các ô bằng ' ¦ '."""
    ra = []
    for loai, nd in doc_khoi(duong_dan):
        if loai == 'p':
            ra.extend(nd.split('\n'))
        else:
            for dong in nd:
                ra.append(' ¦ '.join(dong))
    return ra
