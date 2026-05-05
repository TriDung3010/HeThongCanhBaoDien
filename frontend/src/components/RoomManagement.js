import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, update, get } from "firebase/database";
import { Power, Plus, Trash2, Edit2, Zap } from "lucide-react";

export default function RoomManagement({ roomUID }) {
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState({ name: "", power: "" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!roomUID) return;

    // SỬA LỖI ĐỔI TAB: Đọc dữ liệu từ Firebase 1 lần khi mở trang để giữ nguyên trạng thái
    get(ref(db, `phongtro/${roomUID}/deviceList`)).then((snapshot) => {
      if (snapshot.exists()) {
        setDevices(snapshot.val());
      } else {
        // Nếu phòng mới tinh chưa có gì, tạo vài thiết bị mẫu
        const defaultDevices = [
          { id: 1, name: "Máy lạnh (Cố định)", power: 1200, isOn: false },
          { id: 2, name: "Tủ lạnh (Cố định)", power: 150, isOn: true },
          { id: 3, name: "Quạt máy", power: 50, isOn: false },
        ];
        setDevices(defaultDevices);
      }
    });
  }, [roomUID]);

  // HÀM ĐỒNG BỘ: Tính toán và lưu mọi thay đổi lên Database ngay lập tức
  const saveToFirebase = (newList) => {
    setDevices(newList); // Cập nhật giao diện

    // Tính tổng công suất các thiết bị ĐANG BẬT
    const totalLegitimatePower = newList
      .filter((d) => d.isOn)
      .reduce((sum, d) => sum + d.power, 0);

    // Lưu vào Firebase
    update(ref(db, `phongtro/${roomUID}`), {
      currentPower: totalLegitimatePower, // Dòng điện tổng thực tế phòng đang dùng
      totalDevicePower: totalLegitimatePower, // Cột mốc hợp pháp để so sánh chống trộm
      deviceList: newList,
    }).catch((err) => console.log("Lỗi cập nhật thiết bị:", err));
  };

  const toggleDevice = (id) => {
    const newList = devices.map((d) =>
      d.id === id ? { ...d, isOn: !d.isOn } : d,
    );
    saveToFirebase(newList);
  };

  const deleteDevice = (id) => {
    const newList = devices.filter((d) => d.id !== id);
    saveToFirebase(newList);
  };

  const updatePower = (id, newPower) => {
    const newList = devices.map((d) =>
      d.id === id ? { ...d, power: parseInt(newPower) || 0 } : d,
    );
    saveToFirebase(newList);
    setEditingId(null);
  };

  const addDevice = () => {
    if (!newDevice.name || !newDevice.power)
      return alert("Vui lòng nhập đủ thông tin!");
    const newList = [
      ...devices,
      {
        id: Date.now(),
        name: newDevice.name,
        power: parseInt(newDevice.power),
        isOn: false,
      },
    ];
    saveToFirebase(newList);
    setNewDevice({ name: "", power: "" });
  };

  const currentTotalPower = devices
    .filter((d) => d.isOn)
    .reduce((sum, d) => sum + d.power, 0);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm mb-10 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <Zap className="text-blue-600" size={28} /> Quản lý thiết bị phòng
          </h2>
          <p className="text-slate-400 mt-2 text-xs font-bold uppercase tracking-widest">
            Tổng công suất hợp pháp:{" "}
            <span className="text-blue-600 text-lg">{currentTotalPower} W</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm mb-10">
        <div className="space-y-4">
          {devices.map((dev) => (
            <div
              key={dev.id}
              className={`flex items-center justify-between p-6 rounded-3xl border transition-all duration-300 ${dev.isOn ? "bg-blue-50/50 border-blue-200" : "bg-slate-50 border-slate-100"}`}
            >
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-lg">{dev.name}</h4>
                <div className="flex items-center gap-3 mt-1">
                  {editingId === dev.id ? (
                    <input
                      type="number"
                      defaultValue={dev.power}
                      onBlur={(e) => updatePower(dev.id, e.target.value)}
                      autoFocus
                      className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-1 text-sm outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-blue-600 font-black">{dev.power} W</p>
                  )}
                  {/* Đã xóa hoàn toàn khái niệm nhánh ở giao diện */}
                  <span className="text-[10px] bg-slate-200 px-3 py-1 rounded-full text-slate-600 font-bold uppercase">
                    Thiết bị phòng
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={() => setEditingId(dev.id)}
                  className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => deleteDevice(dev.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>

                <button
                  onClick={() => toggleDevice(dev.id)}
                  className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none ${dev.isOn ? "bg-blue-600 shadow-lg shadow-blue-200" : "bg-slate-300"}`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform duration-300 flex items-center justify-center shadow-md ${dev.isOn ? "translate-x-9" : "translate-x-1"}`}
                  >
                    <Power
                      size={14}
                      className={dev.isOn ? "text-blue-600" : "text-slate-400"}
                    />
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm flex gap-4 items-center">
        <input
          type="text"
          placeholder="Tên thiết bị mới..."
          value={newDevice.name}
          onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
        />
        <input
          type="number"
          placeholder="Công suất (W)"
          value={newDevice.power}
          onChange={(e) =>
            setNewDevice({ ...newDevice, power: e.target.value })
          }
          className="w-48 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
        />
        {/* Đã gỡ bỏ thẻ <select> chọn nhánh */}
        <button
          onClick={addDevice}
          className="bg-slate-900 hover:bg-blue-600 text-white rounded-2xl px-8 py-4 font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-all shadow-xl"
        >
          <Plus size={18} /> Thêm vào phòng
        </button>
      </div>
    </div>
  );
}
