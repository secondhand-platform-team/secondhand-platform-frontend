/* eslint-disable @next/next/no-img-element */

"use client";

import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import HeroSection from "@/components/home/HeroSection";
import SearchSection from "@/components/home/SearchSection";
import CategorySection from "@/components/home/CategorySection";
import FeaturedProductsSection from "@/components/home/FeaturedProductsSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import Header from "./Header";
import Footer from "./Footer";



export default function MarketplaceHome() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <main className="grow">
        <HeroSection onOpenAuth={() => setAuthOpen(true)} />
        <SearchSection />
        <CategorySection />
        <FeaturedProductsSection />
        <HowItWorksSection />
      </main>

      <Footer />
      
    </div>
  );
}