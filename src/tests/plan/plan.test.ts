import { beforeAll, describe, expect, it } from "vitest";
import { db, schema } from "../../db/client";
import { createAuthenticatedCaller, createCaller } from "../helpers/utils";
import resetDb from "../helpers/resetDb";
import { eq } from "drizzle-orm";

describe("Plans API", async () => {
  beforeAll(async () => {
    await resetDb(); // Reset the database before running tests
    const resMock = { setCookie: () => {}, clearCookie: () => {} };
    const createCallerInstance = createCaller({ res: resMock });
  });

  describe("create", async () => {
     const user = {
      email: "mail@mail.com",
      password: "P@ssw0rd",
      name: "test",
      timezone: "Asia/Riyadh",
      locale: "en",
    };
    it("should create a new plan", async () => {
      const registeredUserRes = await createCaller({}).auth.register(user);
      expect(registeredUserRes.success).toBe(true);
      const userIndb = await db.query.users.findFirst({
        where: eq(schema.users.email, user.email),
      });
      const resMock = { setCookie: () => {}, clearCookie: () => {} };
      const planData = {
        name: "Test Plan",
        price: 50
      };
      const createPlanRes = await createAuthenticatedCaller({
        userId: userIndb!.id
      }).plans.create(planData);
      const firstPlan = createPlanRes.plan[0]; 

      expect(firstPlan).toBeDefined();
      expect(firstPlan?.name).toBe(planData.name);
      expect(firstPlan?.price).toBe(planData.price);
    });
  });

  describe("update", async () => {
    const user = {
      email: "mail@mail.com"
    };
    it("should update an existing plan", async () => {
      const resMock = { setCookie: () => {}, clearCookie: () => {} };
      const existingPlanId = 1;
      const updatedPlanData = {
        id: existingPlanId,
        name: "Updated Plan",
        price: 60,
      };
      const userInDb = await db.query.users.findFirst({
        where: eq(schema.users.email, user.email),
        });
      const updatePlanRes = await createAuthenticatedCaller({
        userId: userInDb!.id
       }).plans.update(updatedPlanData);
       console.log("updatePlanRes", updatePlanRes);
      const firstPlan: any = updatePlanRes.plan;

      expect(firstPlan).toBeDefined();
      expect(firstPlan?.changes).toBeGreaterThan(0);
    });
  });

  describe("findAll", async () => {
    const user = {
      email: "mail@mail.com",
     
    };
    it("should fetch all plans", async () => {
      const userIndb = await db.query.users.findFirst({
        where: eq(schema.users.email, user.email),
      });
      const findAllRes = await createAuthenticatedCaller({
        userId: userIndb!.id
      }).plans.findAll();


      expect(findAllRes.plans).toBeDefined();
      expect(Array.isArray(findAllRes.plans)).toBe(true);
      expect(findAllRes.plans.length).toBeGreaterThan(0);
    });
  });

  describe("getOne", async () => {
    const user = {
      email: "mail@mail.com",
    
    };
    it("should fetch a specific plan", async () => {
        const userIndb = await db.query.users.findFirst({
            where: eq(schema.users.email, user.email),
        });
        const planId = 1;
        const getOneRes = await createAuthenticatedCaller({ 
            userId: userIndb!.id
        }).plans.getOne({ id: planId });

      expect(getOneRes).toBeDefined();
      expect(getOneRes.id).toBe(planId);
    });
  });
});
