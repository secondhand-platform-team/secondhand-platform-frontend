"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Mail, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { clearAuthError, loginUser, registerUser } from "@/stores/slices/auth.slice";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

const defaultLoginForm = {
  email: "",
  password: "",
};

const defaultRegisterForm = {
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const dispatch = useAppDispatch();
  const { loading, error, isAuth } = useAppSelector((state) => state.auth);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginForm, setLoginForm] = useState(defaultLoginForm);
  const [registerForm, setRegisterForm] = useState(defaultRegisterForm);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(clearAuthError());

    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (open && isAuth) {
      onClose();
    }
  }, [isAuth, onClose, open]);

  const modalTitle = useMemo(
    () => (mode === "login" ? "Đăng nhập để mua bán nhanh hơn" : "Tạo tài khoản để bắt đầu giao dịch"),
    [mode]
  );

  const handleClose = () => {
    setFormError(null);
    dispatch(clearAuthError());
    onClose();
  };

  if (!open) {
    return null;
  }

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!loginForm.email || !loginForm.password) {
      setFormError("Vui lòng nhập email và mật khẩu");
      return;
    }

    try {
      await dispatch(loginUser(loginForm)).unwrap();
    } catch {
      return;
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (registerForm.password !== registerForm.confirmPassword) {
      setFormError("Mật khẩu xác nhận chưa khớp");
      return;
    }

    try {
      await dispatch(registerUser(registerForm)).unwrap();
    } catch {
      return;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="absolute inset-0" onClick={handleClose} />
      <div className="glass-card relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/60 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-emerald-200">
              <ShieldCheck size={16} />
              Xác thực bởi auth-service
            </div>
            <h2 className="font-display max-w-sm text-4xl font-semibold leading-tight">
              Giao diện người mua và người bán cùng hoạt động trong một nơi.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              Đăng nhập bằng email để đồng bộ hồ sơ, lịch sử giao dịch và phiên làm việc trực tiếp với backend hiện tại.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Phiên đăng nhập được lưu bằng</p>
              <p className="mt-2 text-lg font-semibold">js-cookie + Authorization Bearer Token</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-500/20 to-lime-400/10 p-5">
              <p className="text-sm text-emerald-100">Luồng hiện hỗ trợ</p>
              <p className="mt-2 text-lg font-semibold">Đăng ký người dùng, đăng nhập, lấy hồ sơ hiện tại</p>
            </div>
          </div>
        </div>

        <div className="relative bg-white px-6 py-6 sm:px-8 sm:py-8">
          <button
            type="button"
            aria-label="Close auth modal"
            onClick={handleClose}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            <X size={18} />
          </button>

          <div className="max-w-md pr-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-500">TradeHub Access</p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-950">{modalTitle}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {mode === "login"
                ? "Sử dụng tài khoản người dùng đã được tạo trong auth-service."
                : "Đăng ký mới bằng đúng schema backend: fullName, email, phoneNumber, password, confirmPassword."}
            </p>
          </div>

          <div className="mt-6 inline-flex rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setFormError(null);
                dispatch(clearAuthError());
              }}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                mode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setFormError(null);
                dispatch(clearAuthError());
              }}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                mode === "register" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
              }`}
            >
              Đăng ký
            </button>
          </div>

          {mode === "login" ? (
            <form className="mt-8 space-y-4" onSubmit={handleLogin}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-emerald-500">
                  <Mail size={18} className="text-slate-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="you@example.com"
                    className="w-full border-none bg-transparent text-sm text-slate-950 outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Mật khẩu</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-emerald-500">
                  <ShieldCheck size={18} className="text-slate-400" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Nhập mật khẩu"
                    className="w-full border-none bg-transparent text-sm text-slate-950 outline-none"
                  />
                </div>
              </label>

              {(formError || error) && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {formError || error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {loading ? <LoaderCircle className="animate-spin" size={18} /> : null}
                Đăng nhập
              </button>
            </form>
          ) : (
            <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleRegister}>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-600">Họ và tên</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-emerald-500">
                  <UserRound size={18} className="text-slate-400" />
                  <input
                    type="text"
                    autoComplete="name"
                    value={registerForm.fullName}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, fullName: event.target.value }))
                    }
                    placeholder="Nguyen Van A"
                    className="w-full border-none bg-transparent text-sm text-slate-950 outline-none"
                  />
                </div>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-emerald-500">
                  <Mail size={18} className="text-slate-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="you@example.com"
                    className="w-full border-none bg-transparent text-sm text-slate-950 outline-none"
                  />
                </div>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-600">Số điện thoại</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-emerald-500">
                  <Phone size={18} className="text-slate-400" />
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={registerForm.phoneNumber}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, phoneNumber: event.target.value }))
                    }
                    placeholder="0912345678"
                    className="w-full border-none bg-transparent text-sm text-slate-950 outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Mật khẩu</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-emerald-500">
                  <ShieldCheck size={18} className="text-slate-400" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full border-none bg-transparent text-sm text-slate-950 outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Xác nhận mật khẩu</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-emerald-500">
                  <ShieldCheck size={18} className="text-slate-400" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={registerForm.confirmPassword}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, confirmPassword: event.target.value }))
                    }
                    placeholder="Nhập lại mật khẩu"
                    className="w-full border-none bg-transparent text-sm text-slate-950 outline-none"
                  />
                </div>
              </label>

              {(formError || error) && (
                <div className="sm:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {formError || error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="sm:col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? <LoaderCircle className="animate-spin" size={18} /> : null}
                Tạo tài khoản
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}