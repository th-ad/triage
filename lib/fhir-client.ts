import ky, { KyInstance } from "ky";
import { decodeJwt } from "jose";
import type { Appointment, Bundle, Resource } from "fhir/r4";
import { EpicJwtClaims } from "./auth/social-providers/epic";
import { z } from "zod";

function ensureSlash(u: string) {
  return u.endsWith("/") ? u : u + "/";
}

export type SearchParams = Record<
  string,
  string | number | boolean | undefined
>;

export const GetAppointmentsParams = z.object({
  date: z.date(),
  serviceCategory: z.enum(["appointment", "surgery"]),
});

interface FhirClientOptions {
  accessToken: string;
  idToken: string;
}

export class FhirClient {
  private accessToken: string;
  private baseUrl: string;
  private http: KyInstance;
  private patientId: string;

  constructor({ accessToken, idToken }: FhirClientOptions) {
    this.accessToken = accessToken;

    const { iss, sub }: EpicJwtClaims = decodeJwt(idToken);
    if (!iss) throw new Error("idToken missing `iss`");
    if (!sub) throw new Error("idToken missing `sub`");

    this.patientId = sub;
    this.baseUrl = new URL("api/FHIR/R4/", ensureSlash(iss)).toString();

    this.http = ky.create({
      prefixUrl: this.baseUrl,
      headers: {
        Accept: "application/fhir+json",
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }

  async getAppointments({
    date,
    serviceCategory,
  }: z.infer<typeof GetAppointmentsParams>) {
    let bundle = await this.search<Appointment>("Appointment", {
      date: date.toString(),
      patient: this.patientId,
      "service-category": serviceCategory,
    });
    return FhirClient.resources<Appointment>(bundle);
  }

  read<T extends Resource = Resource>(resourceType: string, id: string) {
    return this.http.get(`${resourceType}/${encodeURIComponent(id)}`).json<T>();
  }

  search<T extends Resource = Resource>(
    resourceType: string,
    params?: SearchParams,
  ) {
    const searchParams = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined) searchParams.set(k, String(v));
    });
    return this.http.get(resourceType, { searchParams }).json<Bundle<T>>();
  }

  static resources<T extends Resource = Resource>(bundle: Bundle<T>): T[] {
    return (bundle.entry ?? [])
      .map((e) => e?.resource as T | undefined)
      .filter(Boolean) as T[];
  }

  async *searchAll<T extends Resource = Resource>(
    resourceType: string,
    params?: SearchParams,
  ): AsyncGenerator<T, void, unknown> {
    let bundle = await this.search<T>(resourceType, params);
    while (true) {
      for (const res of FhirClient.resources<T>(bundle)) yield res;
      const nextUrl = bundle.link?.find((l) => l.relation === "next")?.url;
      if (!nextUrl) break;
      bundle = await ky.get(nextUrl).json<Bundle<T>>();
    }
  }
}
