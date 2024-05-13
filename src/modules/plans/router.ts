// Import necessary dependencies
import { router, trpcError, protectedProcedure } from "../../trpc/core";
import { z } from "zod";
import { db } from "../../db/client";
import { and, eq, gte, lte } from "drizzle-orm";
import * as schema from "../../db/schema";

// Define input and output schemas using Zod
const CreatePlanInput = z.object({
  name: z.string(),
  price: z.number()
});

const UpdatePlanInput = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number()
});

// Define router for Plan module
export const plans = router({
  create: protectedProcedure
    .input(CreatePlanInput)
    .mutation(async ({ input }) => {
        const { name, price } = input;
        console.log("createPlan", name);
    
        // Create a new plan
        const plan = await db
            .insert(schema.plans)
            .values({
            name,
            price,
            })
            .returning();
    
        if (!plan) {
            console.log("Plan not created");
            throw new trpcError({
            code: "BAD_REQUEST",
            message: "Plan not created",
            });
        }
    
        return { plan };
    }),

  update: protectedProcedure
    .input(UpdatePlanInput)
    .mutation(async ({ input }) => {
        const { id, name, price } = input;
    
        // Update the plan
        const updatedPlan = await db
            .update(schema.plans)
            .set({
            name,
            price,
            })
            .where(eq(schema.plans.id, id));
    
        if (!updatedPlan) {
            throw new trpcError({
            code: "BAD_REQUEST",
            message: "Plan not updated",
            });
        }
    
        return { plan: updatedPlan };
    }),

    findAll: protectedProcedure.query(async () => {
        const plans = await db.query.plans.findMany();
        return { plans };
    }),
 
    get: protectedProcedure.query(async ({ ctx: { user } }) => {
        const { userId } = user;
        try {
            const plans = await db.query.plans.findMany({
                // where planId in select plan Id subscriptions where userId = userId
                where: eq(schema.subscriptions.userId, userId),
            });

            return plans;
        } catch (error) {
            console.error("Error fetching plans", error);
            return [];
        }
    }),
    getOne: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
        const { id } = input;
        const plan = await db.query.plans.findFirst({
            where: eq(schema.plans.id, id),
        });

        if (!plan) {
            throw new trpcError({
                code: "NOT_FOUND",
                message: "Plan not found",
            });
        }

        return plan;
    }),
});
