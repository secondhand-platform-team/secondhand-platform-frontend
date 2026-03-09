/**
 * Main Layout
 * Default layout for authenticated pages with navbar and footer
 */

import React, { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar/Navbar";
import Footer from "@/components/layout/Footer/Footer";
import "./MainLayout.css";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="main-layout">
      <Navbar />
      <main className="main-content">
        <div className="main-container">{children}</div>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
