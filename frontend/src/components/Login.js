import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { Zap, Mail, Lock, UserPlus, LogIn } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.includes("auth/invalid-credential") ? "Sai tài khoản hoặc mật khẩu!" : "Lỗi hệ thống!");
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{isLogin ? "Đăng nhập" : "Đăng ký"}</h2>
          <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">Hệ thống Smart Grid AI</p>
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
            />
          </div>
          {error && <p className="text-red-500 text-xs text-center font-black bg-red-50 p-3 rounded-xl">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />} {isLogin ? "Vào hệ thống" : "Tạo tài khoản"}
          </button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-slate-400 font-bold text-sm hover:text-blue-600 transition">
          {isLogin ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
        </button>
      </div>
    </div>
  );
}
