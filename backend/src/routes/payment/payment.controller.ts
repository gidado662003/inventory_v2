import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { paymentService } from "./payment.service";
import {
  paymentWithSaleSchema,
  getPaymentsQuerySchema,
} from "./payment.schema";
export const paymentController = {
  createPayment: catchAsync(async (req, res) => {
    const { data, success } = paymentWithSaleSchema.safeParse(req.body);
    const recordedById = "743877d1-41bb-494a-9404-10132e23fad9";
    if (!success) {
      throw new AppError("bad request", 400);
    }
    const payload = {
      ...data,
      recordedById,
    };
    const response = await paymentService.createpayment(payload);
    res.status(201).json({ success: true, response });
  }),
  getPayments: catchAsync(async (req, res) => {
    const { data, success } = getPaymentsQuerySchema.safeParse(req.query);
    if (!success) {
      throw new AppError("bad request", 400);
    }
    const response = await paymentService.getPayments(data);
    res.status(200).json({ success: true, response });
  }),
  getPaymentsForSale: catchAsync(async (req, res) => {
    const salesId = req.params.id as string;
    const response = await paymentService.getPaymentsBySale(salesId);
    res.status(200).json({ success: true, response });
  }),
  getPaymentsByCustomer: catchAsync(async (req, res) => {
    const customerId = req.params.customerId as string;
    const response = await paymentService.getPaymentsByCustomer(customerId);
    res.status(200).json({ success: true, response });
  }),
};
