"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Divider,
  Input,
  Modal,
  Typography,
  message,
  ConfigProvider,
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
} from "@/stores/slices/auth.slice";
import { FaFacebookF } from "react-icons/fa";

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

  const [mode, setMode] = useState<"login" | "register">("login");

  const [loginForm, setLoginForm] = useState(defaultLogin);
  const [registerForm, setRegisterForm] = useState(defaultRegister);

  const [formError, setFormError] = useState<string | null>(null);

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (open) {
      dispatch(clearAuthError());
      setFormError(null);
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (open && isAuth) onClose();
  }, [isAuth, open, onClose]);

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
      const res = await dispatch(registerUser(registerForm)).unwrap();

      messageApi.success(res.message || "Đăng ký thành công!");
      setMode("login");
    } catch {}
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#10b981",
          borderRadius: 12,
        },
      }}
    >
      {contextHolder}

      <Modal
        open={open}
        footer={null}
        onCancel={closeModal}
        destroyOnClose
        centered
        width={820}
        className="!rounded-2xl overflow-hidden"
        styles={{
          body: { padding: 0 },
        }}
      >
        <div className="flex flex-col md:flex-row min-h-[520px]">

          {/* LEFT PANEL */}

          <div className="hidden md:flex md:w-[45%] bg-[#052c24] text-white p-10 relative items-center">

            <div className="absolute top-[-20%] left-[-20%] w-72 h-72 bg-emerald-500/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-20%] w-72 h-72 bg-emerald-700/30 rounded-full blur-[120px]" />

            <div className="relative z-10">

              <img
                src="/logo/icon-logo.png"
                className="w-14 mb-6 brightness-0 invert"
              />

              <Typography.Title
                level={2}
                className="!text-white !font-black !text-3xl !mb-4"
              >
                Mua sắm xanh
                <br />
                <span className="text-emerald-400 italic">bắt đầu từ bạn</span>
              </Typography.Title>

              <Typography.Paragraph className="text-emerald-100/80 text-base mb-8">
                Mỗi món đồ cũ được tái sử dụng là một bước nhỏ
                giúp hành tinh xanh hơn.
              </Typography.Paragraph>

              <div className="flex items-center gap-4">

                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-emerald-900 overflow-hidden"
                    >
                      <img src={`https://i.pravatar.cc/150?u=${i}`} />
                    </div>
                  ))}
                </div>

                <span className="text-sm text-emerald-200">
                  +1.2k người vừa tham gia
                </span>
              </div>
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
                    : "Tạo tài khoản"}
                </Typography.Title>

                <Typography.Text className="text-slate-400">
                  {mode === "login"
                    ? "Đăng nhập để tiếp tục"
                    : "Tham gia cộng đồng mua sắm bền vững"}
                </Typography.Text>
              </div>

              {/* SWITCH */}

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

              <AnimatePresence mode="wait">

                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                >

                  {(formError || error) && (
                    <Alert
                      message={formError || error}
                      type="error"
                      showIcon
                      className="mb-4 rounded-xl"
                    />
                  )}

                  <form
                    onSubmit={mode === "login" ? handleLogin : handleRegister}
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
                      placeholder="Email"
                      prefix={<MailOutlined />}
                      value={
                        mode === "login"
                          ? loginForm.email
                          : registerForm.email
                      }
                      onChange={(e) =>
                        mode === "login"
                          ? setLoginForm({
                              ...loginForm,
                              email: e.target.value,
                            })
                          : setRegisterForm({
                              ...registerForm,
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

                    <Divider plain>Hoặc</Divider>

                    {/* SOCIAL */}

                    <div className="flex gap-3">

                      <Button
                        className="flex-1 h-11 !rounded-xl flex items-center justify-center gap-2 border border-slate-200 bg-white"
                      >
                        <img
                          src="https://www.svgrepo.com/show/475656/google-color.svg"
                          className="w-5"
                        />
                        Google
                      </Button>
                      <Button
                        className="flex-1 h-11 !rounded-xl flex items-center justify-center gap-2 
                        !border-none !text-white !bg-[#1877F2] hover:!bg-[#166fe5]"
                      >
                        <FaFacebookF size={16} />
                        Facebook
                      </Button>

                    </div>

                  </form>
                </motion.div>

              </AnimatePresence>

            </div>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
}