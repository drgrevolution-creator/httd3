# 05. Nhập bộ chỉ tiêu và ghép nội hàm (giai đoạn 1b)

Người thực hiện: Mr. Nobody (tài khoản `quantri`). Claude hướng dẫn và chuẩn bị file. Cần khoảng 30–45 phút.

Trước khi làm, hệ thống phải đã được cập nhật lên giai đoạn 1b theo **tài liệu 02, Phần 6**.

## 1. Các file cần dùng

| File | Lấy ở đâu | Số chỉ tiêu | Ghi chú |
|---|---|---|---|
| `TU-699.xlsx` | Claude gửi trong phiên chat. Đây là dữ liệu nội bộ nên **không** có trên GitHub | 174 | Nạp đầy đủ |
| `TT13-BNV.xlsx` | GitHub: thư mục `data/bo-chi-tieu/` | 76 | Đủ năm mục cho 0101, 0203, 0205 |
| `TT45-BKHCN.xlsx` | GitHub: thư mục `data/bo-chi-tieu/` | 137 | Chỉ danh mục |
| `LUAT-TK.xlsx` | GitHub: thư mục `data/bo-chi-tieu/` | 230 | Chỉ danh mục, ghi chú "Nội dung theo NĐ 94/2022/NĐ-CP" |
| `de-xuat-ghep.xlsx` | Claude gửi trong phiên chat | 175 dòng | Danh sách đề xuất ghép để Mr. Nobody duyệt |

Các file `*-day-du.xlsx` trên GitHub có đủ năm mục cho mọi chỉ tiêu. Giai đoạn này **chưa nhập** các file đó (theo quy tắc ưu tiên đã chốt ngày 19/11/2026). Khi cần, chỉ việc nhập file đầy đủ của bộ đó: hệ thống tự cập nhật, không tạo trùng.

**Cách tải một file trên GitHub:** mở `https://github.com/drgrevolution-creator/httd3/tree/main/data/bo-chi-tieu` → bấm vào tên file → bấm nút **Download raw file** (biểu tượng mũi tên xuống, góc phải).

**Không mở rồi lưu lại các file này bằng Excel trước khi nhập.** Excel có thể đổi `0101` thành `101`. Nếu bắt buộc phải sửa, mở file, sửa, lưu đúng định dạng `.xlsx`, rồi kiểm tra cột "Mã gốc" trong bảng xem trước của màn Nhập.

## 2. Nhập bốn bộ

Làm lần lượt **TU-699 → TT13-BNV → TT45-BKHCN → LUAT-TK**. Mỗi bộ làm như sau:

1. Mở trang HTTD 3.0, đăng nhập bằng `quantri`.
2. Bấm menu **📊 Chỉ tiêu**, rồi bấm nút **📥 Nhập từ file** ở góc phải.
3. Bấm **Chọn tệp**, chọn file của bộ. Chờ vài giây để hệ thống đọc file. Lần đầu mở màn này, trình duyệt tải thêm thư viện đọc Excel.
4. Xem phần tóm tắt. Lần nhập đầu phải thấy **Thêm N** (N là số chỉ tiêu ở bảng mục 1), **Sửa 0**, **Hết hiệu lực 0** và không có lỗi.
5. Ô **Căn cứ** đã điền sẵn "Nhập file …". Có thể sửa thành số, ký hiệu văn bản, ví dụ `Thông tư 13/2025/TT-BNV`.
6. Bấm **Ghi vào hệ thống**. Thông báo xanh hiện "Đã nhập N chỉ tiêu vào bộ …".
7. Quay lại màn **Chỉ tiêu**. Số bên cạnh tên bộ phải đúng bằng N.

Khi nhập lại một bộ đã có, bấm **Xem … dòng sẽ sửa** để thấy từng mã và cột thay đổi trước khi ghi. Nếu hiện khung đỏ **"… chỉ tiêu đã ghép nội hàm nhưng đổi tên"**: các dòng đó sẽ được **bỏ ghép**, để số liệu sau này không gắn nhầm chỉ tiêu. Trường hợp này hay gặp khi văn bản mới chèn thêm dòng không số làm mã các dòng sau dịch đi. Sau khi nhập, kiểm tra lại các dòng đó và ghép lại nếu vẫn cùng nội hàm.

**Nếu có lỗi:** danh sách lỗi ghi rõ **số dòng trong Excel** (ví dụ "Dòng 7 · tenNguyenVan: Thiếu tên chỉ tiêu"). Nút Ghi bị khóa cho đến khi file hết lỗi. Hãy chụp màn hình gửi Claude; Claude sửa file và gửi lại.

**Nếu thấy dòng đỏ "… chỉ tiêu sẽ chuyển Hết hiệu lực" kèm ô xác nhận:** file đang chọn **thiếu** một số chỉ tiêu so với bộ đã có trong hệ thống. Chỉ tích ô xác nhận khi chắc chắn đây là file đầy đủ, mới hơn của bộ, ví dụ văn bản mới bãi bỏ một số chỉ tiêu. Nếu không chắc, đừng ghi, hỏi Claude trước. Chỉ tiêu "Hết hiệu lực" không bị xóa; nhập lại file đầy đủ thì chúng trở lại "Còn hiệu lực".

