// client/src/components/SystemStatus.js
import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export default function SystemStatus({ isAlert, message }) {
  if (isAlert) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold text-slate-800 mb-5">TRẠNG THÁI HỆ THỐNG</h3>
        <div className="bg-red-50 p-6 rounded-2xl border-4 border-red-200 text-center text-red-700 animate-pulse flex flex-col items-center gap-3">
          <AlertCircle className="w-10 h-10" />
          <span className="text-3xl font-extrabold tracking-tight uppercase">CẢNH BÁO</span>
          <p className="text-sm font-medium mt-1">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h3 className="text-lg font-semibold text-slate-800 mb-5">TRẠNG THÁI HỆ THỐNG</h3>
      <div className="bg-green-50 p-6 rounded-2xl border-4 border-green-200 text-center text-green-700 flex flex-col items-center gap-3">
        <ShieldCheck className="w-10 h-10" />
        <span className="text-3xl font-extrabold tracking-tight uppercase">AN TOÀN</span>
        <p className="text-sm font-medium mt-1">Hệ thống hoạt động ổn định</p>
      </div>
    </div>
  );
}