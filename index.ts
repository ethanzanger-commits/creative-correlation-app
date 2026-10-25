import type { VercelRequest, VercelResponse } from "@vercel/node";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { campaigns, insertCampaignSchema } from "../../shared/schema.js";
import { getDb } from "../_lib/db.js";
import { getUserId } from "../_lib/auth.js";
import { generateCampaignContent } from "../_lib/generate.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const userId = await getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const db = getDb();

    if (req.method === "GET") {
      const rows = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.userId, userId))
        .orderBy(desc(campaigns.createdAt));
      return res.status(200).json(rows);
    }

    // POST: validate, generate with the model, then save.
    const input = insertCampaignSchema.parse(req.body);
    const generatedContent = await generateCampaignContent(input);

    const [campaign] = await db
      .insert(campaigns)
      .values({ ...input, userId, generatedContent })
      .returning();

    return res.status(201).json(campaign);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: err.errors[0].message,
        field: err.errors[0].path.join("."),
      });
    }
    console.error("Campaigns API error:", err);
    return res.status(500).json({
      message:
        req.method === "POST"
          ? "Failed to generate campaign"
          : "Failed to load campaigns",
    });
  }
}
