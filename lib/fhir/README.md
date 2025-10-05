# Epic FHIR API Tool Creation Guide

This guide explains how to convert an Epic FHIR API endpoint definition from `epic_apis.json` into an AI tool definition.

## Overview

The `epic_apis.json` file contains comprehensive documentation for all Epic FHIR R4 endpoints. Each entry includes:

- HTTP method and URL template
- Request and response parameter definitions with types
- Sample requests and responses
- Usage scopes and OAuth2 support

This guide walks through converting these endpoint definitions into AI-compatible tools that can be called by the language model.

## Example: Search Appointments

Let's use the Appointment search endpoint as our reference example.

### Step 1: Locate the Endpoint in epic_apis.json

Search for the endpoint you want to implement. For appointments, look for entries with:

- `"UrlTemplate": "/api/FHIR/R4/Appointment/{ID}"` (single resource read)
- `"UrlTemplate": "/api/FHIR/R4/Appointment"` (search operation)

The structure looks like:

```json
{
  "id": "10468",
  "Data": {
    "Id": 10468,
    "Description": "",
    "HttpMethod": "GET",
    "UrlTemplate": "/api/FHIR/R4/Appointment/{ID}",
    "SupportsOAuth2": true,
    "Parameters": {
      "RequestRootType": {
        "Children": {
          "ID": {
            "Type": "String",
            "Description": "FHIR identifier for an Appointment resource.",
            "Optional": "False"
          }
        }
      },
      "ResponseRootType": { ... }
    }
  }
}
```

### Step 2: Identify the FHIR Resource Type

From the URL template, extract the resource type (e.g., `Appointment`, `Patient`, `Observation`).

For search operations, the client typically provides a generic `search()` method that accepts:

- Resource type (string)
- Search parameters (key-value pairs)

### Step 3: Define the Input Schema

Create a Zod schema for the tool's input parameters. This should include:

- Required parameters from the API definition
- Optional search filters
- Any domain-specific constraints

**Example from `lib/fhir/tools/search-appointment.ts`:**

```typescript
export const searchAppointmentParams = z.object({
  serviceCategory: z.enum(["appointment", "surgery"]).default("appointment"),
});

export type SearchAppointmentParams = z.infer<typeof searchAppointmentParams>;
```

**Naming Convention**: Use camelCase for Zod schema constants (e.g., `searchAppointmentParams`) and export a PascalCase type (e.g., `SearchAppointmentParams`) for use in function signatures.

Key considerations:

- Use TypeScript enums for fixed value sets
- Mark optional fields with `.optional()` for parameters that can be omitted
- Use `.default()` for parameters that should have a default value when omitted
- Include validation constraints (min/max, regex patterns)
- FHIR search parameters often use kebab-case (e.g., `service-category`)

### Step 4: Implement the FhirClient Method

Add a method to the `FhirClient` class that wraps the FHIR API call.

**Important**: The FhirClient method should use the type exported from the tool file. Import it from `./tools` to maintain a single source of truth.

**Example from `lib/fhir/client.ts`:**

```typescript
import type { SearchAppointmentParams } from "./tools";

async searchAppointment(params: SearchAppointmentParams) {
  let bundle = await this.search<Appointment>("Appointment", {
    patient: this.patientId,
    "service-category": params.serviceCategory,
  });
  return FhirClient.resources<Appointment>(bundle);
}
```

**Example from `lib/fhir/tools/index.ts`:**

```typescript
export * from "./search-appointment";
export * from "./read-adverse-event";
```

This pattern allows you to import any parameter schema from `./tools` in the client.

Notes:

- Use the generic `search()` method for search operations
- Use the generic `read()` method for single resource fetches
- The `search()` method returns a FHIR `Bundle`
- Use `FhirClient.resources()` to extract resource entries from bundles
- `this.patientId` is automatically extracted from the OAuth token

### Step 5: Create the AI Tool Definition

Create a new file in `lib/fhir/tools/` named after the operation (e.g., `search-appointment.ts`).

**Important**: Each tool should be in its own file within the `lib/fhir/tools/` directory.

**Example structure:**