## 3. Duyệt danh sách đề xuất ghép nội hàm

"Ghép nội hàm" nghĩa là xác nhận một chỉ tiêu của Thành phố (TU-699) và một chỉ tiêu Trung ương thực chất là **cùng một chỉ tiêu**. Sau khi ghép, hai chỉ tiêu dùng chung một mã chỉ tiêu chuẩn trong hệ thống. Hệ thống **không tự ghép**: chỉ ghép những cặp Mr. Nobody đã duyệt.

1. Mở file `de-xuat-ghep.xlsx`. Mỗi dòng là một chỉ tiêu TU-699, kèm gợi ý (nếu có) chỉ tiêu Trung ương có tên gần giống và điểm giống tên từ 0,6 đến 1.
2. Điền cột **Đồng ý** theo quy ước:
   - `C`: đồng ý ghép với gợi ý trên dòng đó;
   - một mã khác, ví dụ `LUAT-TK:0102`: muốn ghép với chỉ tiêu khác, không phải gợi ý. Nên điền cho cả những dòng không có gợi ý nếu Mr. Nobody biết chỉ tiêu tương ứng;
   - để trống: không ghép.
3. Chỉ có 16/174 chỉ tiêu được gợi ý tự động, vì máy chỉ so được chữ trong tên. Những cặp giống về nghĩa nhưng khác chữ (ví dụ "Dân số trung bình" và "0102 Dân số, mật độ dân số") cần Mr. Nobody điền tay.
4. Lưu file, gửi lại Claude trong phiên chat.

## 4. Claude chuẩn bị, Mr. Nobody ghép trên màn hình

Sau khi nhận file đã duyệt, Claude sẽ:

- lập **bảng ghép** gồm, cho mỗi cặp: dòng gốc (bộ có hiệu lực pháp lý cao nhất trong cặp: Luật Thống kê, rồi Thông tư, rồi TU-699), mã chỉ tiêu chuẩn đề xuất (ví dụ `DS-01`) và các dòng cần ghép theo;
- nếu dòng gốc thuộc `LUAT-TK`, gửi file `LUAT-TK.xlsx` bản bổ sung năm mục (trích NĐ 94/2022/NĐ-CP) **chỉ cho các dòng đã ghép**. Mr. Nobody nhập lại file này theo mục 2; tóm tắt phải là "Sửa N", "Hết hiệu lực 0".

Ghép từng cặp trên màn **Chỉ tiêu**:

1. Chọn bộ của dòng gốc, tìm chỉ tiêu (gõ tên hoặc mã vào ô tìm), bấm vào dòng đó.
2. Trong tấm chi tiết, bấm **🔗 Ghép nội hàm**, điền **Mã mới** theo bảng ghép (tên đã điền sẵn), rồi bấm **Ghép**. Hệ thống tạo chỉ tiêu chuẩn mới, sao năm mục từ dòng gốc, và tự gợi ý mức liên quan cấp xã (A nếu có cấp xã, C nếu chỉ cấp Thành phố).
3. Mở dòng cần ghép theo (ví dụ dòng TU-699), bấm **Ghép nội hàm**, chọn mã vừa tạo ở ô **Ghép với chỉ tiêu chuẩn có sẵn**, rồi bấm **Ghép**.
4. Mở lại một trong hai dòng: mục **Cùng nội hàm ở các bộ khác** phải hiện dòng còn lại.
5. Bấm thẻ **Chỉ tiêu chuẩn** ở đầu màn: mã vừa tạo hiện với **Số bộ** = số bộ đã ghép. Bấm vào mã để xem năm mục chuẩn và các dòng đang ghép.

Việc ghép được ghi vào nhật ký, kèm căn cứ là "Theo danh sách đề xuất ghép đã duyệt". Nhập lại file của bộ **không** xóa các liên kết đã ghép.

## 5. Sự cố thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Không tải được thư viện đọc Excel" | Mạng chặn `cdnjs.cloudflare.com`; thử mạng khác (4G) rồi chọn lại file |
| "File không đúng mẫu chuẩn: cần hai sheet Bo và ChiTieu" | Chọn nhầm file, ví dụ chọn `de-xuat-ghep.xlsx`; chỉ nhập file mẫu chuẩn |
| "File quá lớn để gửi một lần" | Báo Claude. **Không** tự tách một bộ thành nhiều file, vì những dòng không có trong file sẽ bị chuyển "Hết hiệu lực" |
| Cột Mã gốc hiện `101` thay vì `0101` | File đã bị Excel lưu lại; tải lại file gốc từ GitHub hoặc nhờ Claude gửi lại |
| "Hệ thống đang bận" | Có thao tác ghi khác đang chạy; đợi vài giây rồi bấm Ghi lại |
| "Không có chỉ tiêu chuẩn …" khi ghép | Mã gõ ở ô chọn chưa tồn tại; tạo mới bằng ô **Mã mới** trước |
