import type { ProviderOptions } from "better-auth/oauth2";
import { type GenericOAuthConfig } from "better-auth/plugins";
import { Patient } from "fhir/r4";
import { decodeJwt } from "jose";

export interface EpicJwtClaims {
  aud: string;
  exp: number;
  fhirUser: string;
  iat: number;
  iss: string;
  sub: string;
}

export interface EpicOptions extends ProviderOptions {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
}

export const epic = (options: EpicOptions): GenericOAuthConfig => {
  const baseUrl =
    options.baseUrl || "https://fhir.epic.com/interconnect-fhir-oauth";
  const authorizationUrl = `${baseUrl}/oauth2/authorize`;
  const tokenUrl = `${baseUrl}/oauth2/token`;
  const scopes = options.scope ?? ["openid", "fhirUser"];
  const aud = `${baseUrl}/api/fhir/r4`;

  return {
    providerId: "epic",
    authorizationUrl,
    tokenUrl,
    scopes,
    authorizationUrlParams: {
      aud,
    },
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    getUserInfo: async (tokens) => {
      if (!tokens.idToken) {
        throw new Error("No ID token provided");
      }

      const claims: EpicJwtClaims = decodeJwt(tokens.idToken);
      const result = await fetch(claims.fhirUser, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      const patient: Patient = await result.json();

      const name = patient.name?.find((name) => name.use === "official")?.text;
      const email = patient.telecom
        ?.filter((contact) => contact.system === "email")
        .reduce((min, contact) => {
          if (min.rank === undefined) return contact;
          if (contact.rank === undefined) return min;
          return min.rank < contact.rank ? min : contact;
        })?.value;

      return {
        id: claims.sub,
        name: name,
        email: email,
        emailVerified: false,
      };
    },
  };
};
