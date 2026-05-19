import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import siteSettingsRouter from "./siteSettings";
import pagesRouter from "./pages";
import eventsRouter from "./events";
import newsRouter from "./news";
import blogRouter from "./blog";
import contactRouter from "./contact";
import sponsorsRouter from "./sponsors";
import heroImagesRouter from "./heroImages";
import usersRouter from "./users";
import adminRouter from "./admin";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(siteSettingsRouter);
router.use(pagesRouter);
router.use(eventsRouter);
router.use(newsRouter);
router.use(blogRouter);
router.use(contactRouter);
router.use(sponsorsRouter);
router.use(heroImagesRouter);
router.use(usersRouter);
router.use(adminRouter);
router.use(storageRouter);

export default router;
