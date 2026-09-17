import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { Request, Response } from "express";
import { salesSchema, getSalesQuerySchema, salesItemEdit } from "./sale.schema";
import { salesService } from "./sale.service";
import { z } from "zod";

const editSaleItemsSchema = z.array(salesItemEdit).min(1);

export const salesController = {
  createSales: catchAsync(async (req: Request, res: Response) => {
    const { data, success } = salesSchema.safeParse(req.body);

    if (!success) {
      throw new AppError("bad request", 400);
    }
    const response = await salesService.createSales(data, req.user!.id);

    res.status(201).json({ success: true, response });
  }),
  getSales: catchAsync(async (req, res) => {
    const { data, success } = getSalesQuerySchema.safeParse(req.query);

    if (!success) {
      throw new AppError("bad request", 400);
    }
    const result = await salesService.getSales(data);
    res.status(200).json({ success: true, response: result });
  }),
  getSalesItems: catchAsync(async (req, res) => {
    const { data, success } = getSalesQuerySchema.safeParse(req.query);

    if (!success) {
      throw new AppError("bad request", 400);
    }
    const result = await salesService.getSalesItems(data);
    res.status(200).json({ success: true, response: result });
  }),
  getSalesById: catchAsync(async (req, res) => {
    const salesId = req.params.id as string;
    const response = await salesService.getSaleById(salesId);
    res.status(200).json({ success: true, response });
  }),

  editSaleItems: catchAsync(async (req: Request, res: Response) => {
    const { data, success } = editSaleItemsSchema.safeParse(req.body);
    if (!success) {
      throw new AppError("bad request", 400);
    }
    const result = await salesService.editSaleItems(
      req.params.id as string,
      data,
      req.user!.id,
    );
    res.status(200).json({ success: true, response: result });
  }),
  getSalesSummary: catchAsync(async (req: Request, res: Response) => {
    const summary = await salesService.getSalesSummary(req.query);

    res.status(200).json({
      success: true,
      response: summary,
    });
  }),
};
