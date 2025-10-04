import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Force Node.js runtime (not Edge) for Better Auth compatibility
export const runtime = "nodejs";

export const { POST, GET } = toNextJsHandler(auth.handler);
