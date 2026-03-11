"use client";

import React from "react";
import { usePathname } from "next/navigation";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard");
  const isChat = pathname.startsWith("/chat");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
    </div>
  );
};

export default MainLayout;