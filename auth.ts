import { verifyToken } from "@clerk/backend";
import type { VercelRequest } from "@vercel/node";

/**
 * Returns the Clerk user id for the request, or null if the request has no
 * valid session token. The browser sends it as `Authorization: Bearer <jwt>`.
 */
export async function getUserId(req: VercelRequest): Promise<string | null> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error("CLERK_SECRET_KEY is not set");
    return null;
  }

  try {
    // Throws if the token is invalid or expired.
    // CLERK_JWT_KEY (optional) enables faster networkless verification.
    const payload = await verifyToken(header.slice("Bearer ".length), {
      secretKey,
      ...(process.env.CLERK_JWT_KEY ? { jwtKey: process.env.CLERK_JWT_KEY } : {}),
    });
    const sub = payload.sub;
    return typeof sub === "string" && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}
