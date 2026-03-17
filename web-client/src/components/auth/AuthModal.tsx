"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LoaderCircle,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  clearAuthError,
  loginUser,
  registerUser,
} from "@/stores/slices/auth.slice";

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
    () =>
      mode === "login"
        ? "Đăng nhập để mua bán nhanh hơn"
        : "Tạo tài khoản để bắt đầu giao dịch",
    [mode],
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm px-4 py-4 overflow-y-auto">
      <div className="absolute inset-0" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-5xl bg-white dark:bg-slate-900 rounded-xl shadow-xl flex flex-col md:flex-row overflow-hidden">
        {" "}
        <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-br from-primary/60 via-white to-primary/40 items-center justify-center p-12">
          {/* Background blur blobs */}
          <div className="absolute inset-0 z-0 opacity-40">
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            <div className="mb-8 flex justify-center">
              <div
                className="w-full max-w-md aspect-square rounded-2xl bg-center bg-cover shadow-2xl"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDe6LGE8hyGq8LiaoJ7_Uv9NkyKx84H3-8eKjXU21u3fkZPM0PonBFnaPIsgtCNzX1O0PnbV8KyVQVt3Rqy8CGzKLRlKMcwHL8KFBXzND6XmXu7OPS1k7cIBaPuRyQj3m7xh_PfFsh8IBRMZM59NKJD5aR_SrpuKGIZwTx1qOXiS8JjPHLJjeu2XwybNEDINmwlHEFl3Ltsay5cFWV2urTW2Vn4Iu_yz5NOZXbJv-qYoRjHAAo_5XLhGVo_cxIh6GI1TDogd0gQdmod')",
                }}
              />
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
              Gia nhập cộng đồng <span className="text-primary">Xanh</span>
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed">
              Mua bán đồ cũ không chỉ tiết kiệm mà còn góp phần bảo vệ môi
              trường. Hàng ngàn món đồ đang chờ chủ nhân mới!
            </p>
          </div>
        </div>
        {/* Right Side - Auth Form */}
        <div className="w-full md:w-1/2 p-6 md:p-10 lg:p-12 flex flex-col justify-start overflow-visible md:overflow-y-auto">
          <button
            type="button"
            aria-label="Close auth modal"
            onClick={handleClose}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <X size={18} />
          </button>

          <div className="mb-10">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              {mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {mode === "login"
                ? "Chào mừng bạn quay trở lại với Chợ Đồ Cũ"
                : "Tạo tài khoản mới để bắt đầu giao dịch"}
            </p>
          </div>

          {/* Mode Toggle */}
          <div style={{width:"60%"}} className="mb-6 inline-flex rounded-full bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setFormError(null);
                dispatch(clearAuthError());
              }}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition cursor-pointer ${
                mode === "login"
                  ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
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
              className={`rounded-full px-5 py-2 text-sm font-semibold transition cursor-pointer ${
                mode === "register"
                  ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Đăng ký
            </button>
          </div>

          {mode === "login" ? (
            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <input
                    type="email"
                    autoComplete="email"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="ten@vidu.com"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Mật khẩu
                  </label>
                  <a
                    className="text-xs text-primary font-medium hover:underline cursor-pointer"
                    href="#"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none cursor-pointer"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    type="button"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer"
                />
                <label
                  className="ml-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                  htmlFor="remember"
                >
                  Ghi nhớ đăng nhập
                </label>
              </div>

              {(formError || error) && (
                <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
                  {formError || error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle className="animate-spin" size={18} />
                    Đang đăng nhập...
                  </span>
                ) : (
                  "Đăng nhập ngay"
                )}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleRegister}>
              {/* Full Name Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Họ và tên
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <input
                    type="text"
                    autoComplete="name"
                    value={registerForm.fullName}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <input
                    type="email"
                    autoComplete="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="ten@vidu.com"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={registerForm.phoneNumber}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        phoneNumber: event.target.value,
                      }))
                    }
                    placeholder="0912345678"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={registerForm.confirmPassword}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    placeholder="Nhập lại mật khẩu"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none cursor-pointer"
                  />
                </div>
              </div>

              {(formError || error) && (
                <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
                  {formError || error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle className="animate-spin" size={18} />
                    Đang tạo tài khoản...
                  </span>
                ) : (
                  "Đăng ký ngay"
                )}
              </button>

              {/* Sign In Link */}
              <div className="text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  Đã có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    Đăng nhập
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Divider */}
          {mode === "login" && (
            <>
              <div className="mt-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm uppercase">
                  <span className="px-3 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
                    Hoặc đăng nhập với
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                {/* Google Button */}
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    ></path>
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    ></path>
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    ></path>
                  </svg>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Google
                  </span>
                </button>

                {/* Facebook Button */}
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                  </svg>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Facebook
                  </span>
                </button>
              </div>

              {/* Sign Up Link */}
              <div className="mt-10 text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  Chưa có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    Đăng ký ngay
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
