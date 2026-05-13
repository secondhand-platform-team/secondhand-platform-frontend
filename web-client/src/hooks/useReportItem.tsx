"use client";

import { useState } from "react";
import ReportItemModal from "@/components/item/ReportItemModal";

export function useReportItem() {
  const [open, setOpen] = useState(false);
  const [itemId, setItemId] = useState<string>("");

  const openReportModal = (id: string) => {
    setItemId(id);
    setOpen(true);
  };

  const closeReportModal = () => {
    setOpen(false);
    setItemId("");
  };

  const ReportModal = () => (
    <ReportItemModal open={open} itemId={itemId} onClose={closeReportModal} />
  );

  return {
    openReportModal,
    closeReportModal,
    ReportModal,
  };
}
