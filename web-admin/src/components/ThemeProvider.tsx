import type { ReactNode } from "react";
import { App, ConfigProvider, theme as antdTheme } from "antd";
import viVN from "antd/locale/vi_VN";
import { useAppSelector } from "../stores/hooks";

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const themeMode = useAppSelector((state) => state.theme.mode);

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm:
          themeMode === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#059669",
          borderRadius: 8,
          fontFamily: "'Be Vietnam Pro', 'Inter', system-ui, sans-serif",
        },
        components: {
          Layout: {
            siderBg: themeMode === "dark" ? "#141414" : "#ffffff",
            headerBg: themeMode === "dark" ? "#141414" : "#ffffff",
            bodyBg: themeMode === "dark" ? "#0a0a0a" : "#f5f5f5",
          },
          Menu: {
            itemBg: "transparent",
            subMenuItemBg: "transparent",
          },
        },
      }}
    >
      <App>
        <div
          style={{
            minHeight: "100vh",
            background: themeMode === "dark" ? "#0a0a0a" : "#f5f5f5",
            color: themeMode === "dark" ? "#ffffff" : "#000000",
          }}
        >
          {children}
        </div>
      </App>
    </ConfigProvider>
  );
};

export default ThemeProvider;
