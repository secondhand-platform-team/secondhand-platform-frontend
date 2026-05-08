import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/stores/provider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import NextTopLoader from "nextjs-toploader";
// import GoogleAuthProviderWrapper from "@/components/auth/GoogleAuthProvider";
// import AntdConfigProvider from "@/components/common/AntdConfigProvider";
// import AuthTokenSync from "@/components/auth/AuthTokenSync";
// import { ChatSocketProvider } from "@/contexts/ChatSocketContext";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "ReLife",
  icons: {
    icon: [
      { url: "/logo/icon-logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/icon-logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/logo/icon-logo.png",
    shortcut: "/logo/icon-logo.png",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable}`} suppressHydrationWarning>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#10b981",
                borderRadius: 12,
              },
            }}
          >
            <App>
              <NextTopLoader
                color="#22c55e"
                showSpinner={false}
                height={3}
                crawlSpeed={200}
                speed={200}
                easing="ease"
                shadow="0 0 10px #22c55e,0 0 5px #22c55e"
              />
              <ReduxProvider>
                {children}
              </ReduxProvider>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}