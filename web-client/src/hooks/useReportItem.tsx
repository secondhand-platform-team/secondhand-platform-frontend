"use client";

import { useState } from "react";

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

  return {
    open,
    itemId,
    openReportModal,
    closeReportModal,
  };
}
