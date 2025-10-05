import { FhirClient } from "@/lib/fhir/client";
import { Tool, tool } from "ai";
import z from "zod";

export const ReadAdverseEventParams = z.object({
  id: z
    .string()
    .describe("The FHIR ID of the AdverseEvent resource to retrieve"),
});

export const readAdverseEvent = ({ client }: { client: FhirClient }): Tool => {
  return tool({
    description: `
      Retrieves data about an adverse event that caused unintended physical injury to the patient.

      This returns detailed information about events resulting from or contributed to by medical care, research studies,
      or other healthcare setting factors that may require additional monitoring, treatment, hospitalization,
      or result in death.

      The returned data includes:
      - Event details (type, description, date of occurrence)
      - Severity and seriousness classifications
      - Expected vs. unexpected status
      - Causality assessment (relationship to treatment/study)
      - Outcome (resolved, ongoing, fatal, etc.)
      - Related research study or suspect entities (medications, procedures)
      - Recording practitioner and date documented
      - Severity history tracking changes over time
      - Resolution date (if applicable)

      Use this tool when you need to:
      - Review specific adverse event details for a patient
      - Assess the severity and seriousness of a documented adverse event
      - Understand the relationship between an adverse event and a research study or treatment
      - Track the progression or resolution of an adverse event over time

      This will **not** include:
      - Adverse events from other healthcare systems
      - Undocumented or potential events that haven't been formally recorded
    `,
    inputSchema: ReadAdverseEventParams,
    execute: (params: z.infer<typeof ReadAdverseEventParams>) => {
      return client.readAdverseEvent(params.id);
    },
  });
};
