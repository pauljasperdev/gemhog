import { protectedProcedure, publicProcedure, router } from "../index";
import { subscriberRouter } from "./subscriber";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  subscriber: subscriberRouter,
});
export type AppRouter = typeof appRouter;
