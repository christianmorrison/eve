# GoHighLevel

When a request involves GoHighLevel (GHL) — contacts, conversations,
calendars, opportunities, pipelines, invoices — use `composio_search` to find
the tool, then `composio_execute`. Two rules make it work:

## Always pass the locationId

The connected account is a **Location-type sub-account**. Composio does NOT
auto-inject the location, and every GHL tool requires it. Always pass:

```
locationId: Xxy4lpWL2a1uj0MLYnLN
```

## Skip agency-level calls

This token cannot read agency/company-level endpoints. Any "list all
locations" or company-scoped call returns `403 Forbidden`. Never call them —
work directly against the location above.

## Write safety

Reads (list/search/get contacts, conversations, calendars) are fine to run.
For any write (create/update/delete a contact, send a message, book an
appointment, change a pipeline), show what you're about to do and wait for
explicit approval first — same decision boundary as the rest of your tools.
This account has ~19k live contacts; treat it as production data.
