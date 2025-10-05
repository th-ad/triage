import { type Tool, tool } from "ai";
import z from "zod";
import type { FhirClient } from "@/lib/fhir/client";

export const searchDocumentReferenceParams = z.object({
  category: z
    .string()
    .optional()
    .describe(
      'Should always be "clinical-note" for clinical notes. Either category or type is required.',
    ),
  type: z
    .string()
    .optional()
    .describe(
      "The LOINC code for the document type (e.g., 18842-5 for Discharge Documentation, 11488-4 for Consultation, 34117-2 for History & Physical, 11506-3 for Progress Note, 28570-0 for Procedure Note, 34111-5 for Emergency Department Note, 34746-8 for Nurse Note). Either category or type is required.",
    ),
  date: z
    .string()
    .optional()
    .describe(
      "When the document reference was created (format: YYYY-MM-DD or date range)",
    ),
  docstatus: z
    .string()
    .optional()
    .describe("The status: preliminary, final, amended, or entered-in-error"),
  encounter: z
    .string()
    .optional()
    .describe("The encounter FHIR ID that holds the DocumentReference data"),
  period: z
    .string()
    .optional()
    .describe(
      "When the service was documented (format: YYYY-MM-DD or date range)",
    ),
});

export type SearchDocumentReferenceParams = z.infer<
  typeof searchDocumentReferenceParams
>;

export const searchDocumentReference = ({
  client,
}: {
  client: FhirClient;
}): Tool => {
  return tool({
    description: `
      Search for clinical notes and documentation using the FHIR DocumentReference resource.

      This implementation is used to communicate clinical notes in accordance with the US Core Implementation Guide.
      It returns references to clinical note (HNO) records based on patient and optionally document type, status,
      encounter ID, note creation time, or associated encounter period.

      The returned data includes:
      - Document type and category
      - Document status (preliminary, final, amended, entered-in-error)
      - Document creation date
      - Document author(s) and authenticator (last signing user)
      - Content attachments with URLs to Binary resources containing the actual note content
      - Associated encounter reference
      - Context period for when the service was documented

      Common document types (LOINC codes):
      - Discharge Documentation (18842-5)
      - Consultation (11488-4)
      - History & Physical (34117-2)
      - Progress Note (11506-3)
      - Procedure Note (28570-0)
      - Emergency Department Note (34111-5)
      - Nurse Note (34746-8)
      - Discharge Instructions (74213-0)
      - Risk assessment and screening note (75492-9)

      Use this tool when you need to:
      - Access clinical notes and documentation for a patient
      - Review progress notes, discharge summaries, or consultation reports
      - Find documentation associated with a specific encounter
      - Get references to note content (use Binary resource to retrieve actual content)

      Important:
      - Either category="clinical-note" or a type (LOINC code) must be specified
      - The content is returned as references to Binary resources, not the full text
      - MyChart users must be authorized to view documents in MyChart
    `,
    inputSchema: searchDocumentReferenceParams,
    execute: (params: SearchDocumentReferenceParams) => {
      return client.searchDocumentReference(params);
    },
  });
};
