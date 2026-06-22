import { Router, type IRouter } from "express";
import healthRouter from "./health";
import conflictsRouter from "./conflicts";
import newsRouter from "./news";

const router: IRouter = Router();

router.use(healthRouter);
router.use(conflictsRouter);
router.use(newsRouter);

export default router;
