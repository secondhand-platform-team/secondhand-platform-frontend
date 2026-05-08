"use client";

import { Empty } from "antd";

export default function CustomersPage() {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[400px] flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-2 self-start w-full border-b border-slate-100 pb-4">Quản lý khách hàng</h2>
      <div className="flex-1 flex items-center justify-center w-full mt-8">
        <Empty 
          description={<span className="text-slate-500">Chưa có dữ liệu khách hàng</span>} 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    </div>
  );
}
