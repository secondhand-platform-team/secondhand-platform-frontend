import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import type { RootState } from "./rootReducer";

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["auth/login/fulfilled"],
        ignoredActionPaths: ["payload.timestamp"],
        ignoredPaths: ["auth.lastUpdated"],
      },
    }),
  devTools: import.meta.env.DEV,
});

export type AppDispatch = typeof store.dispatch;
export type { RootState };

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["auth/login/fulfilled"],
          ignoredActionPaths: ["payload.timestamp"],
          ignoredPaths: ["auth.lastUpdated"],
        },
      }),
  });
}

export type AppStore = ReturnType<typeof setupStore>;