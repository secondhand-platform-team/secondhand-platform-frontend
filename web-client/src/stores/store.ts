import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth.slice";
import chatReducer from "./slices/chat.slice";
import itemsReducer from "./slices/items.slice";
import searchReducer from "./slices/search.slice";
import cartReducer from "./slices/cart.slice";
import notificationReducer from "./slices/notification.slice";
import walletReducer from "./slices/wallet.slice";
import reviewReducer from "./slices/review.slice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      chat: chatReducer,
      items: itemsReducer,
      search: searchReducer,
      cart: cartReducer,
      notification: notificationReducer,
      wallet: walletReducer,
      review: reviewReducer,
    },
  });
};
export const store = makeStore();

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
