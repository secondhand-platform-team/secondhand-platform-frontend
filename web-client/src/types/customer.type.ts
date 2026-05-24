import { OrderType } from "./order.type";

export interface CustomerData {
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  buyerEmail: string;
  buyerBio: string;
  totalOrders: number;
  totalSpent: number;
  completedOrders: number;
  cancelledOrders: number;
  lastOrderDate: string;
  orders: OrderType[];
}
