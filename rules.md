# NGUYÊN TẮC VẬN HÀNH VÀ CHỨC NĂNG CỐT LÕI

**Dự án:** Hệ thống Cảnh báo Điện năng Thông minh (AI GRID PRO)

Tài liệu này quy định các nguyên tắc hoạt động và phân nhóm chức năng cốt lõi của hệ thống, làm cơ sở cho việc lập trình, vận hành và đánh giá đồ án.

---

## 📦 NHÓM A: GIÁM SÁT & ĐO LƯỜNG (Nền tảng)

_Đảm bảo tính chính xác và tính thời gian thực (Real-time) trong việc thu thập dữ liệu điện năng._

1. **Giám sát thời gian thực:** Đọc và hiển thị chính xác công suất tiêu thụ (W) của nguồn tổng (Master) và các thiết bị nhánh (Sub-meters) ngay lập tức.
2. **Trực quan hóa dữ liệu:** Vẽ biểu đồ phụ tải (Live Line Chart) để hiển thị sự biến động của dòng điện theo từng giây, giúp người dùng dễ dàng theo dõi thói quen sử dụng.
3. **Quy đổi điện năng & Chi phí:** Tự động quy đổi từ Công suất tức thời (W) sang Điện năng tiêu thụ (kWh) và tính toán số tiền điện tương ứng dựa trên đơn giá quy định.

---

## 🛡️ NHÓM B: HỆ THỐNG 3 LỚP CẢNH BÁO THÔNG MINH (Trọng tâm Đồ án)

_Đây là nhóm chức năng thông minh, quyết định giá trị thực tiễn và tính an toàn của toàn bộ hệ thống._

1. **Lớp 1 - Chống câu trộm/Rò rỉ điện (Theft/Leakage):**
   - **Nguyên lý:** Hệ thống liên tục đối chiếu `Công suất Tổng` với `Tổng công suất các thiết bị nhánh`.
   - **Kích hoạt:** Nếu lượng điện năng thất thoát vượt quá mức sai số tự nhiên (mặc định > 30W), hệ thống nhận định có sự can thiệp trái phép hoặc rò rỉ nghiêm trọng và phát báo động đỏ ngay lập tức.
2. **Lớp 2 - Cảnh báo Quá tải (Overload):**
   - **Nguyên lý:** Khách hàng chủ động cài đặt ngưỡng công suất an toàn (Ví dụ: 2000W).
   - **Kích hoạt:** Khi tổng tải sử dụng vượt qua ngưỡng này, hệ thống gửi cảnh báo yêu cầu giảm tải để ngăn chặn nguy cơ chập cháy, hỏa hoạn.
3. **Lớp 3 - Bảo vệ An ninh (Vắng nhà):**
   - **Nguyên lý:** Người dùng gạt nút "Chế độ bảo vệ" trên giao diện khi đi làm hoặc vắng nhà.
   - **Kích hoạt:** Ở chế độ này, nếu hệ thống ghi nhận có dòng điện tiêu thụ bất thường (> 50W), chứng tỏ có người lạ đột nhập hoặc thiết bị bị kích hoạt ngoài ý muốn, sự cố an ninh sẽ được ghi nhận tức thời.

---

## 📊 NHÓM C: QUẢN LÝ & LƯU TRỮ (Thực tế hóa)

_Tối ưu hóa quy trình quản lý dành cho cả người dùng cuối (Khách thuê) và người quản trị (Chủ nhà/Tòa nhà)._

1. **Quản lý ví điện tử:** Vận hành hệ thống thanh toán tiền điện theo mô hình ngân sách trả trước (tương tự nạp thẻ điện thoại), giúp kiểm soát chi tiêu chặt chẽ.
2. **Đối soát hóa đơn:** Tự động chốt hóa đơn hàng tháng và lưu trữ an toàn vào lịch sử dữ liệu (Database), minh bạch hóa chi phí giữa các bên.
3. **Quản lý đa khu vực (Multi-Tenancy):** Cấp quyền cho tài khoản Quản trị viên (Admin) để giám sát tập trung, quản lý dữ liệu và thiết lập cấu hình cho hàng loạt phòng trọ/căn hộ khác nhau hoàn toàn từ xa.
