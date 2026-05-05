import React from "react";

export default function BillingHistory({
  billHistory,
  isAdmin,
  handleDeleteBill,
}) {
  return (
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
                <td className="p-8 font-bold text-slate-500">{bill.kwh}</td>
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
  );
}
