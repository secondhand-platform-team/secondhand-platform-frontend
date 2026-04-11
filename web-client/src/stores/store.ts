import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth.slice";
import chatReducer from "./slices/chat.slice";
import categoryReducer from "./slices/category.slide";
import itemReducer from "./slices/item.slice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      chat: chatReducer,
      category: categoryReducer,
      item: itemReducer,
    },
  });
};
export const store = makeStore();

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
