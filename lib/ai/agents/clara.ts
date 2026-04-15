import { Experimental_Agent as Agent, stepCountIs } from "ai";
import { isProductionEnvironment } from "@/lib/constants";
import { FhirClient } from "@/lib/fhir/client";
import {
  readAdverseEvent,
  searchAppointment,
  searchDocumentReference,
  searchEncounter,
} from "@/lib/fhir/tools";
import { regularPrompt } from "@/lib/ai/prompts";

export const createAgent = ({ client }: { client: FhirClient }) => {
  return new Agent({
    model: "openai/gpt-5-nano",
    system: regularPrompt,
    tools: {
      searchAppointment: searchAppointment({ client }),
      searchEncounter: searchEncounter({ client }),
      searchDocumentReference: searchDocumentReference({
        client,
      }),
      readAdverseEvent: readAdverseEvent({ client }),
    },
    stopWhen: stepCountIs(10),
    experimental_telemetry: {
      isEnabled: isProductionEnvironment,
      functionId: "stream-text",
    },
  });
};
