import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  
  profiles: defineTable({
    userId: v.id("users"),
    age: v.optional(v.number()),
    weight_kg: v.optional(v.number()),
    height_cm: v.optional(v.number()),
    sex_assigned: v.optional(v.string()),
    activity_level: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  meals: defineTable({
    userId: v.id("users"),
    name: v.string(),
    calories: v.number(),
    consumed_at: v.number(), 
  }).index("by_userId", ["userId"]),

  goals: defineTable({
    userId: v.id("users"),
    type: v.string(), 
    target: v.number(),
    current: v.number(),
    status: v.string(), 
  }).index("by_userId", ["userId"]),
  
  mealPlans: defineTable({
    userId: v.id("users"),
    date: v.string(), 
    mealType: v.string(), 
    recipeName: v.string(),
    calories: v.number(),
    notes: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
});
