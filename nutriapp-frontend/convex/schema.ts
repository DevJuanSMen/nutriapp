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
    goal_type: v.optional(v.string()), // "lose", "maintain", "gain"
  }).index("by_userId", ["userId"]),

  meals: defineTable({
    userId: v.id("users"),
    name: v.string(),
    calories: v.number(),
    protein: v.optional(v.number()),   // grams
    carbs: v.optional(v.number()),     // grams
    fat: v.optional(v.number()),       // grams
    mealType: v.optional(v.string()),  // "breakfast", "lunch", "dinner", "snack"
    consumed_at: v.number(), 
    date: v.optional(v.string()),      // "YYYY-MM-DD" for filtering
  }).index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"]),

  // Daily archived logs — created when the user resets a day
  dailyLogs: defineTable({
    userId: v.id("users"),
    date: v.string(),                  // "YYYY-MM-DD"
    totalCalories: v.number(),
    totalProtein: v.number(),
    totalCarbs: v.number(),
    totalFat: v.number(),
    mealsCount: v.number(),
    meals: v.array(v.object({
      name: v.string(),
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      mealType: v.string(),
      consumed_at: v.number(),
    })),
    waterGlasses: v.optional(v.number()),
  }).index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"]),

  // Supplements tracking (generalized — protein powder, creatine, vitamins, hormones, etc.)
  supplements: defineTable({
    userId: v.id("users"),
    name: v.string(),                  // "Proteína Whey", "Creatina", "Vitamina D"
    category: v.string(),             // "protein", "vitamin", "mineral", "hormone", "preworkout", "other"
    dose: v.string(),                 // "5g", "10mg", "1 scoop"
    frequency: v.string(),            // "daily", "twice_daily", "weekly", "as_needed"
    time_of_day: v.optional(v.string()), // "morning", "afternoon", "night", "pre_workout", "post_workout"
    notes: v.optional(v.string()),
    active: v.boolean(),              // if the user is currently taking it
    created_at: v.number(),
  }).index("by_userId", ["userId"]),

  // Supplement intake log (daily check-off)
  supplementLogs: defineTable({
    userId: v.id("users"),
    supplementId: v.id("supplements"),
    date: v.string(),                  // "YYYY-MM-DD"
    taken: v.boolean(),
    taken_at: v.optional(v.number()),
  }).index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"])
    .index("by_supplement_date", ["supplementId", "date"]),

  // Water / hydration tracking
  waterLogs: defineTable({
    userId: v.id("users"),
    date: v.string(),                  // "YYYY-MM-DD"
    glasses: v.number(),               // number of glasses (1 glass = 250ml)
  }).index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"]),

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
