import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scoringRulesTable = pgTable("scoring_rules", {
  id: serial("id").primaryKey(),
  position: integer("position").notNull().unique(),
  points: integer("points").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScoringRuleSchema = createInsertSchema(scoringRulesTable).omit({ id: true, createdAt: true });
export type InsertScoringRule = z.infer<typeof insertScoringRuleSchema>;
export type ScoringRule = typeof scoringRulesTable.$inferSelect;
