import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  List,
  Button,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
  Table,
  message,
  Popconfirm,
  Badge,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  SettingOutlined,
  TagOutlined,
  ClusterOutlined,
} from "@ant-design/icons";
import http from "../../utils/api";

const { Title, Text, Paragraph } = Typography;

interface Category {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  postingFee: number;
}

interface CategoryAttribute {
  attributeId: string;
  code: string;
  name: string;
  description: string;
  dataType: string;
  unit?: string;
  required: boolean;
  optionsJson?: string;
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Modals visibility
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [attributeModalVisible, setAttributeModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState<CategoryAttribute | null>(null);

  // Attributes states
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  // Forms
  const [categoryForm] = Form.useForm();
  const [attributeForm] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await http.get("/categories", {
        headers: { "X-Service": "core" },
      });
      setCategories(response || []);
    } catch (error: any) {
      message.error(error.message || "Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter root (top level) and children
  const topLevelCategories = categories.filter((c) => !c.parentId);
  
  // Set first root category as selected if none is selected
  useEffect(() => {
    if (topLevelCategories.length > 0 && !selectedParentId) {
      setSelectedParentId(topLevelCategories[0].categoryId);
    }
  }, [categories]);

  const activeParentCategory = categories.find((c) => c.categoryId === selectedParentId) || null;
  const childCategories = categories.filter((c) => c.parentId === selectedParentId);

  const fetchAttributes = async (categoryId: string) => {
    setLoadingAttributes(true);
    try {
      const response = await http.get(`/categories/${categoryId}/attributes`, {
        headers: { "X-Service": "core" },
      });
      setAttributes(response || []);
    } catch (error: any) {
      message.error("Lỗi khi tải thuộc tính danh mục");
    } finally {
      setLoadingAttributes(false);
    }
  };

  // Open Add/Edit Category Modal
  const handleOpenCategoryModal = (cat: Category | null, parentId?: string | null) => {
    setSelectedCategory(cat);
    if (cat) {
      categoryForm.setFieldsValue({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        postingFee: cat.postingFee,
        parentId: cat.parentId || undefined,
      });
    } else {
      categoryForm.resetFields();
      if (parentId) {
        categoryForm.setFieldsValue({ parentId });
      }
    }
    setCategoryModalVisible(true);
  };

  // Handle Category submit
  const handleCategorySubmit = async () => {
    try {
      const values = await categoryForm.validateFields();
      setLoading(true);
      if (selectedCategory) {
        // Edit category
        await http.put(`/categories/${selectedCategory.categoryId}`, values, {
          headers: { "X-Service": "core" },
        });
        message.success("Cập nhật danh mục thành công!");
      } else {
        // Create category
        await http.post("/categories", values, {
          headers: { "X-Service": "core" },
        });
        message.success("Thêm danh mục mới thành công!");
      }
      setCategoryModalVisible(false);
      fetchCategories();
    } catch (error: any) {
      message.error(error.message || "Lỗi khi lưu danh mục");
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await http.delete(`/categories/${categoryId}`, undefined, {
        headers: { "X-Service": "core" },
      });
      message.success("Đã xóa danh mục thành công!");
      if (selectedParentId === categoryId) {
        setSelectedParentId(null);
      }
      fetchCategories();
    } catch (error: any) {
      message.error(error.message || "Lỗi khi xóa danh mục. Danh mục này có thể đang có tin đăng hoạt động.");
    }
  };

  // Manage attributes of a child category
  const [attrCategoryId, setAttrCategoryId] = useState<string | null>(null);
  const handleManageAttributes = (cat: Category) => {
    setAttrCategoryId(cat.categoryId);
    fetchAttributes(cat.categoryId);
  };

  // Open Attribute Form Modal
  const handleOpenAttributeModal = (attr: CategoryAttribute | null) => {
    setSelectedAttribute(attr);
    if (attr) {
      attributeForm.setFieldsValue({
        code: attr.code,
        name: attr.name,
        description: attr.description,
        dataType: attr.dataType,
        unit: attr.unit,
        required: attr.required,
        optionsJson: attr.optionsJson,
      });
    } else {
      attributeForm.resetFields();
    }
    setAttributeModalVisible(true);
  };

  // Handle Attribute submit
  const handleAttributeSubmit = async () => {
    if (!attrCategoryId) return;
    try {
      const values = await attributeForm.validateFields();
      if (selectedAttribute) {
        await http.put(`/categories/${attrCategoryId}/attributes/${selectedAttribute.attributeId}`, values, {
          headers: { "X-Service": "core" },
        });
        message.success("Cập nhật thuộc tính thành công!");
      } else {
        await http.post(`/categories/${attrCategoryId}/attributes`, values, {
          headers: { "X-Service": "core" },
        });
        message.success("Thêm thuộc tính thành công!");
      }
      setAttributeModalVisible(false);
      fetchAttributes(attrCategoryId);
    } catch (error: any) {
      message.error(error.message || "Lỗi khi lưu thuộc tính");
    }
  };

  // Delete Attribute
  const handleDeleteAttribute = async (attrId: string) => {
    if (!attrCategoryId) return;
    try {
      await http.delete(`/categories/${attrCategoryId}/attributes/${attrId}`, undefined, {
        headers: { "X-Service": "core" },
      });
      message.success("Đã xóa thuộc tính!");
      fetchAttributes(attrCategoryId);
    } catch (error: any) {
      message.error("Không thể xóa thuộc tính");
    }
  };

  const attributeColumns = [
    { title: "Mã code", dataIndex: "code", key: "code", render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: "Tên thuộc tính", dataIndex: "name", key: "name", render: (text: string) => <Text strong>{text}</Text> },
    { title: "Kiểu dữ liệu", dataIndex: "dataType", key: "dataType" },
    {
      title: "Bắt buộc",
      dataIndex: "required",
      key: "required",
      render: (req: boolean) => <Badge status={req ? "processing" : "default"} text={req ? "Có" : "Không"} />,
    },
    { title: "Mô tả", dataIndex: "description", key: "description", ellipsis: true },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: CategoryAttribute) => (
        <Space>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleOpenAttributeModal(record)} />
          <Popconfirm title="Xóa thuộc tính này?" onConfirm={() => handleDeleteAttribute(record.attributeId)} okText="Xóa" cancelText="Hủy">
            <Button size="small" type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Title */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: "-0.5px" }}>
            Quản Lý Danh Mục & Thuộc Tính
          </Title>
          <Text type="secondary">
            Cấu trúc danh mục hàng hai cấp chuyên nghiệp và quản lý động các thuộc tính con cho từng nhóm hàng.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenCategoryModal(null, null)}
          style={{ borderRadius: 8, height: 40, fontWeight: 500 }}
        >
          Thêm Danh Mục Gốc
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Side: Parent Categories List */}
        <Col xs={24} md={8}>
          <Card
            title={
              <Space>
                <FolderOpenOutlined style={{ color: "#1890ff" }} />
                <Text strong>Danh mục cha (Root)</Text>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
            bodyStyle={{ padding: 0 }}
          >
            <List
              loading={loading}
              dataSource={topLevelCategories}
              renderItem={(item) => {
                const isActive = item.categoryId === selectedParentId;
                const childCount = categories.filter((c) => c.parentId === item.categoryId).length;
                return (
                  <List.Item
                    onClick={() => {
                      setSelectedParentId(item.categoryId);
                      setAttrCategoryId(null); // Close attribute view
                    }}
                    style={{
                      cursor: "pointer",
                      padding: "16px 20px",
                      background: isActive ? "rgba(24, 144, 255, 0.06)" : "transparent",
                      borderLeft: isActive ? "4px solid #1890ff" : "4px solid transparent",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                      <Space direction="vertical" size={2}>
                        <Text strong style={{ fontSize: 14, color: isActive ? "#1890ff" : "inherit" }}>
                          {item.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {childCount} danh mục con
                        </Text>
                      </Space>
                      <Space onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="small"
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleOpenCategoryModal(item, null)}
                        />
                        <Popconfirm
                          title="Xóa danh mục này sẽ xóa tất cả danh mục con của nó. Xác nhận?"
                          onConfirm={() => handleDeleteCategory(item.categoryId)}
                        >
                          <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        {/* Right Side: Children and Attributes splits */}
        <Col xs={24} md={16}>
          {activeParentCategory ? (
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {/* Children categories */}
              <Card
                title={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Space>
                      <ClusterOutlined style={{ color: "#52c41a" }} />
                      <Text strong>Danh mục con của "{activeParentCategory.name}"</Text>
                    </Space>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => handleOpenCategoryModal(null, activeParentCategory.categoryId)}
                      size="small"
                    >
                      Thêm danh mục con
                    </Button>
                  </div>
                }
                style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
              >
                {childCategories.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: "#8c8c8c" }}>
                    Chưa có danh mục con cho mục này.
                  </div>
                ) : (
                  <List
                    dataSource={childCategories}
                    renderItem={(item) => (
                      <List.Item
                        style={{ padding: "12px 0" }}
                        actions={[
                          <Button
                            size="small"
                            icon={<SettingOutlined />}
                            onClick={() => handleManageAttributes(item)}
                            type={attrCategoryId === item.categoryId ? "primary" : "default"}
                          >
                            Thuộc tính
                          </Button>,
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenCategoryModal(item, activeParentCategory.categoryId)}
                          />,
                          <Popconfirm title="Xóa danh mục con này?" onConfirm={() => handleDeleteCategory(item.categoryId)}>
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<TagOutlined style={{ color: "#1890ff", fontSize: 16 }} />}
                          title={<Text strong>{item.name}</Text>}
                          description={
                            <Space size="large">
                              <Text type="secondary">{item.description || "Chưa có mô tả"}</Text>
                              <Badge count={`Phí đăng: ${item.postingFee.toLocaleString()}đ`} style={{ backgroundColor: "#52c41a" }} />
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>

              {/* Attributes dynamic management section */}
              {attrCategoryId && (
                <Card
                  title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Space>
                        <SettingOutlined style={{ color: "#722ed1" }} />
                        <Text strong>
                          Thuộc tính động cho danh mục "
                          {categories.find((c) => c.categoryId === attrCategoryId)?.name}"
                        </Text>
                      </Space>
                      <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleOpenAttributeModal(null)}>
                        Thêm thuộc tính
                      </Button>
                    </div>
                  }
                  style={{
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    border: "1px solid #d3adf7",
                    background: "rgba(249, 240, 255, 0.2)",
                  }}
                >
                  <Table
                    columns={attributeColumns}
                    dataSource={attributes}
                    rowKey="attributeId"
                    loading={loadingAttributes}
                    pagination={false}
                    size="small"
                  />
                </Card>
              )}
            </Space>
          ) : (
            <Card style={{ textAlign: "center", borderRadius: 12, padding: 48 }}>
              <FolderOpenOutlined style={{ fontSize: 48, color: "#bfbfbf", marginBottom: 16 }} />
              <Paragraph style={{ margin: 0 }}>Vui lòng chọn hoặc thêm một danh mục cha.</Paragraph>
            </Card>
          )}
        </Col>
      </Row>

      {/* Add / Edit Category Modal */}
      <Modal
        title={selectedCategory ? "Cập nhật Danh mục" : "Thêm Danh mục Mới"}
        open={categoryModalVisible}
        onOk={handleCategorySubmit}
        onCancel={() => setCategoryModalVisible(false)}
        okText="Lưu lại"
        cancelText="Hủy"
        destroyOnClose
        style={{ top: 80 }}
      >
        <Form form={categoryForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="parentId" label="Danh mục cha (Tùy chọn)">
            <Select placeholder="Chọn danh mục cha" allowClear>
              {topLevelCategories
                .filter((c) => c.categoryId !== selectedCategory?.categoryId)
                .map((c) => (
                  <Select.Option key={c.categoryId} value={c.categoryId}>
                    {c.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}>
            <Input placeholder="Ví dụ: Đồ Điện Tử, Thời Trang Nam..." />
          </Form.Item>
          <Form.Item name="slug" label="Slug URL (Để trống để tự tạo tự động)">
            <Input placeholder="Ví dụ: do-dien-tu" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Nhập một vài dòng giới thiệu về danh mục này" />
          </Form.Item>
          <Form.Item name="postingFee" label="Phí đăng tin (đ)" rules={[{ required: true, message: "Vui lòng nhập phí đăng tin" }]}>
            <InputNumber style={{ width: "100%" }} min={0} formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add / Edit Attribute Modal */}
      <Modal
        title={selectedAttribute ? "Cập nhật Thuộc tính" : "Thêm Thuộc tính Mới"}
        open={attributeModalVisible}
        onOk={handleAttributeSubmit}
        onCancel={() => setAttributeModalVisible(false)}
        okText="Xác nhận"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={attributeForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="code" label="Mã code (Code định danh duy nhất)" rules={[{ required: true, message: "Vui lòng nhập mã code" }]}>
            <Input placeholder="Ví dụ: brand, size, screen_size..." disabled={!!selectedAttribute} />
          </Form.Item>
          <Form.Item name="name" label="Tên hiển thị" rules={[{ required: true, message: "Vui lòng nhập tên thuộc tính" }]}>
            <Input placeholder="Ví dụ: Thương hiệu, Kích thước..." />
          </Form.Item>
          <Form.Item name="dataType" label="Kiểu dữ liệu" rules={[{ required: true, message: "Vui lòng chọn kiểu dữ liệu" }]}>
            <Select placeholder="Chọn kiểu">
              <Select.Option value="STRING">Văn bản (STRING)</Select.Option>
              <Select.Option value="NUMBER">Số thực (NUMBER)</Select.Option>
              <Select.Option value="INTEGER">Số nguyên (INTEGER)</Select.Option>
              <Select.Option value="BOOLEAN">Đúng / Sai (BOOLEAN)</Select.Option>
              <Select.Option value="ENUM">Danh sách lựa chọn (ENUM)</Select.Option>
              <Select.Option value="DATE">Ngày tháng (DATE)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="optionsJson" label="Các lựa chọn (Dành cho ENUM - Định dạng JSON array)">
            <Input.TextArea rows={3} placeholder='Ví dụ: ["Apple", "Samsung", "Xiaomi"]' />
          </Form.Item>
          <Form.Item name="unit" label="Đơn vị đo lường (Tùy chọn)">
            <Input placeholder="Ví dụ: inch, GB, kg..." />
          </Form.Item>
          <Form.Item name="required" label="Trường bắt buộc" valuePropName="checked">
            <Badge status="warning" text="Cần điền khi người dùng đăng tin mới" />
          </Form.Item>
          <Form.Item name="description" label="Ghi chú mô tả">
            <Input placeholder="Nhập mô tả thêm..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
