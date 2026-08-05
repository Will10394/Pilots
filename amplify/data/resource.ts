import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*
  MPN Host Mapping — shared data schema (no login required)
  ============================================================
  Three tables, mapped directly onto the fields the tool already uses:

  - Part          one row per MPN entry (the main "MPN By Host Mapping" data)
  - Manufacturer  the configurable manufacturer list (Admin > Manufacturers)
  - PilotConfig   a single record holding the current pilot's name

  Authorization is `publicApiKey()` on every model — anyone with the app's
  URL and the embedded API key can read and write, no sign-in screen. This
  is the "anyone with the link can edit" behavior, backed by a real shared
  database instead of local browser memory.
*/

const schema = a.schema({
  Part: a
    .model({
      servers: a.string().array(), // host models this part applies to, e.g. ["PowerEdge R730xd", "PowerEdge R740xd"]
      manufacturer: a.string(),
      coo: a.string(),                          // country of origin
      apn: a.string(),                          // APN (DPN)
      mpn: a.string().required(),               // MPN (PWB)
      partType: a.string(),
      description: a.string(),
      addedToEviridis: a.string(),              // "Yes" | "No" | ""
      scannableMpn: a.string(),                 // "Yes" | "No" | ""
      comment: a.string(),                       // e.g. reason it can't be added to eViridis yet
      isManual: a.boolean().default(true),      // false only for original bulk-loaded rows
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Manufacturer: a
    .model({
      name: a.string().required(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  PilotConfig: a
    .model({
      pilotName: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Backup: a
    .model({
      label: a.string().required(),       // e.g. "ReluTech Pilot — 2026-07-27"
      rowCount: a.integer(),
      data: a.string(),                    // JSON snapshot: { rows, manufacturers }
    })
    .authorization((allow) => [allow.publicApiKey()]),

  TimeEntry: a
    .model({
      label: a.string(),                   // what was being worked on
      model: a.string(),                    // host model this time was logged against
      performedBy: a.string(),              // who did the work
      timedBy: a.string(),                  // who ran the stopwatch
      durationSeconds: a.integer().required(),
      startedAt: a.string(),                // ISO timestamp
      endedAt: a.string(),                  // ISO timestamp
    })
    .authorization((allow) => [allow.publicApiKey()]),

  SerialMapping: a
    .model({
      serialNumber: a.string().required(),
      mpn: a.string(),                      // links to an MPN (PWB) value
      model: a.string(),                    // host model this serial number belongs to
      partType: a.string(),
      notes: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    // Amplify requires API keys to expire — rotate before this date by
    // redeploying. 90 days is the max in one shot; renewing is a one-line
    // config change + redeploy, not a rebuild.
    apiKeyAuthorizationMode: { expiresInDays: 90 },
  },
});
