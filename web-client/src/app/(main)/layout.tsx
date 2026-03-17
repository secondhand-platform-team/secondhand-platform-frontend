"use client";

import AuthModal from "@/components/auth/AuthModal";
import Header from "@/components/layout/Header";
import { useAppSelector } from "@/stores/hooks";
import React, { useState } from "react";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuth, user } = useAppSelector((state) => state.auth);
    const [authOpen, setAuthOpen] = useState(false);
  

  return (
    <div className="min-h-screen flex flex-col">
      <Header
              isAuth={isAuth}
              user={user}
              onOpenAuth={() => setAuthOpen(true)}
            />
      <main className="flex-1">
        {children}
      </main>
      {authOpen ? (
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      ) : null}
    </div>
  );
};

export default MainLayout;