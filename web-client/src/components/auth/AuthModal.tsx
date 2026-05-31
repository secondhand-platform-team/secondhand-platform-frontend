"use client";

import { useEffect, useState, useRef } from "react";
import {
  Alert,
  Dropdown,
  Button,
  Divider,
  Input,
  Modal,
  Typography,
  message,
  ConfigProvider,
  App,
} from "antd";
import {
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  clearAuthError,
  loginUser,
  registerUser,
  loginWithGoogle,
  userService,
} from "@/stores/slices/auth.slice";
import { FaFacebookF } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { GoogleLogin } from "@react-oauth/google";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

const defaultLogin = {
  email: "",
  password: "",
};

const defaultRegister = {
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const dispatch = useAppDispatch();
  const { loading, error, isAuth } = useAppSelector((s) => s.auth);

  const [mode, setMode] = useState<"login" | "register" | "forgot_password">("login");

  // Forgot password sub-steps: "email" -> "otp"
  const [forgotStep, setForgotStep] = useState<"email" | "otp">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Countdown timer for OTP
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const [loginForm, setLoginForm] = useState(defaultLogin);
  const [registerForm, setRegisterForm] = useState(defaultRegister);

  const [formError, setFormError] = useState<string | null>(null);

  const { message: messageApi } = App.useApp();

  // OTP input refs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (formError) {
      messageApi.error(formError);
      setFormError(null);
    }
  }, [formError, messageApi]);

  useEffect(() => {
    if (error) {
      messageApi.error(error);
      dispatch(clearAuthError());
    }
  }, [error, messageApi, dispatch]);

  useEffect(() => {
    if (open) {
      dispatch(clearAuthError());
      setFormError(null);
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (open && isAuth) {
      messageApi.success("Đăng nhập thành công!");
      onClose();
    }
  }, [isAuth, open, onClose, messageApi]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetForgotState = () => {
    setForgotStep("email");
    setForgotEmail("");
    setOtpValues(["", "", "", "", "", ""]);
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotLoading(false);
    setCountdown(0);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const closeModal = () => {
    setFormError(null);
    dispatch(clearAuthError());
    resetForgotState();
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginForm.email || !loginForm.password) {
      setFormError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      await dispatch(loginUser(loginForm)).unwrap();
    } catch { }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      setFormError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      await dispatch(registerUser(registerForm)).unwrap();

      messageApi.success("Đăng ký thành công!");
      setMode("login");
    } catch { }
  };

  const handleGoogleSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      dispatch(loginWithGoogle(credentialResponse.credential));
    }
  };

  // ── Forgot Password Handlers ──────────────────────────────────────────

  const handleSendOtp = async () => {
    if (!forgotEmail || !forgotEmail.includes("@")) {
      setFormError("Vui lòng nhập email hợp lệ");
      return;
    }

    setForgotLoading(true);
    try {
      await userService.forgotPassword(forgotEmail);
      messageApi.success("Mã OTP đã được gửi đến email của bạn!");
      setForgotStep("otp");
      startCountdown(300); // 5 minutes
    } catch (error: any) {
      messageApi.error(error?.message || "Không thể gửi OTP. Vui lòng thử lại.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setForgotLoading(true);
    try {
      await userService.forgotPassword(forgotEmail);
      messageApi.success("Mã OTP mới đã được gửi!");
      setOtpValues(["", "", "", "", "", ""]);
      startCountdown(300);
    } catch (error: any) {
      messageApi.error(error?.message || "Không thể gửi lại OTP.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const otp = otpValues.join("");
    if (otp.length !== 6) {
      setFormError("Vui lòng nhập đầy đủ mã OTP 6 chữ số");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setFormError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setFormError("Mật khẩu xác nhận không khớp");
      return;
    }

    setForgotLoading(true);
    try {
      await userService.resetPassword({
        email: forgotEmail,
        otp,
        newPassword,
      });
      messageApi.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
      resetForgotState();
      setMode("login");
    } catch (error: any) {
      messageApi.error(error?.message || "Đặt lại mật khẩu thất bại.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newOtp = [...otpValues];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtpValues(newOtp);
      const nextIndex = Math.min(pastedData.length, 5);
      otpRefs.current[nextIndex]?.focus();
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ── Render ─────────────────────────────────────────────────────────────

  const renderForgotPasswordContent = () => {
    if (forgotStep === "email") {
      return (
        <div className="space-y-4">
          <Input
            size="large"
            placeholder="Nhập email đã đăng ký"
            prefix={<MailOutlined />}
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            className="!rounded-xl h-11"
            onPressEnter={handleSendOtp}
          />

          <Button
            type="primary"
            size="large"
            block
            loading={forgotLoading}
            icon={<ArrowRightOutlined />}
            onClick={handleSendOtp}
            className="h-12 !rounded-xl font-bold mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 border-none"
          >
            Gửi mã OTP
          </Button>

          <div className="text-center mt-4">
            <span
              className="text-sm text-slate-500 font-semibold cursor-pointer hover:text-emerald-600 hover:underline transition"
              onClick={() => {
                resetForgotState();
                setMode("login");
              }}
            >
              <ArrowLeftOutlined className="mr-1" />
              Quay lại đăng nhập
            </span>
          </div>
        </div>
      );
    }

    // OTP step
    return (
      <div className="space-y-5">
        {/* OTP sent indicator */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-emerald-700 text-sm font-medium mb-0">
            📧 Mã OTP đã gửi đến <strong>{forgotEmail}</strong>
          </p>
          {countdown > 0 && (
            <p className="text-emerald-500 text-xs mt-1 mb-0">
              ⏱ Mã có hiệu lực trong <strong>{formatCountdown(countdown)}</strong>
            </p>
          )}
        </div>

        {/* OTP Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Mã OTP</label>
          <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
            {otpValues.map((val, idx) => (
              <input
                key={idx}
                ref={(el) => { otpRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={val}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                className="w-12 h-14 text-center text-xl font-bold border-2 border-slate-200 rounded-xl
                  focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none
                  transition-all bg-white hover:border-slate-300"
              />
            ))}
          </div>
        </div>

        {/* New Password */}
        <div>
          <Input.Password
            size="large"
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            prefix={<LockOutlined />}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="!rounded-xl h-11"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <Input.Password
            size="large"
            placeholder="Xác nhận mật khẩu mới"
            prefix={<LockOutlined />}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="!rounded-xl h-11"
          />
        </div>

        {/* Submit */}
        <Button
          type="primary"
          size="large"
          block
          loading={forgotLoading}
          icon={<SafetyCertificateOutlined />}
          onClick={handleResetPassword}
          className="h-12 !rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 border-none"
        >
          Đặt lại mật khẩu
        </Button>

        {/* Resend & Back */}
        <div className="flex items-center justify-between mt-2">
          <span
            className="text-sm text-slate-500 font-semibold cursor-pointer hover:text-emerald-600 hover:underline transition"
            onClick={() => {
              resetForgotState();
              setMode("login");
            }}
          >
            <ArrowLeftOutlined className="mr-1" />
            Đăng nhập
          </span>

          {countdown === 0 ? (
            <span
              className="text-sm text-emerald-600 font-semibold cursor-pointer hover:underline transition"
              onClick={handleResendOtp}
            >
              Gửi lại OTP
            </span>
          ) : (
            <span className="text-sm text-slate-400">
              Gửi lại sau {formatCountdown(countdown)}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Removed local ConfigProvider and contextHolder as they are now provided by App wrapper in RootLayout */}
      <Modal
        open={open}
        footer={null}
        onCancel={closeModal}
        destroyOnHidden
        centered
        width={820}
        className="!rounded-2xl overflow-hidden"
        styles={{
          body: { padding: 0 },
        }}
      >
        <div className="flex flex-col md:flex-row min-h-[520px]">

          {/* LEFT PANEL */}
          <div className="hidden md:flex md:w-1/2 relative 
bg-gradient-to-br from-primary/70 via-primary/20 to-white 
items-center justify-center p-12 overflow-hidden">

            {/* Background blur blobs */}
            <div className="absolute inset-0 z-0 opacity-70">
              <div className="absolute top-0 left-0 w-80 h-80 bg-primary rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-primary rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center">
              <div className="mb-8 flex justify-center">
                <div
                  className="w-full max-w-md aspect-[4/5] rounded-2xl bg-center bg-cover shadow-2xl"
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
                Mua bán đồ cũ không chỉ tiết kiệm mà còn góp phần bảo vệ môi trường.
              </p>
            </div>
          </div>

          {/* RIGHT PANEL */}

          <div className="w-full md:w-[55%] bg-slate-50 dark:bg-slate-950 p-8 md:p-10 flex flex-col justify-center">

            <div className="max-w-[380px] mx-auto w-full">

              {/* HEADER */}

              <div className="mb-8">

                <Typography.Title
                  level={3}
                  className="!font-black !mb-1 dark:!text-white"
                >
                  {mode === "login"
                    ? "Chào mừng quay lại"
                    : mode === "register"
                      ? "Tạo tài khoản"
                      : "Khôi phục mật khẩu"}
                </Typography.Title>

                <Typography.Text className="text-slate-400">
                  {mode === "login"
                    ? "Đăng nhập để tiếp tục"
                    : mode === "register"
                      ? "Tham gia cộng đồng mua sắm bền vững"
                      : forgotStep === "email"
                        ? "Nhập email để nhận mã OTP đặt lại mật khẩu"
                        : "Nhập mã OTP và mật khẩu mới"}
                </Typography.Text>
              </div>

              {/* SWITCH */}

              {mode !== "forgot_password" && (
                <div className="bg-slate-200/60 dark:bg-slate-800 rounded-xl p-1 flex mb-6">

                  <button
                    onClick={() => setMode("login")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === "login"
                      ? "bg-white dark:bg-slate-700 shadow text-emerald-600"
                      : "text-slate-500"
                      }`}
                  >
                    Đăng nhập
                  </button>

                  <button
                    onClick={() => setMode("register")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === "register"
                      ? "bg-white dark:bg-slate-700 shadow text-emerald-600"
                      : "text-slate-500"
                      }`}
                  >
                    Đăng ký
                  </button>
                </div>
              )}

              <AnimatePresence mode="wait">

                <motion.div
                  key={mode + (mode === "forgot_password" ? forgotStep : "")}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                >

                  {mode === "forgot_password" ? (
                    renderForgotPasswordContent()
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (mode === "login") handleLogin(e);
                        else if (mode === "register") handleRegister(e);
                      }}
                      className="space-y-4"
                    >

                      {mode === "register" && (
                        <Input
                          size="large"
                          placeholder="Họ và tên"
                          prefix={<UserOutlined />}
                          value={registerForm.fullName}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              fullName: e.target.value,
                            })
                          }
                          className="!rounded-xl h-11"
                        />
                      )}

                      <Input
                        size="large"
                        placeholder={mode === "register" ? "Email" : "Email hoặc Số điện thoại"}
                        prefix={mode === "register" ? <MailOutlined /> : <UserOutlined />}
                        value={
                          mode === "register"
                            ? registerForm.email
                            : loginForm.email
                        }
                        onChange={(e) =>
                          mode === "register"
                            ? setRegisterForm({
                              ...registerForm,
                              email: e.target.value,
                            })
                            : setLoginForm({
                              ...loginForm,
                              email: e.target.value,
                            })
                        }
                        className="!rounded-xl h-11"
                      />

                      {mode === "register" && (
                        <Input
                          size="large"
                          placeholder="Số điện thoại"
                          prefix={<PhoneOutlined />}
                          value={registerForm.phoneNumber}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              phoneNumber: e.target.value,
                            })
                          }
                          className="!rounded-xl h-11"
                        />
                      )}

                      <Input.Password
                        size="large"
                        placeholder="Mật khẩu"
                        prefix={<LockOutlined />}
                        value={
                          mode === "login"
                            ? loginForm.password
                            : registerForm.password
                        }
                        onChange={(e) =>
                          mode === "login"
                            ? setLoginForm({
                              ...loginForm,
                              password: e.target.value,
                            })
                            : setRegisterForm({
                              ...registerForm,
                              password: e.target.value,
                            })
                        }
                        className="!rounded-xl h-11"
                      />

                      {mode === "login" && (
                        <div className="flex justify-end">
                          <span
                            className="text-sm text-emerald-600 font-semibold cursor-pointer hover:underline"
                            onClick={() => {
                              setMode("forgot_password");
                              setForgotStep("email");
                            }}
                          >
                            Quên mật khẩu?
                          </span>
                        </div>
                      )}

                      {mode === "register" && (
                        <Input.Password
                          size="large"
                          placeholder="Xác nhận mật khẩu"
                          prefix={<LockOutlined />}
                          value={registerForm.confirmPassword}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="!rounded-xl h-11"
                        />
                      )}

                      <Button
                        type="primary"
                        size="large"
                        htmlType="submit"
                        block
                        loading={loading}
                        icon={<ArrowRightOutlined />}
                        className="h-12 !rounded-xl font-bold mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 border-none"
                      >
                        {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
                      </Button>

                      <>
                        <Divider plain>Hoặc</Divider>

                        {/* SOCIAL */}

                        <div className="flex gap-3">

                          <div className="flex-1 relative h-11 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                            {/* Hidden GoogleLogin — fills the container so its click area covers the visible button */}
                            <div className="absolute inset-0 opacity-0 z-10 [&_iframe]:!w-full [&_iframe]:!h-full [&>div]:!w-full [&>div]:!h-full">
                              <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => messageApi.error("Đăng nhập Google thất bại")}
                                size="large"
                                width="300"
                              />
                            </div>
                            {/* Visible styled button — pointer-events disabled so clicks pass to GoogleLogin above */}
                            <div className="absolute inset-0 z-0 flex items-center justify-center gap-2
                            border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 
                            text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium
                            pointer-events-none">
                              <FcGoogle size={18} />
                              Google
                            </div>
                          </div>
                          <div className="flex-1 relative h-11 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                            {/* Hidden GoogleLogin — fills the container so its click area covers the visible button */}
                            <div className="absolute inset-0 opacity-0 z-10 [&_iframe]:!w-full [&_iframe]:!h-full [&>div]:!w-full [&>div]:!h-full">
                              {/* <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => messageApi.error("Đăng nhập Google thất bại")}
                                size="large"
                                width="300"
                              /> */}
                            </div>
                            {/* Visible styled button — pointer-events disabled so clicks pass to GoogleLogin above */}
                            <div className="absolute inset-0 z-0 flex items-center justify-center gap-2
                            border border-slate-200 dark:border-slate-600 bg-blue-600 dark:bg-slate-800 
                            text-white dark:text-slate-200 rounded-xl text-sm font-medium
                            pointer-events-none">
                              <FaFacebookF size={18} className="text-white" />
                              Facebook
                            </div>
                          </div>

                        </div>
                      </>

                    </form>
                  )}
                </motion.div>

              </AnimatePresence>

            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}