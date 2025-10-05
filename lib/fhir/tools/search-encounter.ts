import { FhirClient } from "@/lib/fhir/client";
import { Tool, tool } from "ai";
import z from "zod";

export const searchEncounterParams = z.object({
  class: z.string().optional().describe("Classification of patient encounter"),
  date: z
    .string()
    .optional()
    .describe(
      "A date range that the encounter takes place (format: YYYY-MM-DD or date range)",
    ),
  identifier: z
    .string()
    .optional()
    .describe(
      "Identifiers by which this encounter is known in the format <code system>|<code>",
    ),
  status: z
    .string()
    .optional()
    .describe(
      "The encounter status (e.g., planned, arrived, triaged, in-progress, finished)",
    ),
});

export type SearchEncounterParams = z.infer<typeof searchEncounterParams>;

export const searchEncounter = ({ client }: { client: FhirClient }): Tool => {
  return tool({
    description: `
      Retrieves encounter information defining the setting where patient care takes place.

      This returns encounters across different care settings including:
      - Ambulatory (outpatient) encounters
      - Inpatient (hospital) encounters
      - Emergency encounters
      - Home health encounters
      - Virtual encounters

      The returned data includes:
      - Encounter status and classification
      - Encounter type (e.g., Office Visit, Hospital Visit)
      - Period (start and end times)
      - Participants (providers involved in the encounter)
      - Location (department, room, bed)
      - Diagnoses associated with the encounter
      - Service provider organization

      Important behavior:
      - Returns ALL inpatient encounters in the specified time period
      - Returns ONLY checked-in outpatient encounters (not upcoming appointments)
      - Encounter IDs are not valid until the encounter has started

      Use this tool when you need to:
      - Review a patient's encounter history
      - Find active or recent encounters for a patient
      - Understand where and when patient care took place
      - Get details about providers, diagnoses, and locations for encounters

      This will **not** include:
      - Upcoming appointments (use the Appointment resource instead)
      - Encounters from other healthcare systems
      - Outpatient encounters that haven't been checked in yet
    `,
    inputSchema: searchEncounterParams,
    execute: (params: SearchEncounterParams) => {
      return client.searchEncounter(params);
    },
  });
};
