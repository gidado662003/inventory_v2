import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";
import customerService from "./customer.service";
import { customerSchema, updateSchema } from "./customer.schema";

const customerController = {
  createCustomer: catchAsync(async (req, res) => {
    const { data, success } = customerSchema.safeParse(req.body);
    if (!success) {
      throw new AppError("bad request", 400);
    }
    const response = await customerService.createCustomer(data);
    res.status(201).json({ success: true, response });
  }),
  getCustomers: catchAsync(async (req, res) => {
    const response = await customerService.getCustomers();
    res.status(200).json({ success: true, response });
  }),
  getCustomerById: catchAsync(async (req, res) => {
    const customerId = req.params.customerId as string;

    const response = await customerService.getCustomerById(customerId);
    res.status(200).json({ success: true, response });
  }),
  updateCustomer: catchAsync(async (req, res) => {
    const { data, success } = updateSchema.safeParse(req.body);
    if (!success) {
      throw new AppError("bad request", 400);
    }
    const customerId = req.params.customerId as string;
    const response = await customerService.updateCustomer(customerId, data);
    res.status(200).json({ success: true, response });
  }),
};

export default customerController;
