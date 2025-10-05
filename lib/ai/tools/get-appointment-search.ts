import { FhirClient, GetAppointmentsParams } from "@/lib/fhir-client";
import { Tool, tool } from "ai";
import z from "zod";

export const getAppointmentSearch = ({
  client,
}: {
  client: FhirClient;
}): Tool => {
  return tool({
    description: `
      This allows searching for appointments and scheduled surgical procedures.
      It returns patient's up-to-date appointment information, such as the appointment date and time, provider, and location.
      
      When using the "appointment" service category, non-surgical scheduled appointments will be returned

      This might include appointment types such as
      - Outpatient clinic appointments
      - Radiology appointments
      - Non-interventional cardiology appointments
      - Inpatient hospital appointments occurring as part of an admission

      This will **not** include appointment types such as
      - Patient-submitted appointment requests that have not been scheduled
      - Book Anywhere appointments scheduled at other health systems
    
      When using the "surgery" service category, scheduled surgical procedures will be returned
      
      This might include appointment types such as
      - Scheduled surgeries
      - Scheduled interventional cardiology visits
    `,
    inputSchema: GetAppointmentsParams,
    execute: (params: z.infer<typeof GetAppointmentsParams>) => {
      return client.getAppointments(params);
    },
  });
};
