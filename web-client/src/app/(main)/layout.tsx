"use client";

import AuthModal from "@/components/auth/AuthModal";
import Header from "@/components/layout/Header";
import AIChatbot from "@/components/chatbot/AIChatbot";
import { useAppSelector } from "@/stores/hooks";
import React, { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const MainLayoutInner = ({ children }: { children: React.ReactNode }) => {
  const { isAuth, user } = useAppSelector((state) => state.auth);
  const [authOpen, setAuthOpen] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const shouldOpenAuth = searchParams.get("auth") === "1";
    if (!isAuth && shouldOpenAuth) {
      setAuthOpen(true);
    }
  }, [isAuth, pathname, searchParams]);
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        isAuth={isAuth}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
      />
      <main className="flex-1">{children}</main>
      {authOpen ? (
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      ) : null}
      <AIChatbot />
    </div>
  );
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <MainLayoutInner>{children}</MainLayoutInner>
    </React.Suspense>
  );
}
