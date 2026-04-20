import { useEffect, useState } from "react";
import {
  App,
  Card,
  Row,
  Col,
  Avatar,
  Image,
  Typography,
  Descriptions,
  Button,
  Form,
  Input,
  DatePicker,
  Select,
  Divider,
  Space,
  Tag,
  Switch,
  Upload,
  Spin,
  Radio
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  MailOutlined,
  CameraOutlined,
  EyeOutlined,
  SunOutlined,
  MoonOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { RcFile } from "antd/es/upload";
import { useAppSelector, useAppDispatch } from "../../stores/hooks";
import {
  fetchProfile,
  updateProfile,
  updateAvatar,
} from "../../stores/slices/auth.slice";
import { useThemeToggle } from "../../hooks/useThemeToggle";
import AvatarCropModal from "../../components/AvatarCropModal";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const ProfilePage = () => {
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const { user, profile, loading } = useAppSelector((s) => s.auth);
  const themeMode = useAppSelector((s) => s.theme.mode);
  const toggleTheme = useThemeToggle();
  const [editing, setEditing] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [editingGender, setEditingGender] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Only populate form values when the edit form is actually open
  useEffect(() => {
    if (editing && profile && user) {
      form.setFieldsValue({
        fullName: profile.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        bio: profile.bio || "",
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth ? dayjs(profile.dateOfBirth) : null,
      });
    }
  }, [editing, profile, user, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        bio: values.bio,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth
          ? (values.dateOfBirth as dayjs.Dayjs).format("YYYY-MM-DD")
          : undefined,
      };
      const result = await dispatch(updateProfile(payload));
      if (updateProfile.fulfilled.match(result)) {
        message.success("Cập nhật thông tin thành công!");
        setEditing(false);
      } else {
        message.error((result.payload as string) || "Cập nhật thất bại");
      }
    } catch {
      // form validation error
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditingGender(false);
    form.resetFields();
  };

  const beforeAvatarUpload = (file: RcFile) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Chỉ chấp nhận file hình ảnh!");
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Ảnh phải nhỏ hơn 5MB!");
      return false;
    }
    // Open crop modal instead of uploading directly
    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setCropModalOpen(true);
    return false; // always prevent default upload
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setCropModalOpen(false);
    URL.revokeObjectURL(cropImageSrc);
    const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
    setAvatarLoading(true);
    const result = await dispatch(updateAvatar(croppedFile));
    setAvatarLoading(false);
    if (updateAvatar.fulfilled.match(result)) {
      message.success("Cập nhật ảnh đại diện thành công!");
    } else {
      message.error((result.payload as string) || "Upload ảnh thất bại");
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc("");
  };

  const genderMap: Record<string, string> = {
    MALE: "Nam",
    FEMALE: "Nữ",
    OTHER: "Khác",
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px" }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        Hồ sơ cá nhân
      </Title>

      <Row gutter={[24, 24]} align="stretch">
        {/* LEFT */}
        <Col xs={24} md={8} style={{ display: "flex" }}>
          <Card style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {/* Avatar: click camera to upload, click eye to preview */}
              <div style={{ position: "relative", marginBottom: 8 }}>
                <Spin spinning={avatarLoading}>
                  {profile?.avatarUrl ? (
                    <Image
                      width={96}
                      height={96}
                      src={profile.avatarUrl}
                      style={{ borderRadius: "50%", objectFit: "cover" }}
                      preview={{
                        visible: previewVisible,
                        onVisibleChange: setPreviewVisible,
                        mask: (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: 11 }}>
                            <EyeOutlined style={{ fontSize: 18 }} />
                            <span>Xem ảnh</span>
                          </div>
                        ),
                      }}
                    />
                  ) : (
                    <Avatar
                      size={96}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: "#059669" }}
                    />
                  )}
                </Spin>
                {/* Camera button for upload */}
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={beforeAvatarUpload}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      background: "#059669",
                      borderRadius: "50%",
                      width: 26,
                      height: 26,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <CameraOutlined style={{ color: "#fff", fontSize: 13 }} />
                  </div>
                </Upload>
              </div>

              {/* <Text type="secondary" style={{ fontSize: 11, marginBottom: 8 }}>
                {profile?.avatarUrl ? "Nhấn vào ảnh để xem lớn · 📷 để thay đổi" : "Nhấn 📷 để tải ảnh lên"}
              </Text> */}

              <Title level={5} style={{ marginBottom: 4 }}>
                {profile?.fullName || "Admin"}
              </Title>

              <Text type="secondary" style={{ fontSize: 13 }}>
                {user?.email}
              </Text>

              <Space style={{ marginTop: 12 }}>
                <Tag color="green">
                  {user?.role === "ADMIN" ? "QUẢN TRỊ VIÊN" : user?.role}
                </Tag>
                <Tag color={user?.status ? "cyan" : "red"}>
                  {user?.status ? "Hoạt động" : "Vô hiệu"}
                </Tag>
              </Space>

              {profile?.bio && (
                <Paragraph
                  type="secondary"
                  style={{ marginTop: 12, fontStyle: "italic", fontSize: 13 }}
                >
                  "{profile.bio}"
                </Paragraph>
              )}
            </div>

            <Divider />

            {/* Theme */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Space>
                {themeMode === "dark" ? <MoonOutlined /> : <SunOutlined />}
                <Text>Chế độ {themeMode === "dark" ? "tối" : "sáng"}</Text>
              </Space>
              <Switch checked={themeMode === "dark"} onChange={toggleTheme} />
            </div>
          </Card>
        </Col>

        {/* RIGHT */}
        <Col xs={24} md={16} style={{ display: "flex", flexDirection: "column" }}>
          {/* INFO */}
          <Card
            title="Thông tin chi tiết"
            style={{ flex: 1 }}
            extra={
              !editing ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                >
                  Chỉnh sửa
                </Button>
              ) : (
                <Space>
                  <Button icon={<CloseOutlined />} onClick={handleCancelEdit}>
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={loading}
                    onClick={handleSave}
                  >
                    Lưu
                  </Button>
                </Space>
              )
            }
          >
            {!editing ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Họ tên">
                  {profile?.fullName || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {user?.email || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="SĐT">
                  {user?.phoneNumber || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày sinh">
                  {profile?.dateOfBirth
                    ? dayjs(profile.dateOfBirth).format("DD/MM/YYYY")
                    : "Chưa cập nhật"}
                </Descriptions.Item>
                <Descriptions.Item label="Giới tính">
                  {profile?.gender
                    ? genderMap[profile.gender] || profile.gender
                    : "Chưa cập nhật"}
                </Descriptions.Item>
                {/* <Descriptions.Item label="Giới thiệu">
                  {profile?.bio || "Chưa cập nhật"}
                </Descriptions.Item> */}
              </Descriptions>
            ) : (
              <Form form={form} layout="vertical">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="fullName" label="Họ tên">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="email" label="Email">
                      <Input disabled prefix={<MailOutlined />} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="phoneNumber" label="Số điện thoại">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="dateOfBirth" label="Ngày sinh">
                      <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="gender" label="Giới tính">
                  <Radio.Group>
                    <Radio value="MALE">Nam</Radio>
                    <Radio value="FEMALE">Nữ</Radio>
                    <Radio value="OTHER">Khác</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item name="bio" label="Giới thiệu bản thân">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Form>
            )}
          </Card>

          {/* ACCOUNT */}
          <Card title="Thông tin tài khoản" style={{ marginTop: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Vai trò">
                <Tag color="green">
                  {user?.role === "ADMIN" ? "QUẢN TRỊ VIÊN" : user?.role}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={user?.status ? "cyan" : "red"}>
                  {user?.status ? "Hoạt động" : "Vô hiệu"}
                </Tag>
              </Descriptions.Item>
              {/* <Descriptions.Item label="Lượt đăng miễn phí còn lại">
                {user?.freeSellUse ?? 0}
              </Descriptions.Item> */}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Avatar crop modal */}
      {cropImageSrc && (
        <AvatarCropModal
          open={cropModalOpen}
          imageSrc={cropImageSrc}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
};

export default ProfilePage;