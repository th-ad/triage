import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { epic } from "./auth/social-providers/epic";
import { account, session, user, verification } from "./db/schema";
import { getAccounts } from "./db/queries";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const accounts = await getAccounts(session.session.userId);
      const account = accounts[0];
      return {
        account,
        user,
        session,
      };
    }),
    genericOAuth({
      config: [
        epic({
          clientId: process.env.EPIC_CLIENT_ID || "",
          clientSecret: process.env.EPIC_CLIENT_SECRET || "",
        }),
      ],
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
