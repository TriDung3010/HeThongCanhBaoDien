// client/src/components/Sidebar.js
import React from 'react';
import { Activity, BarChart2, Bell, ClipboardList, Settings, SlidersHorizontal, Volt } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: Activity, href: '/', active: true },
  { name: 'Lịch sử sự cố', icon: ClipboardList, href: '/history' },
  { name: 'Cấu hình ngưỡng', icon: SlidersHorizontal, href: '/settings' },
  { name: 'Quản lý thiết bị', icon: BarChart2, href: '#' },
  { name: 'Báo cáo', icon: Bell, href: '#' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-950 text-white min-h-screen p-6 flex flex-col">
      <div className="flex items-center gap-3 pb-8 border-b border-slate-800 mb-8">
        <SlidersHorizontal className="text-blue-500 w-8 h-8" />
        <h2 className="text-xl font-bold tracking-tight">SMART GRID AI</h2>
      </div>
      <nav className="flex-1 space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3.5 p-3.5 rounded-xl text-base font-medium transition duration-200 ${
                item.active
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span>{item.name}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}