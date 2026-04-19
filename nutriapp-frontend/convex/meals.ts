import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("meals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const add = mutation({
  args: { name: v.string(), calories: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    return await ctx.db.insert("meals", {
      userId,
      name: args.name,
      calories: args.calories,
      consumed_at: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("meals") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    const meal = await ctx.db.get(args.id);
    if (meal?.userId === userId) {
      await ctx.db.delete(args.id);
    }
  },
});

export const reset = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    const meals = await ctx.db
      .query("meals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
      
    for (const meal of meals) {
      await ctx.db.delete(meal._id);
    }
  },
});
