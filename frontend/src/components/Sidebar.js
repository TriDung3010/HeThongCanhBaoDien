import React from "react";
import { LayoutDashboard, Users, History, Settings, LogOut, Zap } from "lucide-react";
import { auth } from "../firebase";

export default function Sidebar({ isAdmin, setView, currentView }) {
  const menuItems = [
    { id: "overview", name: "Giám sát chi tiết", icon: LayoutDashboard },
    { id: "rooms", name: "Quản lý phòng", icon: Users, adminOnly: true },
    { id: "history", name: "Lịch sử hóa đơn", icon: History },
    { id: "settings", name: "Cấu hình hệ thống", icon: Settings },
  ];

  return (
    <aside className="w-80 bg-[#0f172a] text-white h-screen sticky top-0 flex-shrink-0 p-8 flex flex-col border-r border-slate-800/50 shadow-2xl">
      <div className="flex items-center gap-4 pb-12 mb-10 border-b border-slate-800/60 px-2">
        <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 transform -rotate-3">
          <Zap className="text-white fill-white" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tighter uppercase italic leading-none">
            SmartGrid <span className="text-blue-500">Pro</span>
          </h2>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">An ninh điện 24/7</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
        {menuItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                isActive ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <div className={`p-2 rounded-xl ${isActive ? "bg-white/20" : "bg-slate-800"}`}>
                <Icon size={18} strokeWidth={isActive ? 3 : 2} />
              </div>
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-8 mt-6 border-t border-slate-800/60">
        <button
          onClick={() => auth.signOut()}
          className="w-full flex items-center gap-4 p-4 rounded-[1.25rem] text-[11px] font-black text-red-500 hover:bg-red-500/10 transition-all duration-300 uppercase tracking-widest"
        >
          <div className="p-2 bg-red-500/10 rounded-xl">
            <LogOut size={18} />
          </div>
          <span>Thoát hệ thống</span>
        </button>
      </div>
    </aside>
  );
}
