import React from "react";
import { LayoutDashboard, History, Settings, LogOut, Zap, ClipboardList } from "lucide-react";
import { auth } from "../firebase";

export default function Sidebar({ isAdmin, setView, currentView }) {
  const menuItems = [
    { id: "overview", name: "Tổng quan", icon: LayoutDashboard },
    { id: "history", name: "Lịch sử Bill", icon: History },
    { id: "settings", name: "Cài đặt", icon: Settings },
  ];

  return (
    <aside className="w-72 bg-slate-950 text-white min-h-screen p-6 flex flex-col shadow-2xl">
      <div className="flex items-center gap-3 pb-10 border-b border-slate-800 mb-10 px-2">
        <div className="bg-blue-600 p-2.5 rounded-xl">
          <Zap size={24} className="text-white fill-white" />
        </div>
        <h2 className="text-xl font-black tracking-tighter">AI GRID PRO</h2>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                currentView === item.id ? "bg-blue-600 text-white shadow-xl shadow-blue-500/30" : "text-slate-500 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-8 border-t border-slate-800">
        <button onClick={() => auth.signOut()} className="w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black text-red-500 hover:bg-red-500/10 transition uppercase tracking-widest">
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
