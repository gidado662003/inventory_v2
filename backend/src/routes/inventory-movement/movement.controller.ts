import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { Request, Response } from "express";
import {
  createProductMovementSchema,
  getMovementsQuerySchema,
  getMovementTotalsQuerySchema,
} from "./movement.schema";
import movementService from "./movement.service";
const movementController = {
  createMovement: catchAsync(async (req: Request, res: Response) => {
    const { data, success } = createProductMovementSchema.safeParse(req.body);

    if (!success) {
      throw new AppError("bad request", 400);
    }
    const response = await movementService.createMovement(data);
    res.status(201).json({ success: true, response });
  }),
  getMovements: catchAsync(async (req: Request, res: Response) => {
    const { data, success } = getMovementsQuerySchema.safeParse(req.query);
    if (!success) throw new AppError("bad request", 400);
    const response = await movementService.getMovements(data);
    res.status(200).json({ success: true, response });
  }),

  getMovementsByProduct: catchAsync(async (req: Request, res: Response) => {
    const response = await movementService.getMovementsByProduct(
      req.params.productId as string,
    );
    res.status(200).json({ success: true, response });
  }),
  getMovementTotals: catchAsync(async (req: Request, res: Response) => {
    const { data, success } = getMovementTotalsQuerySchema.safeParse(req.query);
    if (!success) throw new AppError("bad request", 400);
    const response = await movementService.getMovementTotals(data);
    res.status(200).json({ success: true, response });
  }),
  getLastRestock: catchAsync(async (req: Request, res: Response) => {
    const response = await movementService.getLastRestock(
      req.params.productId as string,
    );
    res.status(200).json({ success: true, response });
  }),
};

export default movementController;
