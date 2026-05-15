"use client";

import { useEffect, useState } from "react";
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
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  clearAuthError,
  loginUser,
  registerUser,
  loginWithGoogle,
} from "@/stores/slices/auth.slice";
import { FaFacebookF } from "react-icons/fa";
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

  const [loginForm, setLoginForm] = useState(defaultLogin);
  const [registerForm, setRegisterForm] = useState(defaultRegister);

  const [formError, setFormError] = useState<string | null>(null);

  const { message: messageApi } = App.useApp();

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

  const closeModal = () => {
    setFormError(null);
    dispatch(clearAuthError());
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
    } catch {}
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
    } catch {}
  };

  const handleGoogleSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      dispatch(loginWithGoogle(credentialResponse.credential));
    }
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
                    : "Nhập email hoặc số điện thoại để lấy lại mật khẩu"}
                </Typography.Text>
              </div>

              {/* SWITCH */}

              {mode !== "forgot_password" && (
                <div className="bg-slate-200/60 dark:bg-slate-800 rounded-xl p-1 flex mb-6">

                  <button
                    onClick={() => setMode("login")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                      mode === "login"
                        ? "bg-white dark:bg-slate-700 shadow text-emerald-600"
                        : "text-slate-500"
                    }`}
                  >
                    Đăng nhập
                  </button>

                  <button
                    onClick={() => setMode("register")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                      mode === "register"
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
                  key={mode}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                >

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (mode === "login") handleLogin(e);
                      else if (mode === "register") handleRegister(e);
                      else {
                        messageApi.success("Đã gửi hướng dẫn khôi phục mật khẩu đến " + loginForm.email);
                        setMode("login");
                      }
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

                    {mode !== "forgot_password" && (
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
                    )}

                    {mode === "login" && (
                      <div className="flex justify-end">
                        <span
                          className="text-sm text-emerald-600 font-semibold cursor-pointer hover:underline"
                          onClick={() => {
                            setMode("forgot_password");
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
                      {mode === "login" ? "Đăng nhập" : mode === "register" ? "Tạo tài khoản" : "Gửi yêu cầu"}
                    </Button>

                    {mode === "forgot_password" && (
                      <div className="text-center mt-4">
                        <span
                          className="text-sm text-slate-500 font-semibold cursor-pointer hover:text-emerald-600 hover:underline transition"
                          onClick={() => setMode("login")}
                        >
                          Quay lại đăng nhập
                        </span>
                      </div>
                    )}

                    {mode !== "forgot_password" && (
                      <>
                        <Divider plain>Hoặc</Divider>

                        {/* SOCIAL */}

                        <div className="flex gap-3">

                        <div className="flex-1 overflow-hidden">
                          <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => messageApi.error("Đăng nhập Google thất bại")}
                            theme="outline"
                            size="large"
                            width="180"
                          />
                        </div>
                      <Button
                        className="flex-1 h-11 !rounded-xl flex items-center justify-center gap-2 
                        !border-none !text-white !bg-[#1877F2] hover:!bg-[#166fe5]"
                      >
                        <FaFacebookF size={16} />
                        Facebook
                      </Button>

                    </div>
                    </>
                    )}

                  </form>
                </motion.div>

              </AnimatePresence>

            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}