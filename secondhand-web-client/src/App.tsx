import { Provider } from "react-redux";
import { store } from "@/app/store";
import AppRouter from "@/router/AppRouter";
import "@/styles/global.css";

function App() {
  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
}

export default App;
