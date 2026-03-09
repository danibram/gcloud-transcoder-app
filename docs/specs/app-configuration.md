# App Configuration

The app persists a small local config file for connection settings.

## Stored Values

- config `version`
- Google Cloud `projectId`
- Google Cloud `location`

Default location:

- `us-central1`

## Environment Defaults

If present, the app can initialize defaults from environment variables:

- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_LOCATION`

## Validation Rules

Current validation is intentionally light:

- config version must be greater than zero
- location must not be empty

## Storage Behavior

When configuration is missing:

- the app creates a default config

When configuration is corrupt:

- the app renames it with a `config.corrupt.<timestamp>.json` pattern
- the app recreates a fresh config

When configuration version changes:

- the old config is backed up to `config.json.bak`

## Connection Strategy

The app does not store Google credentials.

Instead it verifies:

- an active `gcloud` login exists
- the configured project and location can be used to list Transcoder jobs
