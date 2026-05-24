import http from "@/utils/api";
import type { OrderType } from "@/types/order.type";

export const orderService = {
  getSellerOrders: async () => {
    return http.get<OrderType[]>("/order/api/orders/seller");
  },
  getBuyerOrders: async () => {
    return http.get<OrderType[]>("/order/api/orders/me");
  },
  actionOrder: async (actionPath: string, body?: Record<string, unknown>) => {
    return http.put(`/order/api/orders${actionPath}`, body || {});
  },
  createOrder: async (body: Record<string, unknown>) => {
    return http.post<any>("/order/api/orders", body);
  },
};
