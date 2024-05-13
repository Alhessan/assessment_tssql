
## schema design implementation (bonus)
- subscriptions
NOTE: I have implemented a subscription table and used it in my solution
- orders
it could be something like:
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey().notNull(),
  order_date: timestamp("order_date").notNull(),
  plan_id: integer("plan_id").notNull(),
  status: text("status").checkIn(["new", "paid", "canceled"]).notNull(),
  customer_id: integer("customer_id").notNull(),
  payment_code: text("payment_code").notNull(),
  cost: integer("cost").notNull(),
  notes: text("notes"),
  serial_number: text("serial_number").notNull(),
});
- subscriptionActivations
export const subscriptionActivations = sqliteTable("subscription_activations", {
  id: integer("id").primaryKey().notNull(),
  activationCode: text("activation_code").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  subscriptionId: integer("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "restrict", onUpdate: "restrict" }),
  activationDate: timestamp("activation_date").notNull(),
});

## question (bonus)

If you were to introduce two more props to plans:

1. defaultUsers: number of users included in the plan by default
2. pricePerUser: price per additional user beyond the default

How would this affect the current plan upgrade calculation?

ANSWER:
if a user upgraded and he exists in the 'defaultUsers' of  a plan we should remove him.
also -possibly-  when calculating the cost of upgrade we should consider 'pricePerUser' instead of normal price

### answer here:
---