```typescript
import { FhirClient } from "@/lib/fhir/client";
import { Tool, tool } from "ai";
import z from "zod";

export const searchAppointmentParams = z.object({
  date: z.date().nullable(),
  serviceCategory: z.enum(["appointment", "surgery"]).default("appointment"),
});

export type SearchAppointmentParams = z.infer<typeof searchAppointmentParams>;

export const searchAppointment = ({ client }: { client: FhirClient }): Tool => {
  return tool({
    description: `
      [Clear, detailed description of what this tool does]

      [What it returns]

      [Specific use cases or examples]

      [Important exclusions or limitations]
    `,
    inputSchema: searchAppointmentParams,
    execute: (params: SearchAppointmentParams) => {
      return client.searchAppointment(params);
    },
  });
};
```

### Step 5a: Write a Descriptive Tool Description

The description is critical for the AI to understand when and how to use the tool. Start with the `Description` field from the endpoint definition in `epic_apis.json`, then enhance it with additional context.

Include:

1. **Primary purpose**: What does this tool do?
2. **Return value**: What data does it provide?
3. **Use cases**: When should this tool be called?
4. **Inclusions**: What types of data are included?
5. **Exclusions**: What is NOT included?

**Example from `lib/fhir/tools/search-appointment.ts`:**

```typescript
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
```

### Step 5b: Type the Response (Optional)

If you need type safety for the response, import FHIR types:

```typescript
import type { Appointment } from "fhir/r4";
```

The `fhir` package provides comprehensive TypeScript definitions for all FHIR R4 resources.

## Common Patterns

### Search Operations

- Use `client.search<ResourceType>(resourceType, params)`
- Extract resources with `FhirClient.resources<ResourceType>(bundle)`
- Return an array of resources

### Read Operations

- Use `client.read<ResourceType>(resourceType, id)`
- Returns a single resource directly
- Include the resource ID in the input schema

### Patient-Scoped Operations

- `this.patientId` is automatically available from the OAuth token
- Always include `patient: this.patientId` in search parameters for patient-scoped resources

### Search Parameters

- FHIR search parameters use kebab-case (e.g., `service-category`, `based-on`)
- Common search parameters:
  - `_count`: Number of results per page
  - `_sort`: Sort order
  - `date`: Date filters
  - `status`: Resource status
  - `category`: Resource category

### Pagination

- For paginated results, use `client.searchAll<ResourceType>(resourceType, params)`
- This returns an async generator that automatically follows `next` links
- Use for operations that may return large result sets

## Step 6: Register the Tool in the Chat Route

After creating your tool, you need to register it in the chat route handler so the AI can use it.

**Location:** `app/(chat)/api/chat/route.ts`

1. **Import the tool function** at the top of the file with other FHIR tool imports

2. **Add to `experimental_activeTools` array** (around line 186):
   ```typescript
   experimental_activeTools:
     selectedChatModel === "chat-model-reasoning"
       ? []
       : ["searchAppointment", "searchEncounter", "yourNewTool"],
   ```

3. **Add to `tools` object** (around line 189):
   ```typescript
   tools: {
     searchAppointment: searchAppointment({ client: fhirClient }),
     searchEncounter: searchEncounter({ client: fhirClient }),
     yourNewTool: yourNewTool({ client: fhirClient }),
   },
   ```

**Note:** Tools are disabled for the reasoning model to prevent conflicts with its extended thinking process.

## Testing Your Tool

1. Add the tool to the chat route's tool registry (see Step 6 above)
2. Test with various parameter combinations
3. Verify the AI can call the tool appropriately based on the description
4. Check that error handling works for invalid parameters

## Reference Documentation

- **Epic FHIR Documentation**: <https://fhir.epic.com/>
- **FHIR R4 Specification**: <https://hl7.org/fhir/R4/>
- **AI SDK Tool Documentation**: <https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling>

## Tips

- Keep descriptions focused and practical
- Include concrete examples in the description
- Specify what's included AND excluded
- Use domain-specific language that matches the FHIR specification
- Test with the AI to ensure the description is clear enough for proper tool selection
