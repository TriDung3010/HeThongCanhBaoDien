import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { ref, set, onValue, remove } from "firebase/database";
import { Zap, Mail, Lock, UserPlus, LogIn, Home } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // STATE: Danh sách phòng trống và phòng khách đang chọn
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");

  // Lấy danh sách phòng trống từ Database
  useEffect(() => {
    const roomsRef = ref(db, "availableRooms");
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setAvailableRooms(list);
        if (list.length > 0) setSelectedRoom(list[0].id);
      } else {
        setAvailableRooms([]);
        setSelectedRoom("");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        // ĐĂNG NHẬP
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // ĐĂNG KÝ
        if (availableRooms.length === 0 || !selectedRoom) {
          return setError("Hiện không có phòng trống! Vui lòng liên hệ Admin.");
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = userCredential.user;

        // Tìm thông tin phòng khách vừa chọn
        const roomInfo = availableRooms.find((r) => r.id === selectedRoom);

        // Tạo dữ liệu phòng mới: Trống trơn, 0 đồng, cúp điện
        await set(ref(db, `phongtro/${user.uid}`), {
          roomName: roomInfo.name,
          currentPower: 0,
          totalDevicePower: 0,
          isPowerOn: false,
          isSecurityOn: false,
          threshold: 2000,
          budget: 0, // Bắt đầu với 0 đồng
          deviceList: [], // Chưa có thiết bị nào
        });

        // Đã có chủ -> Xóa phòng khỏi danh sách phòng trống
        await remove(ref(db, `availableRooms/${selectedRoom}`));
      }
    } catch (err) {
      if (err.message.includes("auth/invalid-credential")) {
        setError("Sai tài khoản hoặc mật khẩu!");
      } else if (err.message.includes("auth/email-already-in-use")) {
        setError("Email này đã được đăng ký!");
      } else {
        setError("Lỗi hệ thống! Vui lòng thử lại.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
        <div className="text-center mb-10">
          <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Zap className="w-10 h-10 text-blue-600 fill-blue-600/10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            {isLogin ? "Đăng nhập" : "Đăng ký"}
          </h2>
          <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">
            Hệ thống Smart Grid AI
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-4.5 text-slate-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email"
              className="w-full p-4 pl-12 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-700"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4.5 text-slate-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Mật khẩu"
              className="w-full p-4 pl-12 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-700"
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {/* MỤC CHỌN PHÒNG CHỈ HIỆN KHI ĐĂNG KÝ */}
          {!isLogin && (
            <div className="relative">
              <Home className="absolute left-4 top-4.5 text-slate-400 w-5 h-5" />
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full p-4 pl-12 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-700 appearance-none"
                required
              >
                {availableRooms.length > 0 ? (
                  availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))
                ) : (
                  <option value="">Không có phòng trống</option>
                )}
              </select>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-xs text-center font-black bg-red-50 p-3 rounded-xl animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}{" "}
            {isLogin ? "Vào hệ thống" : "Dọn vào phòng mới"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
          className="w-full mt-6 text-slate-400 font-bold text-sm hover:text-blue-600 transition"
        >
          {isLogin
            ? "Chưa có tài khoản? Khách thuê đăng ký"
            : "Đã có tài khoản? Đăng nhập"}
        </button>
      </div>
    </div>
  );
}
