# Specs Index

This folder documents the app from the operator point of view: what it supports directly, what it passes through to Google Cloud, and where the boundaries are.

## Read This First

- [built-in-presets.md](/Users/dbr/htdocs/st/transcoder-api-ui/docs/specs/built-in-presets.md): the presets exposed directly in the job creation form
- [template-json-support.md](/Users/dbr/htdocs/st/transcoder-api-ui/docs/specs/template-json-support.md): the template JSON shapes the app understands and displays cleanly
- [job-observability.md](/Users/dbr/htdocs/st/transcoder-api-ui/docs/specs/job-observability.md): what the dashboard and job detail view surface
- [app-configuration.md](/Users/dbr/htdocs/st/transcoder-api-ui/docs/specs/app-configuration.md): local configuration, defaults, and validation
- [limitations-and-behavior.md](/Users/dbr/htdocs/st/transcoder-api-ui/docs/specs/limitations-and-behavior.md): non-obvious behavior and current constraints

## Short Version

The app has two built-in transcoding choices and one broad advanced path:

- `preset/web-hd`
- `preset/web-sd`
- custom template JSON for everything else

That means the app is opinionated for fast common workflows, but still flexible enough to operate on richer Google Cloud Transcoder configurations when needed.
