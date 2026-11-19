'use strict';
// Dịch vụ Google GIẢ LẬP tối thiểu để chạy lớp kết nối trong Node: đủ cho KhoDuLieu, XacThuc, DanhMucGas, LichDem, ThietLap.
// Không phải bản sao đầy đủ của Apps Script; chỉ mô phỏng hành vi mà mã của dự án dựa vào.
const crypto = require('node:crypto');

function taoDichVuGia(tuyChon) {
  tuyChon = tuyChon || {};
  const trangThai = { props: {}, cache: {}, mail: [], triggers: [], files: {}, folders: {}, log: [], lockHeld: false, lockCount: 0, ghiKhiKhongKhoa: [], setValuesDem: {}, fetch: tuyChon.fetch || (() => ({ code: 200, text: '{}' })) };
  let dem = 0; const id = (p) => p + '_' + (++dem);

  class Range {
    constructor(sheet, r, c, nr, nc) { this.sh = sheet; this.r = r; this.c = c; this.nr = nr; this.nc = nc; if (c + nc - 1 > sheet.maxCols) throw new Error('The coordinates or dimensions of the range are invalid.'); }
    getValues() { const out = []; for (let i = 0; i < this.nr; i++) { const row = this.sh.rows[this.r - 1 + i] || []; out.push(Array.from({ length: this.nc }, (_, j) => (row[this.c - 1 + j] === undefined ? '' : row[this.c - 1 + j]))); } return out; }
    setValues(vals) {
      if (!trangThai.lockHeld) trangThai.ghiKhiKhongKhoa.push(this.sh.name);
      trangThai.setValuesDem[this.sh.name] = (trangThai.setValuesDem[this.sh.name] || 0) + 1;
      for (let i = 0; i < vals.length; i++) { const ri = this.r - 1 + i; while (this.sh.rows.length <= ri) this.sh.rows.push([]); for (let j = 0; j < vals[i].length; j++) this.sh.rows[ri][this.c - 1 + j] = vals[i][j]; }
      return this;
    }
    setNumberFormats() { return this; } setNumberFormat() { return this; } setFontWeight() { return this; } setBackground() { return this; } setFontStyle() { return this; } setFontColor() { return this; }
  }
  class Sheet {
    constructor(ss, name) { this.ss = ss; this.name = name; this.rows = []; this.maxCols = 26; this.frozen = 0; }
    getName() { return this.name; } getLastRow() { return this.rows.length; } getMaxColumns() { return this.maxCols; }
    insertColumnsAfter(after, n) { this.maxCols = Math.max(this.maxCols, after + n); return this; }
    getRange(r, c, nr, nc) { return new Range(this, r, c, nr === undefined ? 1 : nr, nc === undefined ? 1 : nc); }
    getDataRange() { return new Range(this, 1, 1, Math.max(this.rows.length, 1), this.maxCols); }
    appendRow(vals) { if (!trangThai.lockHeld) trangThai.ghiKhiKhongKhoa.push(this.name); this.rows.push(vals.slice()); return this; }
    setFrozenRows(n) { this.frozen = n; return this; }
  }
  class Spreadsheet {
    constructor(name) { this.id = id('ss'); this.name = name; this.sheets = [new Sheet(this, 'Sheet1')]; trangThai.files[this.id] = { id: this.id, name, kind: 'ss', ss: this }; }
    getId() { return this.id; } getName() { return this.name; }
    getSheetByName(n) { return this.sheets.find((s) => s.name === n) || null; }
    insertSheet(n) { const s = new Sheet(this, n); this.sheets.push(s); return s; }
    getSheets() { return this.sheets.slice(); }
    deleteSheet(s) { this.sheets = this.sheets.filter((x) => x !== s); }
  }
  class File { constructor(f) { this.f = f; } getId() { return this.f.id; } getName() { return this.f.name; } setTrashed(t) { this.f.trashed = t; }
    makeCopy(name, folder) { if (tuyChon.copyFails) throw new Error('Drive storage quota exceeded'); const c = { id: id('copy'), name, kind: 'copy', folderId: folder.id }; trangThai.files[c.id] = c; return new File(c); }
    moveTo(folder) { this.f.folderId = folder.id; return this; } }
  class Folder { constructor(f) { this.f = f; this.id = f.id; } getId() { return this.f.id; } getName() { return this.f.name; }
    getFoldersByName(n) { const ds = Object.values(trangThai.folders).filter((x) => x.parent === this.f.id && x.name === n && !x.trashed); let i = 0; return { hasNext: () => i < ds.length, next: () => new Folder(ds[i++]) }; }
    createFolder(n) { const f = { id: id('fd'), name: n, parent: this.f.id }; trangThai.folders[f.id] = f; return new Folder(f); }
    getFiles() { const ds = Object.values(trangThai.files).filter((x) => x.folderId === this.f.id && !x.trashed); let i = 0; return { hasNext: () => i < ds.length, next: () => new File(ds[i++]) }; } }
  const root = { id: 'root', name: 'root' }; trangThai.folders.root = root;

  const G = {
    console: { log: (...a) => trangThai.log.push(a.join(' ')), error: (...a) => trangThai.log.push('ERR ' + a.join(' ')), warn: () => {} },
    SpreadsheetApp: { create: (n) => new Spreadsheet(n), openById: (i) => { const f = trangThai.files[i]; if (!f || f.kind !== 'ss') throw new Error('Not found: ' + i); return f.ss; } },
    DriveApp: { getRootFolder: () => new Folder(root), createFolder: (n) => new Folder(root).createFolder(n), getFolderById: (i) => { const f = trangThai.folders[i]; if (!f || f.trashed) throw new Error('Folder not found'); return new Folder(f); }, getFileById: (i) => { const f = trangThai.files[i]; if (!f) throw new Error('File not found: ' + i); return new File(f); } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in trangThai.props ? trangThai.props[k] : null), setProperty: (k, v) => { trangThai.props[k] = String(v); }, setProperties: (o) => { Object.keys(o).forEach((k) => { trangThai.props[k] = String(o[k]); }); } }) },
    CacheService: { getScriptCache: () => ({ get: (k) => (k in trangThai.cache ? trangThai.cache[k] : null), put: (k, v) => { trangThai.cache[k] = v; }, remove: (k) => { delete trangThai.cache[k]; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => { if (trangThai.lockHeld) return false; trangThai.lockHeld = true; trangThai.lockCount++; return true; }, releaseLock: () => { trangThai.lockHeld = false; } }) },
    Utilities: { DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }, computeDigest: (alg, s) => Array.from(crypto.createHash('sha256').update(s, 'utf8').digest()).map((b) => (b > 127 ? b - 256 : b)), getUuid: () => crypto.randomUUID() },
    UrlFetchApp: { fetch: (url, o) => { const r = trangThai.fetch(url, o); return { getResponseCode: () => r.code, getContentText: () => r.text }; } },
    MailApp: { sendEmail: (to, subject, body) => trangThai.mail.push({ to, subject, body }) },
    ScriptApp: { getProjectTriggers: () => trangThai.triggers.map((t) => ({ getHandlerFunction: () => t.fn, _t: t })), deleteTrigger: (tr) => { trangThai.triggers = trangThai.triggers.filter((t) => t !== tr._t); }, newTrigger: (fn) => { const t = { fn }; const b = { timeBased: () => b, everyDays: () => b, atHour: (h) => { t.hour = h; return b; }, create: () => { trangThai.triggers.push(t); return t; } }; return b; } },
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: (s) => ({ _s: s, setMimeType() { return this; }, getContent: () => s }) },
    Session: { getScriptTimeZone: () => 'Asia/Ho_Chi_Minh' }
  };
  return { G, trangThai };
}
module.exports = { taoDichVuGia };
