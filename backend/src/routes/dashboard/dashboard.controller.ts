import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";
import { dashboardSummaryQuerySchema } from "./dashboard.schema";
import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  getSummary: catchAsync(async (req, res) => {
    const { data, success } = dashboardSummaryQuerySchema.safeParse(req.query);
    if (!success) {
      throw new AppError("bad request", 400);
    }
    const response = await dashboardService.getSummary(data);
    res.status(200).json({ success: true, response });
  }),
};
