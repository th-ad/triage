// epic-pull.ts
// Run: EPIC_COOKIE="ASP.NET_SessionId=..." npx tsx epic-pull.ts

import ky from "ky";
import fs from "node:fs/promises";

const IDS = [
  "981",
  "982",
  "946",
  "947",
  "10468",
  "10471",
  "10469",
  "10478",
  "1044",
  "10308",
  "10231",
  "10139",
  "10996",
  "10230",
  "10533",
  "10551",
  "10556",
  "10554",
  "10997",
  "10562",
  "10305",
  "1066",
  "10043",
  "1064",
  "10073",
  "10309",
  "1067",
  "10044",
  "1065",
  "10074",
  "10154",
  "1068",
  "10155",
  "1069",
  "10302",
  "951",
  "10187",
  "10314",
  "953",
  "10208",
  "10439",
  "988",
  "10440",
  "989",
  "1047",
  "1048",
  "908",
  "909",
  "10158",
  "10159",
  "10146",
  "10150",
  "10148",
  "10152",
  "10105",
  "10520",
  "10144",
  "10147",
  "10151",
  "10149",
  "10153",
  "10104",
  "10519",
  "10145",
  "10079",
  "10647",
  "10212",
  "10646",
  "10217",
  "998",
  "965",
  "967",
  "999",
  "970",
  "972",
  "929",
  "10083",
  "931",
  "932",
  "975",
  "10041",
  "976",
  "10042",
];

const BASE = "https://fhir.epic.com/Specifications/Api?id=";

async function fetchOne(id: string) {
  const maxAttempts = 4;
  let lastErr: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ky
        .get(BASE + encodeURIComponent(id), {
          timeout: 20000,
          headers: {
            accept: "application/json,text/plain,*/*",
            "user-agent": "epic-pull/1.0 (+script)",
            cookie: process.env.EPIC_COOKIE ?? "",
          },
          retry: 0,
        })
        .json<any>();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  throw new Error(`Failed for ID ${id}: ${lastErr?.message || lastErr}`);
}

async function main() {
  const all: any[] = [];

  for (const id of IDS) {
    console.log("Fetching", id);
    const obj = await fetchOne(id);
    all.push({ id, ...obj });
  }

  await fs.writeFile("epic_apis.json", JSON.stringify(all, null, 2), "utf8");
  console.log("Wrote epic_apis.json with", all.length, "records");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
