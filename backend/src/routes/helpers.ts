import { Router, type Request, type Response, type NextFunction } from "express";

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function createCrudRouter<TList, TCreate, TUpdate>(handlers: {
  list: () => Promise<TList[]>;
  get: (id: string) => Promise<TList>;
  create: (body: TCreate) => Promise<TList>;
  update: (id: string, body: TUpdate) => Promise<TList>;
  remove: (id: string) => Promise<{ id: string }>;
}) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      res.json({ data: await handlers.list() });
    }),
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      res.json({ data: await handlers.get(String(req.params.id)) });
    }),
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const item = await handlers.create(req.body as TCreate);
      res.status(201).json({ data: item });
    }),
  );

  router.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const item = await handlers.update(
        String(req.params.id),
        req.body as TUpdate,
      );
      res.json({ data: item });
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      res.json(await handlers.remove(String(req.params.id)));
    }),
  );

  return router;
}
