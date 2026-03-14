"use client";

import { Provider } from "react-redux";
import { useEffect, useRef } from "react";
import { store } from "./store";
import Cookies from "js-cookie";
import { fetchCurrentUser, hydrateAccessToken } from "./slices/auth.slice";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) {
      return;
    }

    hasFetched.current = true;

    const state = store.getState().auth;
    const tokenFromCookie = Cookies.get("accessToken") || null;

    store.dispatch(hydrateAccessToken(tokenFromCookie));

    if (tokenFromCookie && !state.user && !state.loading) {
      store.dispatch(fetchCurrentUser());
    }
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