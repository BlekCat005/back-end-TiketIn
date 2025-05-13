import { Request, Response } from "express";
import OrderModel, { OrderStatus } from "../models/order.model";

const notificationHandler = async (req: Request, res: Response) => {
  const notif = req.body;

  const orderId = notif.order_id;
  const transactionStatus = notif.transaction_status;
  const fraudStatus = notif.fraud_status;

  console.log("📩 Notifikasi diterima:", notif);

  try {
    let order = await OrderModel.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Handle status dari Midtrans
    if (transactionStatus === "capture") {
      if (fraudStatus === "accept") {
        order.status = OrderStatus.COMPLETED;
      } else if (fraudStatus === "challenge") {
        order.status = OrderStatus.PENDING;
      }
    } else if (transactionStatus === "settlement") {
      order.status = OrderStatus.COMPLETED;
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      order.status = OrderStatus.CANCELLED;
    } else if (transactionStatus === "pending") {
      order.status = OrderStatus.PENDING;
    }

    await order.save();
    return res.status(200).json({ message: "Notifikasi diproses" });
  } catch (err) {
    console.error("❌ Gagal memproses webhook:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default {
  notificationHandler,
};
