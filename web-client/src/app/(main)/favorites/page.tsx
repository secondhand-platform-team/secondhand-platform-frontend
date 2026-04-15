"use client";

import { Button, Card, Col, Empty, Row, Tag, Typography, message } from "antd";
import { HeartFilled } from "@ant-design/icons";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchMyFavorites, removeFavorite } from "@/stores/slices/item.slice";

export default function FavoritesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { myFavorites, loading } = useAppSelector((state) => state.item);

  useEffect(() => {
    dispatch(fetchMyFavorites());
  }, [dispatch]);

  const onRemoveFavorite = async (itemId: string) => {
    try {
      await dispatch(removeFavorite(itemId)).unwrap();
      message.success("Đã xóa khỏi danh sách yêu thích");
    } catch (error) {
      if (typeof error === "string") {
        message.error(error);
      } else if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("Không thể xóa yêu thích");
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Typography.Title level={2} className="!mb-0">Tin đã yêu thích</Typography.Title>
        <Button onClick={() => router.push("/home")}>Về trang chủ</Button>
      </div>

      {myFavorites.length === 0 && !loading ? (
        <Card>
          <Empty description="Bạn chưa có tin yêu thích nào" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {myFavorites.map((item) => (
            <Col xs={24} md={12} lg={8} key={item.itemId}>
              <Card
                loading={loading}
                title={item.title}
                extra={<Tag color="gold">{item.status || "AVAILABLE"}</Tag>}
                actions={[
                  <Button type="text" danger onClick={() => onRemoveFavorite(item.itemId)} key="remove">
                    <HeartFilled /> Bỏ yêu thích
                  </Button>,
                ]}
              >
                <Typography.Paragraph className="!mb-1">
                  Giá: {item.price?.toLocaleString("vi-VN")} VND
                </Typography.Paragraph>
                <Typography.Paragraph type="secondary" className="!mb-0">
                  {item.description || "Không có mô tả"}
                </Typography.Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
