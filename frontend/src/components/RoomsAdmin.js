import React, { useState } from "react";
import { db } from "../firebase";
import { ref, update, remove, push } from "firebase/database";
import { Home, Plus } from "lucide-react";

export default function RoomsAdmin({ emptyRoomsList }) {
  const [newRoomName, setNewRoomName] = useState("");
  const [editingEmptyRoom, setEditingEmptyRoom] = useState(null);

  const handleAddEmptyRoom = () => {
    if (!newRoomName.trim()) return alert("Vui lòng nhập tên phòng!");
    push(ref(db, "availableRooms"), { name: newRoomName }).then(() => {
      alert(`Đã tạo phòng ${newRoomName} thành công.`);
      setNewRoomName("");
    });
  };

  const handleSaveEditEmptyRoom = () => {
    if (!editingEmptyRoom.name.trim())
      return alert("Tên phòng không được để trống!");
    update(ref(db, `availableRooms/${editingEmptyRoom.id}`), {
      name: editingEmptyRoom.name,
    }).then(() => {
      alert("Cập nhật tên phòng thành công!");
      setEditingEmptyRoom(null);
    });
  };

  const handleDeleteEmptyRoom = (id) => {
    if (window.confirm("Đồng chí muốn xóa phòng trống này khỏi hệ thống?")) {
      remove(ref(db, `availableRooms/${id}`));
    }
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      {/* MODAL SỬA PHÒNG TRỐNG */}
      {editingEmptyRoom && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-6">
              Sửa thông tin phòng
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Tên phòng mới
                </label>
                <input
                  type="text"
                  value={editingEmptyRoom.name}
                  onChange={(e) =>
                    setEditingEmptyRoom({
                      ...editingEmptyRoom,
                      name: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 mt-8 pt-4">
                <button
                  onClick={() => setEditingEmptyRoom(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black text-[10px] uppercase hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEditEmptyRoom}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase hover:bg-blue-500 shadow-lg"
                >
                  Lưu lại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KHU VỰC THÊM PHÒNG */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] flex flex-wrap md:flex-nowrap items-center gap-6 shadow-2xl">
        <div className="bg-blue-600/20 p-5 rounded-full text-blue-500">
          <Home size={32} />
        </div>
        <div>
          <h4 className="font-black uppercase text-base tracking-widest text-white">
            Thêm phòng mới
          </h4>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Tạo cơ sở dữ liệu phòng trống mới.
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
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2"
          >
            <Plus size={18} /> Thêm
          </button>
        </div>
      </div>

      {/* DANH SÁCH PHÒNG TRỐNG */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-10 overflow-hidden">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-8">
          Danh sách phòng trống
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  ID Hệ thống
                </th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tên phòng
                </th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {emptyRoomsList.length > 0 ? (
                emptyRoomsList.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50/50">
                    <td className="p-6 font-bold text-slate-500 text-[10px]">
                      {room.id}
                    </td>
                    <td className="p-6 font-black text-slate-700 text-xs">
                      {room.name}
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setEditingEmptyRoom(room)}
                          className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteEmptyRoom(room.id)}
                          className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white"
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
                    colSpan="3"
                    className="p-10 text-center text-slate-400 font-bold italic text-sm"
                  >
                    Chưa có phòng trống nào trong hệ thống.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
