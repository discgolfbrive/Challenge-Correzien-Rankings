import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { yearsTable } from "./years";

export const stagesTable = pgTable("stages", {
  id: serial("id").primaryKey(),
  yearId: integer("year_id").notNull().references(() => yearsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  location: text("location"),
  date: text("date"),
  par: integer("par").notNull().default(54),
  order: integer("order").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStageSchema = createInsertSchema(stagesTable).omit({ id: true, createdAt: true });
export type InsertStage = z.infer<typeof insertStageSchema>;
export type Stage = typeof stagesTable.$inferSelect;
