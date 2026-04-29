const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// Cấu hình CORS để cho phép Frontend kết nối
app.use(
  cors({
    origin: "http://localhost:3000", // Cổng mặc định của React
    methods: ["GET", "POST"],
  }),
);

const server = http.createServer(app);

// Khởi tạo Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// --- LOGIC KẾT NỐI ---
io.on("connection", (socket) => {
  console.log("⚡ Thiết bị/Trình duyệt mới đã kết nối:", socket.id);

  // Nhận lệnh "Chốt Bill" từ Frontend
  socket.on("saveBill", (billData) => {
    console.log("📄 Nhận dữ liệu hóa đơn mới:");
    console.log(`   - Ngày: ${billData.date}`);
    console.log(`   - Điện năng: ${billData.kwh} kWh`);
    console.log(`   - Thành tiền: ${billData.amount} VNĐ`);

    // Tại đây anh có thể thêm logic lưu vào cơ sở dữ liệu (MySQL/MongoDB) nếu muốn.
    // Hiện tại Server sẽ xác nhận đã nhận dữ liệu thành công.
    socket.emit("saveResponse", { status: "success", message: "Hóa đơn đã được ghi nhận tại Server" });
  });

  socket.on("disconnect", () => {
    console.log("❌ Một người dùng đã ngắt kết nối");
  });
});

// --- CẤU HÌNH CỔNG CHẠY ---
const PORT = 5000;
server.listen(PORT, () => {
  console.log("==============================================");
  console.log(`🚀 BACKEND SMART GRID ĐANG CHẠY TẠI:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log("==============================================");
});
