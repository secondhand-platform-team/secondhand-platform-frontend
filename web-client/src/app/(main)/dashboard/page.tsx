"use client";

import { Card, Statistic, Row, Col, Button } from "antd";
import { FileText, Heart, ShoppingBag, DollarSign } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-3 py-8 sm:px-4 lg:px-5">
      <div className="mx-auto max-w-360">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Tổng quan
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Quản lý tài khoản và hoạt động của bạn
          </p>
        </div>

        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tin đăng"
                value={0}
                prefix={<FileText size={16} />}
                valueStyle={{ color: "#3b82f6" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Yêu thích"
                value={0}
                prefix={<Heart size={16} />}
                valueStyle={{ color: "#ec4899" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Đơn hàng"
                value={0}
                prefix={<ShoppingBag size={16} />}
                valueStyle={{ color: "#10b981" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Doanh thu"
                value={0}
                prefix={<DollarSign size={16} />}
                valueStyle={{ color: "#f59e0b" }}
              />
            </Card>
          </Col>
        </Row>

        <Card className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Hành động nhanh</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/post-item">
              <Button type="primary" size="large">
                Đăng tin mới
              </Button>
            </Link>
            <Link href="/my-posts">
              <Button size="large">Quản lý tin đăng</Button>
            </Link>
            <Link href="/favorites">
              <Button size="large">Danh sách yêu thích</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
