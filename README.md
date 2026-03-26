# Zendesk Org Notes

A lightweight Zendesk sidebar app that displays organization notes directly in the ticket view. Agents can quickly see and edit important customer context (e.g., "Customer is air-gapped", "Cannot send logs") without navigating to the organization profile.

## Setup

Requires the [Zendesk CLI](https://developer.zendesk.com/documentation/apps/getting-started/using-zcli/):

```
npm install -g @zendesk/zcli
zcli apps:server
```

Then open a ticket in Zendesk with `?zcli_apps=true` appended to the URL to test locally.

To deploy, run `zcli apps:package` and upload via Admin Center.
