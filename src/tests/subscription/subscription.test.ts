import { beforeAll, describe, expect, it } from "vitest";
import { db, schema } from "../../db/client";
import { createAuthenticatedCaller, createCaller } from "../helpers/utils";
import resetDb from "../helpers/resetDb";
import { eq } from "drizzle-orm";

describe("Subscriptions API", async () => {
var authenticatedCaller: any;
var plan1: any;
var plan2: any;
var userInDb: any;

  beforeAll(async () => {
    await resetDb(); // Reset the database before running tests
    const resMock = { setCookie: () => {}, clearCookie: () => {} };
    const user = {
      email: "mail@mail.com",
      password: "P@ssw0rd",
      name: "test",
      timezone: "Asia/Riyadh",
      locale: "en",
    };
    const registeredUserRes = await createCaller({ res: resMock }).auth.register(user);
    expect(registeredUserRes.success).toBe(true);
    userInDb = await db.query.users.findFirst({
      where: eq(schema.users.email, user.email),
    });
    authenticatedCaller = createAuthenticatedCaller({ userId: userInDb!.id});

    // Create plan1 and plan2
    const plan1Res = await authenticatedCaller.plans.create({ name: "Plan 1", price: 100 });
    console.log("plan1");
    console.log(plan1Res.plan);
    plan1 = plan1Res.plan[0];
    const plan2Res = await authenticatedCaller.plans.create({ name: "Plan 2", price: 200 });
    plan2 = plan2Res.plan[0];
  });

describe("create", async () => {
    it("should create a new subscription", async () => {
        const authenticatedCaller: any = createAuthenticatedCaller({ userId: userInDb!.id });
        const subscriptionData = {
            userId: userInDb!.id,
            planId: plan1.id,
            cost: plan1.price
        };
        console.log("subscriptionData");
        console.log(subscriptionData);
        const createSubscriptionRes = await authenticatedCaller.subscriptions.create(subscriptionData);
        const firstSubscription = createSubscriptionRes.subscription[0]; 

        expect(firstSubscription).toBeDefined();
        expect(firstSubscription?.cost).toBe(subscriptionData.cost);
    });
});

  describe("upgrade", async () => {
    it("should upgrade an existing subscription", async () => {
      // Update current active subscription to 15 days before current date
      const currentDate = new Date();
      const startDate = new Date(currentDate.setDate(currentDate.getDate() - 15));
      const endDate = new Date(currentDate.setDate(currentDate.getDate() + 30));
    let subscriptionData = {
        userId: userInDb!.id,
        subscriptionId: 1, // replace with a valid subscriptionId
        planId: plan1.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        cost: plan1.price
      };
      const updateSubscriptionRes = await authenticatedCaller.subscriptions.update(subscriptionData);

      // Upgrade the subscription
      const upgradeSubscriptionRes = await authenticatedCaller.subscriptions.upgrade({
        userId: userInDb!.id,
        newPlanId: plan2.id
      });

      expect(upgradeSubscriptionRes.success).toBe(true);

      // Fetch the updated subscription
      const updatedSubscription = await db.query.subscriptions.findFirst({
        where: eq(schema.subscriptions.id, 1), 
      });

      // Assert on making upgrade that the cost of the subscription is 150
      expect(updatedSubscription?.cost).toBe(150);
    });
  });
});
