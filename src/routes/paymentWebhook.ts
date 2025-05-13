import express from "express";
import crypto from "crypto";
import OrderModel from "../models/order.model";

const router = express.Router();

router.post("/midtrans-notification", async (req, res) => {
  try {
    const notification = req.body;

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
    } = notification;

    const serverKey = process.env.MIDTRANS_SERVER_KEY as string;
    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      return res.status(403).json({ message: "Invalid signature" });
    }

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { orderId: order_id },
      { status: transaction_status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ message: "Notification processed" });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
