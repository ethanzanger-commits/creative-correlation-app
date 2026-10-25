import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../shared/schema.js";

let cached: ReturnType<typeof create> | null = null;

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return drizzle(neon(url), { schema });
}

// Created lazily so a missing env var returns a clean error instead of
// crashing when the function module is first loaded.
export function getDb() {
  if (!cached) cached = create();
  return cached;
}
