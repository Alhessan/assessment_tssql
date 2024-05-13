import { router, trpcError, protectedProcedure } from "../../trpc/core";
import { z } from "zod";
import { db } from "../../db/client";
import { and, eq, gte, lte } from "drizzle-orm";
import * as schema from "../../db/schema";

const CreateSubscriptionInput = z.object({
  userId: z.number(),
  planId: z.number(),
  cost: z.number(),
});

const UpdateSubscriptionInput = z.object({
  userId: z.number(),
  subscriptionId: z.number(),
  planId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  cost: z.number(),
});

export const subscriptions = router({
  create: protectedProcedure
    .input(CreateSubscriptionInput)
    .mutation(async ({ input }) => {
      const { userId, planId, cost } = input;
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const subscription = await db
        .insert(schema.subscriptions)
        .values({
          userId,
          planId,
          cost,
          startDate: new Date(),
          endDate,
        })
        .returning();

      if (!subscription) {
        throw new trpcError({
          code: "BAD_REQUEST",
          message: "Subscription not created",
        });
      }

      return { subscription };
    }),

  update: protectedProcedure
    .input(UpdateSubscriptionInput)
    .mutation(async ({ input }) => {
      const { userId, subscriptionId, planId, startDate, endDate, cost } = input;

      const updatedSubscription = await db
        .update(schema.subscriptions)
        .set({
          userId,
          planId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          cost,
        })
        .where(eq(schema.subscriptions.id, subscriptionId));

      if (!updatedSubscription) {
        throw new trpcError({
          code: "BAD_REQUEST",
          message: "Subscription not updated",
        });
      }

      return { updatedSubscription };
    }),

  upgrade: protectedProcedure
    .input(z.object({ userId: z.number(), newPlanId: z.number() }))
    .mutation(async ({ input }) => {
      const { userId, newPlanId } = input;
      const currentDate = new Date();

      const currentSubscription = await db.query.subscriptions.findFirst({
        where: and(
          eq(schema.subscriptions.userId, userId),
          gte(schema.subscriptions.endDate, currentDate)
        ),
      });

      if (!currentSubscription) {
        throw new trpcError({
          code: "NOT_FOUND",
          message: "Active subscription not found",
        });
      }

      const newPlan = await db.query.plans.findFirst({
        where: eq(schema.plans.id, newPlanId),
      });

      if (!newPlan) {
        throw new trpcError({
          code: "NOT_FOUND",
          message: "New plan not found",
        });
      }

      const daysRemaining = Math.ceil(
        (currentSubscription.endDate.valueOf() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const upgradeCost = Math.ceil(((newPlan.price - currentSubscription.cost) / 30) * daysRemaining);

      await db.transaction(async (tx) => {
        await tx
          .update(schema.subscriptions)
          .set({
            planId: newPlanId,
            cost: currentSubscription.cost + upgradeCost,
          })
          .where(eq(schema.subscriptions.userId, userId));
      });

      return { success: true };
    }),

  findAll: protectedProcedure.query(async () => {
    const subscriptions = await db.query.subscriptions.findMany();
    return { subscriptions };
  }),

  get: protectedProcedure.query(async ({ ctx: { user } }) => {
    const { userId } = user;
    try {
      const subscriptions = await db.query.subscriptions.findMany({
        where: eq(schema.subscriptions.userId, userId),
      });

      return subscriptions;
    } catch (error) {
      console.error("Error fetching subscriptions", error);
      return [];
    }
  }),

  getOne: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const { id } = input;
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.id, id),
    });

    if (!subscription) {
      throw new trpcError({
        code: "NOT_FOUND",
        message: "Subscription not found",
      });
    }

    return subscription;
  }),
});
