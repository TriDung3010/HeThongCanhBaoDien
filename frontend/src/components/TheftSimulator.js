import React from "react";
import { db } from "../firebase";
import { ref, update } from "firebase/database";
import { Skull, Droplet, Flame, Zap, PowerOff } from "lucide-react";

export default function TheftSimulator({
  roomUID,
  isStealing,
  setIsStealing,
  stolenAmount,
  setStolenAmount,
  totalDevicePower,
}) {
  const setStolenPower = (power) => {
    if (isStealing)
      return alert("Vui lòng NGẮT KẾT NỐI trước khi đổi thiết bị khác!");
    setStolenAmount(power);
  };

  const stopTheft = () => {
    // Bước 1: Tắt trạng thái ăn trộm trên giao diện
    setIsStealing(false);

    // Bước 2: Dùng setTimeout ép Firebase đợi 300ms để React kịp báo cho Dashboard biết là "Đã tắt câu trộm"
    // Nếu không đợi, Firebase trừ điện quá nhanh, Dashboard sẽ tưởng nhầm là bị sụt điện và tự động bơm điện bù vào.
    setTimeout(() => {
      update(ref(db, `phongtro/${roomUID}`), {
        currentPower: totalDevicePower,
      });
    }, 300);
  };

  const toggleTheft = () => {
    if (stolenAmount === 0)
      return alert("Đồng chí chưa chọn thiết bị câu trộm!");

    if (!isStealing) {
      setIsStealing(true);
      update(ref(db, `phongtro/${roomUID}`), {
        currentPower: totalDevicePower + stolenAmount,
      });
    } else {
      stopTheft();
    }
  };

  return (
    <div
      className={`animate-in fade-in duration-500 rounded-[3rem] p-10 transition-colors ${
        isStealing
          ? "bg-red-950/40 border border-red-900"
          : "bg-slate-900 border border-slate-800"
      }`}
    >
      <header className="mb-10 text-center border-b border-red-900/50 pb-8">
        <h2 className="text-3xl font-black text-red-500 tracking-widest uppercase flex items-center justify-center gap-3">
          <Skull size={32} /> CÔNG CỤ CAN THIỆP ĐIỆN NĂNG
        </h2>
        <p className="text-red-400/70 mt-2 text-xs font-bold uppercase tracking-widest">
          Giả lập hành vi đấu nối trái phép vào công tơ chính
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-black/50 p-8 rounded-[2rem] border border-slate-800 flex flex-col justify-center relative overflow-hidden">
          {isStealing && (
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
          )}
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
            Dữ liệu phòng mục tiêu đang theo dõi
          </h3>
          <div className="flex justify-between items-end">
            <p className="text-slate-400 font-medium text-sm">
              Công suất hợp pháp:
            </p>
            <p className="text-4xl font-black text-blue-500">
              {totalDevicePower} <span className="text-lg">W</span>
            </p>
          </div>
        </div>

        <div className="bg-black/50 p-8 rounded-[2rem] border border-red-900/30 text-center">
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-4">
            Công suất bơm ảo
          </p>
          <p className="text-5xl font-black text-white mb-6">
            {stolenAmount} <span className="text-lg text-slate-500">W</span>
          </p>
          <div className="flex gap-4">
            <button
              onClick={toggleTheft}
              className={`flex-1 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                isStealing
                  ? "bg-slate-800 text-red-500 animate-pulse border border-red-900"
                  : "bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
              }`}
            >
              {isStealing ? "ĐANG RÚT ĐIỆN - BẤM ĐỂ DỪNG" : "TIẾN HÀNH CÂU MÓC"}
            </button>
            {isStealing && (
              <button
                onClick={() => {
                  stopTheft();
                  setStolenAmount(0); // Nút này sẽ dừng và reset bộ đếm về 0
                }}
                className="bg-red-600 hover:bg-red-500 text-white p-5 rounded-2xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center justify-center"
                title="Tắt toàn bộ giả lập và đặt lại"
              >
                <PowerOff size={24} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 text-center">
          Chọn tải câu móc
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setStolenPower(500)}
            className={`p-6 rounded-3xl border flex flex-col items-center justify-center gap-4 transition-all ${stolenAmount === 500 ? "bg-red-900/40 border-red-500 text-red-400" : "bg-black/40 border-slate-800 text-slate-500 hover:border-slate-600"}`}
          >
            <Droplet size={32} />
            <span className="font-bold">Mô tơ nước (500W)</span>
          </button>
          <button
            onClick={() => setStolenPower(2000)}
            className={`p-6 rounded-3xl border flex flex-col items-center justify-center gap-4 transition-all ${stolenAmount === 2000 ? "bg-red-900/40 border-red-500 text-red-400" : "bg-black/40 border-slate-800 text-slate-500 hover:border-slate-600"}`}
          >
            <Flame size={32} />
            <span className="font-bold">Bếp từ (2000W)</span>
          </button>
          <button
            onClick={() => setStolenPower(3500)}
            className={`p-6 rounded-3xl border flex flex-col items-center justify-center gap-4 transition-all ${stolenAmount === 3500 ? "bg-red-900/40 border-red-500 text-red-400" : "bg-black/40 border-slate-800 text-slate-500 hover:border-slate-600"}`}
          >
            <Zap size={32} />
            <span className="font-bold">Máy hàn (3500W)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
