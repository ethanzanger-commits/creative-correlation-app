import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { campaigns } from "../../shared/schema.js";
import { getDb } from "../_lib/db.js";
import { getUserId } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const userId = await getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const id = Number(Array.isArray(req.query.id) ? req.query.id[0] : req.query.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(404).json({ message: "Campaign not found" });
  }

  try {
    const [campaign] = await getDb()
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id));

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (campaign.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return res.status(200).json(campaign);
  } catch (err) {
    console.error("Campaign lookup error:", err);
    return res.status(500).json({ message: "Failed to load campaign" });
  }
}
