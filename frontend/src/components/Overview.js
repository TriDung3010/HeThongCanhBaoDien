import React from "react";
import {
  ZapOff,
  AlertTriangle,
  ShieldAlert,
  Activity,
  Zap,
} from "lucide-react";
import StatCard from "./StatCard";
import LineChart from "./LineChart";
import SystemStatus from "./SystemStatus";
import { db } from "../firebase";
import { ref, update } from "firebase/database";

export default function Overview({
  billing,
  pricePerKwh,
  leakagePower,
  config,
  data,
  chartData,
  activeDevices,
  roomPath,
  topUpAmount,
  setTopUpAmount,
  submitTopUp,
}) {
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {billing.budget <= 0 && (
        <div className="bg-slate-900 text-red-400 p-6 rounded-[2rem] flex items-center gap-5 shadow-2xl border border-red-500/30">
          <div className="bg-red-500/20 p-3 rounded-full">
            <ZapOff size={28} />
          </div>
          <div>
            <h4 className="font-black uppercase text-sm tracking-widest">
              Hệ thống cúp điện do hết ngân sách
            </h4>
            <p className="text-xs font-medium opacity-80 mt-1">
              Số dư tài khoản 0đ. Vui lòng nạp thêm tiền.
            </p>
          </div>
        </div>
      )}

      {leakagePower > 15 && config.isSecurityOn && (
        <div className="bg-red-600 text-white p-7 rounded-[3rem] flex items-start gap-6 shadow-2xl animate-pulse">
          <ShieldAlert size={40} className="mt-1" />
          <div>
            <h4 className="font-black uppercase text-sm tracking-widest border-b border-red-500 pb-2 mb-2">
              Phát hiện thất thoát / Câu trộm điện
            </h4>
            <div className="text-xs font-medium opacity-95 space-y-1">
              <p>
                • Công suất nguồn tổng: <b>{data.master}W</b>.
              </p>
              <p>
                • Công suất thiết bị: <b>{data.totalDevicePower}W</b>.
              </p>
              <p className="text-yellow-200 mt-2">
                = Phát hiện chênh lệch <b>{leakagePower.toFixed(1)}W</b> đang rò
                rỉ!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatCard
          label="Công suất tổng"
          value={data.master}
          unit="W"
          type="zap"
        />
        <StatCard
          label="Hóa đơn tạm"
          value={Math.round(billing.cost).toLocaleString()}
          unit="đ"
        />
        <StatCard
          label="Điện năng tiêu thụ"
          value={billing.kwh.toFixed(3)}
          unit="kWh"
          iconColor="text-emerald-500"
        />
        <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-200 text-white relative">
          <p className="text-[10px] font-black uppercase mb-3 opacity-80 tracking-widest">
            Ngân sách khả dụng
          </p>
          <h2 className="text-3xl font-black">
            {Math.round(billing.budget).toLocaleString()}{" "}
            <small className="text-sm font-bold">VNĐ</small>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative">
            <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} className="text-blue-600" /> Biểu đồ phụ tải
                (Live)
              </h3>
            </div>
            <LineChart data={chartData} />
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Zap size={16} className="text-blue-500" /> Thiết bị
            </h3>
            <div className="flex flex-wrap gap-4">
              {activeDevices.length > 0 || leakagePower > 15 ? (
                <>
                  {activeDevices.map((d) => (
                    <span
                      key={d.id}
                      className="bg-blue-50/70 text-blue-700 px-5 py-3 rounded-2xl text-xs font-black tracking-wide border border-blue-100 flex items-center gap-2 shadow-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      {d.name}{" "}
                      <span className="opacity-60 font-bold ml-1">
                        ({d.power}W)
                      </span>
                    </span>
                  ))}
                </>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Không có thiết bị bật.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <SystemStatus
            isAlert={leakagePower > 15 || data.master > config.threshold}
          />
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-8 tracking-widest">
              Nạp tiền & Bảo vệ
            </h4>
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                <span className="text-[10px] font-black text-slate-500 uppercase">
                  Chế độ bảo vệ
                </span>
                <button
                  onClick={() =>
                    update(ref(db, roomPath), {
                      isSecurityOn: !config.isSecurityOn,
                    })
                  }
                  className={`w-14 h-7 rounded-full transition-all duration-300 ${config.isSecurityOn ? "bg-emerald-500" : "bg-slate-300"} relative`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${config.isSecurityOn ? "right-1" : "left-1"}`}
                  />
                </button>
              </div>
              <div className="pt-2 flex gap-3">
                <input
                  type="number"
                  placeholder="Số tiền..."
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="flex-1 w-2/3 bg-slate-50 border border-slate-200 rounded-[1.5rem] px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                />
                <button
                  onClick={submitTopUp}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-[1.5rem] font-black text-[10px] uppercase shadow-sm transition-all whitespace-nowrap"
                >
                  Nạp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
