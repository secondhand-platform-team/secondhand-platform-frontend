import "./App.css";
import { Outlet } from "react-router-dom";
import { store } from "./stores/store";
import { Provider } from "react-redux";
import ThemeProvider from "./components/ThemeProvider";

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Outlet />
      </ThemeProvider>
    </Provider>
  );
}

export default App;