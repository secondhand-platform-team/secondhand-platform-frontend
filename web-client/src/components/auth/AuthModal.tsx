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
                    message.success("Đăng nhập thành công!");
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

      message.success("Đăng ký thành công!");
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