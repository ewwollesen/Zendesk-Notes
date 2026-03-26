# Org Notes - Zendesk Sidebar App

## What this is
A ZAF (Zendesk Apps Framework) sidebar app that surfaces the Organization `notes` field directly in the ticket sidebar. Agents can read and edit org-level notes (e.g., "Customer is air-gapped") without leaving the ticket view.

## How it works
- Uses the existing `notes` field on the Zendesk Organization record — no custom objects or fields
- Reads the ticket requester's org via `/api/v2/users/{id}/organizations.json`
- Saves edits via `PUT /api/v2/organizations/{id}.json`
- Shows the first org if the requester belongs to multiple

## Open question
Need to confirm with a Zendesk admin whether the org `notes` field is being populated externally (e.g., Salesforce sync). If it is, the app should be switched to use a custom organization field to avoid conflicts. Check Admin Center > Integrations for field mappings.

## Local development
```
npm install -g @zendesk/zcli
cd zendesk-org-notes
zcli apps:server
```
Then open a Zendesk ticket with `?zcli_apps=true` appended to the URL.

## Packaging for production
```
zcli apps:package
```
Upload the zip from `tmp/` via Admin Center > Apps and integrations > Upload private app.
