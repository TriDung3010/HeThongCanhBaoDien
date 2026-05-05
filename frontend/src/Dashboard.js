import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "./firebase";
import { ref, onValue, update, set, push, remove } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import LineChart from "./components/LineChart";
import SystemStatus from "./components/SystemStatus";
import RoomManagement from "./components/RoomManagement";
import TheftSimulator from "./components/TheftSimulator";

import {
  Zap,
  ShieldAlert,
  Activity,
  AlertTriangle,
  ZapOff,
  Home,
  Plus,
  UserCog,
} from "lucide-react";

export default function Dashboard() {
  const [view, setView] = useState("overview");
  const [data, setData] = useState({ master: 0, totalDevicePower: 0 });
  const [chartData, setChartData] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [roomPath, setRoomPath] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [roomsList, setRoomsList] = useState([]);
  const [activeDevices, setActiveDevices] = useState([]);

  // BỘ NHỚ VĨNH CỬU CHỐNG F5
  const [isStealing, setIsStealing] = useState(
    () => localStorage.getItem("ai_grid_isStealing") === "true",
  );
  const [stolenAmount, setStolenAmount] = useState(
    () => parseInt(localStorage.getItem("ai_grid_stolenAmount")) || 0,
  );

  const [billing, setBilling] = useState({ kwh: 0, cost: 0, budget: 0 });
  const pricePerKwh = 2500;
  const [config, setConfig] = useState({
    threshold: 2000,
    isSecurityOn: false,
  });
  const [isPowerOn, setIsPowerOn] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState("");

  const [newRoomName, setNewRoomName] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentRoomName, setCurrentRoomName] = useState("");
  const [allRoomsData, setAllRoomsData] = useState({});
  const [editingRoom, setEditingRoom] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("ai_grid_isStealing", isStealing);
    localStorage.setItem("ai_grid_stolenAmount", stolenAmount);
  }, [isStealing, stolenAmount]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserEmail(user.email);
        const isAd = user.email === "tridung30102004@gmail.com";
        setIsAdmin(isAd);
        if (isAd) {
          onValue(ref(db, "phongtro"), (snapshot) => {
            const roomsData = snapshot.val();
            if (roomsData) {
              setAllRoomsData(roomsData);
              const list = Object.keys(roomsData).map((uid) => ({
                id: uid,
                name:
                  roomsData[uid].roomName ||
                  `Phòng UID: ${uid.substring(0, 5)}...`,
              }));
              setRoomsList(list);
              setRoomPath((prevPath) => prevPath || `phongtro/${list[0].id}`);
            } else {
              setRoomsList([]);
              setAllRoomsData({});
            }
          });
        } else {
          setRoomPath(`phongtro/${user.uid}`);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!roomPath) return;

    const unsubscribeLive = onValue(ref(db, roomPath), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setCurrentRoomName(val.roomName || "");

        const power = val.currentPower || 0;
        const totalLegitimate = val.totalDevicePower || 0;

        setData({ master: power, totalDevicePower: totalLegitimate });
        setConfig({
          threshold: val.threshold || 2000,
          isSecurityOn: val.isSecurityOn || false,
        });

        if (val.budget !== undefined) {
          setBilling((prev) => ({ ...prev, budget: val.budget }));
        }

        setIsPowerOn(val.isPowerOn !== false);

        if (val.deviceList) {
          setActiveDevices(val.deviceList.filter((d) => d.isOn));
        } else {
          setActiveDevices([]);
        }

        if (isStealing && power === totalLegitimate && stolenAmount > 0) {
          update(ref(db, roomPath), {
            currentPower: totalLegitimate + stolenAmount,
          });
        }
      }
    });

    onValue(ref(db, `${roomPath}/billingHistory`), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.entries(val).map(([id, item]) => ({ id, ...item }));
        setBillHistory(list.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setBillHistory([]); // Xóa rỗng list nếu database không còn hóa đơn
      }
    });

    timerRef.current = setInterval(() => {
      setData((curr) => {
        setBilling((prev) => {
          if (curr.master > 0 && prev.budget > 0 && isPowerOn) {
            const kwhGained = curr.master / 1000 / 3600;
            return {
              ...prev,
              kwh: prev.kwh + kwhGained,
              cost: (prev.kwh + kwhGained) * pricePerKwh,
              budget: Math.max(0, prev.budget - kwhGained * pricePerKwh),
            };
          }
          return prev;
        });

        setChartData((prev) =>
          [
            ...prev,
            {
              time: new Date().toLocaleTimeString("vi-VN"),
              master: curr.master,
              totalBranches: curr.totalDevicePower,
            },
          ].slice(-15),
        );

        return curr;
      });
    }, 1000);

    return () => {
      unsubscribeLive();
      clearInterval(timerRef.current);
    };
  }, [roomPath, isPowerOn, isStealing, stolenAmount]);

  useEffect(() => {
    if (billing.budget <= 0 && isPowerOn && roomPath) {
      update(ref(db, roomPath), { isPowerOn: false });
    }
  }, [billing.budget, isPowerOn, roomPath]);

  // ----- CÁC HÀM XỬ LÝ HÓA ĐƠN -----
  const handleSaveBill = () => {
    if (billing.kwh <= 0.001) return alert("Chưa có dữ liệu tiêu thụ để chốt.");
    const monthId = `month_${new Date().getMonth() + 1}_${new Date().getFullYear()}_${Date.now()}`;
    set(ref(db, `${roomPath}/billingHistory/${monthId}`), {
      month: `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
      kwh: billing.kwh.toFixed(3),
      amount: Math.round(billing.cost).toLocaleString(),
      timestamp: Date.now(),
    }).then(() => {
      alert("Đã chốt hóa đơn thành công!");
      setBilling((prev) => ({ ...prev, kwh: 0, cost: 0 }));
    });
  };

  const handleDeleteBill = (billId) => {
    if (
      window.confirm(
        "Đồng chí có chắc chắn muốn xóa hóa đơn này không? Dữ liệu sẽ không thể khôi phục.",
      )
    ) {
      remove(ref(db, `${roomPath}/billingHistory/${billId}`)).then(() => {
        alert("Đã xóa hóa đơn!");
      });
    }
  };

  // ----- CÁC HÀM QUẢN LÝ KHÁC -----
  const submitTopUp = () => {
    const amount = parseInt(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      return alert("Vui lòng nhập số tiền hợp lệ lớn hơn 0!");
    }

    const newBudget = billing.budget + amount;
    setBilling((prev) => ({ ...prev, budget: newBudget }));
    if (roomPath) {
      update(ref(db, roomPath), { budget: newBudget, isPowerOn: true });
    }
    alert(`Thành công! Đã nạp ${amount.toLocaleString()} VNĐ vào phòng.`);
    setTopUpAmount("");
  };

  const handleAddEmptyRoom = () => {
    if (!newRoomName.trim()) return alert("Vui lòng nhập tên phòng!");
    push(ref(db, "availableRooms"), { name: newRoomName }).then(() => {
      alert(`Đã tạo ${newRoomName} thành công. Khách đã có thể chọn!`);
      setNewRoomName("");
    });
  };

  const handleSaveEditRoom = () => {
    if (!editingRoom.name.trim())
      return alert("Tên phòng không được để trống!");
    update(ref(db, `phongtro/${editingRoom.uid}`), {
      roomName: editingRoom.name,
      budget: Number(editingRoom.budget) || 0,
      isPowerOn: (Number(editingRoom.budget) || 0) > 0 ? true : false,
    }).then(() => {
      alert("Đã cập nhật thông tin phòng thành công!");
      setEditingRoom(null);
    });
  };

  const handleEvictRoom = (uid, roomName) => {
    if (
      window.confirm(
        `Đồng chí có chắc chắn muốn thu hồi ${roomName}? Toàn bộ dữ liệu của khách sẽ bị xóa và phòng sẽ trở thành Phòng Trống.`,
      )
    ) {
      push(ref(db, "availableRooms"), { name: roomName }).then(() => {
        remove(ref(db, `phongtro/${uid}`));
        alert("Đã thu hồi phòng thành công!");
      });
    }
  };

  const leakagePower = Math.max(0, data.master - data.totalDevicePower);

  return (
    <div className="flex bg-[#fdfdfe] h-screen overflow-hidden font-sans text-slate-800 relative">
      <Sidebar isAdmin={isAdmin} setView={setView} currentView={view} />

      {/* MODAL SỬA PHÒNG */}
      {editingRoom && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-6">
              Sửa thông tin phòng
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Tên phòng
                </label>
                <input
                  type="text"
                  value={editingRoom.name}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Ngân sách (VNĐ)
                </label>
                <input
                  type="number"
                  value={editingRoom.budget}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, budget: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex gap-3 mt-8 pt-4">
                <button
                  onClick={() => setEditingRoom(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEditRoom}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-200 transition-colors"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 h-full overflow-y-auto p-10 custom-scrollbar">
        <header className="flex justify-between items-center mb-10 bg-white/70 backdrop-blur-md p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/40">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
              AI <span className="text-blue-600">GRID PRO</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">
              {isAdmin
                ? "Hệ thống Quản trị tòa nhà"
                : "Cổng thông tin khách thuê"}
            </p>
          </div>

          <div className="flex gap-4">
            {isAdmin && view !== "accounts" && (
              <select
                value={roomPath ? roomPath.split("/")[1] : ""}
                onChange={(e) => setRoomPath(`phongtro/${e.target.value}`)}
                className="bg-slate-100 border-none rounded-2xl px-6 py-3 font-bold text-xs text-blue-600 outline-none shadow-sm cursor-pointer"
              >
                {roomsList.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            )}
            {view === "overview" && (
              <button
                onClick={handleSaveBill}
                className="bg-slate-950 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-transform"
              >
                Chốt hóa đơn
              </button>
            )}
          </div>
        </header>

        {/* CÁC TAB HIỂN THỊ */}
        {view === "overview" && (
          <div className="space-y-10 animate-in fade-in duration-700">
            {/* ... Giữ nguyên toàn bộ code overview ... */}
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
                    Số dư tài khoản 0đ. Vui lòng nạp thêm tiền để kích hoạt lại
                    hệ thống điện năng.
                  </p>
                </div>
              </div>
            )}

            {billing.budget > 0 && billing.budget < 10000 && (
              <div className="bg-amber-500 text-white p-6 rounded-[2rem] flex items-center gap-5 shadow-xl shadow-amber-200">
                <AlertTriangle size={28} />
                <div>
                  <h4 className="font-black uppercase text-sm tracking-widest">
                    Cảnh báo sắp hết ngân sách
                  </h4>
                  <p className="text-xs font-medium opacity-90 mt-1">
                    Bạn chỉ còn{" "}
                    <b>{Math.round(billing.budget).toLocaleString()} VNĐ</b>{" "}
                    (tương đương khoảng{" "}
                    <b>{(billing.budget / pricePerKwh).toFixed(2)} kWh</b>). Hãy
                    nạp thêm.
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
                      • Công suất nguồn tổng đo được: <b>{data.master}W</b>.
                    </p>
                    <p>
                      • Tổng công suất thiết bị hợp pháp:{" "}
                      <b>{data.totalDevicePower}W</b>.
                    </p>
                    <p className="text-yellow-200 mt-2">
                      = Phát hiện chênh lệch <b>{leakagePower.toFixed(1)}W</b>{" "}
                      đang rò rỉ!
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
                <div className="mt-2 text-[11px] font-medium bg-white/10 inline-block px-3 py-1 rounded-full border border-white/20">
                  ≈ {(billing.budget / pricePerKwh).toFixed(2)} kWh
                </div>
                <div className="mt-4 w-full bg-blue-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, (billing.budget / 50000) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              <div className="xl:col-span-2 space-y-8">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative">
                  <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Activity size={16} className="text-blue-600" /> Biểu đồ
                      phụ tải (Live)
                    </h3>
                  </div>
                  <LineChart data={chartData} />
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Zap size={16} className="text-blue-500" /> Các thiết bị
                    đang sử dụng
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
                        {leakagePower > 15 && (
                          <span className="bg-red-50/70 text-red-700 px-5 py-3 rounded-2xl text-xs font-black tracking-wide border border-red-200 flex items-center gap-2 shadow-sm animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            [CẢNH BÁO] Nguồn lạ{" "}
                            <span className="opacity-80 font-bold ml-1">
                              ({leakagePower.toFixed(0)}W)
                            </span>
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">
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
                    Trung tâm an ninh & Nạp tiền
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
                        className={`w-14 h-7 rounded-full transition-all duration-300 ${config.isSecurityOn ? "bg-emerald-500 shadow-lg shadow-emerald-100" : "bg-slate-300"} relative`}
                      >
                        <div
                          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${config.isSecurityOn ? "right-1" : "left-1"}`}
                        />
                      </button>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
                        Nạp ngân sách
                      </p>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          placeholder="Số tiền..."
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          className="flex-1 w-2/3 bg-slate-50 border border-slate-200 rounded-[1.5rem] px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                        />
                        <button
                          onClick={submitTopUp}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-[1.5rem] font-black text-[10px] uppercase shadow-sm shadow-blue-200 transition-all whitespace-nowrap"
                        >
                          Nạp
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "rooms" && (
          <RoomManagement roomUID={roomPath ? roomPath.split("/")[1] : null} />
        )}

        {view === "accounts" && (
          <div className="animate-in fade-in duration-700">
            {isAdmin ? (
              <div className="space-y-8">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] flex flex-wrap md:flex-nowrap items-center gap-6 shadow-2xl">
                  <div className="bg-blue-600/20 p-5 rounded-full text-blue-500">
                    <Home size={32} />
                  </div>
                  <div>
                    <h4 className="font-black uppercase text-base tracking-widest text-white">
                      Thêm phòng mới (Phòng trống)
                    </h4>
                    <p className="text-xs font-medium text-slate-400 mt-1">
                      Tạo phòng để khách hàng có thể chọn khi đăng ký tài khoản.
                    </p>
                  </div>
                  <div className="flex-1 flex gap-3 md:ml-auto md:max-w-md">
                    <input
                      type="text"
                      placeholder="Nhập tên phòng..."
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 text-sm font-bold"
                    />
                    <button
                      onClick={handleAddEmptyRoom}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      <Plus size={18} /> Thêm
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-10 overflow-hidden">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="bg-blue-50 p-3 rounded-2xl">
                      <UserCog size={24} className="text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                      Danh sách đang thuê
                    </h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Phòng
                          </th>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            UID Định danh
                          </th>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Ngân sách dư
                          </th>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                            Nguồn điện
                          </th>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {Object.keys(allRoomsData).length > 0 ? (
                          Object.keys(allRoomsData).map((uid) => (
                            <tr
                              key={uid}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="p-6 font-black text-slate-700 uppercase text-xs">
                                {allRoomsData[uid].roomName}
                              </td>
                              <td className="p-6 font-bold text-slate-500 text-[10px]">
                                {uid}
                              </td>
                              <td className="p-6 font-black text-blue-600 text-sm">
                                {Math.round(
                                  allRoomsData[uid].budget || 0,
                                ).toLocaleString()}{" "}
                                <span className="text-[10px]">VNĐ</span>
                              </td>
                              <td className="p-6 text-center">
                                <span
                                  className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border ${allRoomsData[uid].isPowerOn ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}
                                >
                                  {allRoomsData[uid].isPowerOn
                                    ? "Đang Cấp Điện"
                                    : "Bị Cắt Điện"}
                                </span>
                              </td>
                              <td className="p-6 text-center">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() =>
                                      setEditingRoom({
                                        uid: uid,
                                        name: allRoomsData[uid].roomName,
                                        budget: allRoomsData[uid].budget || 0,
                                      })
                                    }
                                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-colors"
                                  >
                                    Sửa
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleEvictRoom(
                                        uid,
                                        allRoomsData[uid].roomName,
                                      )
                                    }
                                    className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-colors"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="p-10 text-center text-slate-400 font-bold italic text-sm"
                            >
                              Chưa có khách thuê nào.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-10 max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-6">
                  <div className="bg-blue-50 p-3 rounded-2xl">
                    <UserCog size={24} className="text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                    Hồ sơ của bạn
                  </h2>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Email đăng nhập
                    </span>
                    <span className="font-black text-slate-800">
                      {currentUserEmail}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Vị trí căn hộ
                    </span>
                    <span className="font-black text-blue-600 uppercase text-lg">
                      {currentRoomName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Mã hợp đồng (UID)
                    </span>
                    <span className="font-bold text-slate-500 text-xs">
                      {roomPath?.split("/")[1]}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === "theft" && (
          <TheftSimulator
            roomUID={roomPath ? roomPath.split("/")[1] : null}
            isStealing={isStealing}
            setIsStealing={setIsStealing}
            stolenAmount={stolenAmount}
            setStolenAmount={setStolenAmount}
            totalDevicePower={data.totalDevicePower}
          />
        )}

        {/* TAB 5: LỊCH SỬ HÓA ĐƠN */}
        {view === "history" && (
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Kỳ hóa đơn
                  </th>
                  <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Tiêu thụ (kWh)
                  </th>
                  <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-blue-600">
                    Thành tiền
                  </th>
                  <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Trạng thái
                  </th>
                  {isAdmin && (
                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {billHistory.length > 0 ? (
                  billHistory.map((bill) => (
                    <tr
                      key={bill.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-8 font-black text-slate-700 uppercase text-xs">
                        {bill.month}
                      </td>
                      <td className="p-8 font-bold text-slate-500">
                        {bill.kwh}
                      </td>
                      <td className="p-8 font-black text-blue-600 text-sm font-italic">
                        {bill.amount} đ
                      </td>
                      <td className="p-8 text-center">
                        <span className="bg-emerald-50 text-emerald-600 px-5 py-2 rounded-full text-[9px] font-black uppercase border border-emerald-100">
                          Đã thanh toán
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-8 text-center">
                          <button
                            onClick={() => handleDeleteBill(bill.id)}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-colors"
                          >
                            Xóa
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isAdmin ? "5" : "4"}
                      className="p-10 text-center text-slate-400 font-bold italic text-sm"
                    >
                      Chưa có hóa đơn nào được chốt trong kỳ này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
