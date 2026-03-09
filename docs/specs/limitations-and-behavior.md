# Limitations And Behavior

These are the important edges to know before relying on the app operationally.

## Template Updates Are Replace Operations

Google Cloud Transcoder does not provide a direct in-place template update path in this app.

Editing a template performs:

1. delete existing template
2. recreate template with the same name

If recreation fails after deletion, the original template is already gone. The UI warns about this before continuing.

## No Rich Visual Template Builder

Template authoring is currently JSON-first. That gives power users full access to Google Cloud template structure, but it is less guided than a form-based builder.

## Manual Refresh Model

The dashboard does not auto-refresh jobs. Refresh is manual by design.

## Pagination Strategy

The backend fetches up to a capped number of jobs and paginates locally in the app service layer.

Current cap:

- `200` jobs fetched from `gcloud`

For most operator workflows that is fine, but it is not infinite history browsing.

## Search Strategy

Search is URI-focused and currently targets:

- `config.inputs.uri`
- `config.output.uri`

It is useful for locating jobs by bucket path, but it is not a full-text search over every job field.

## Display Name Caveat

The templates UI includes a display name field in the form, but the app itself notes that the Google Cloud Transcoder API does not support display names for templates in this flow.

Treat template ID as the real durable identifier.
