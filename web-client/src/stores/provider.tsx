"use client";

import { Provider } from "react-redux";
import { useEffect, useRef } from "react";
import { store } from "./store";
import { fetchCurrentUser } from "./slices/auth.slice";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) {
      return;
    }

    hasFetched.current = true;
    store.dispatch(fetchCurrentUser());
  }, []);

  return <>{children}</>;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}