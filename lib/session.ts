import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./auth";

export const getSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
});

export const requireSession = cache(async () => {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
});
