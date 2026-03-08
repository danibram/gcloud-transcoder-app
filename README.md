# Transcoder API Dashboard

Desktop application for browsing and managing Google Cloud Video Transcoder jobs through a native Tauri shell.

## Overview

The app combines:

- A Tauri v2 desktop shell in [`src-tauri/`](./src-tauri)
- A Rust core crate in [`src/`](./src)
- A SolidJS frontend in [`ui/`](./ui)
- Google Cloud integration through the `gcloud` CLI instead of embedded service-account keys

## Features

- Browse transcoder jobs with pagination and URI search
- Inspect full job metadata and debug payloads
- Validate and persist Google Cloud project/location settings
- List, create, replace, and delete job templates
- Create new transcoding jobs from the desktop UI

## Requirements

- Rust stable
- Node.js 20+
- npm 10+
- `gcloud` CLI installed and available on `PATH`
- An authenticated Google Cloud session with access to the Transcoder API

## Authentication

This repository does not ship credentials. The app shells out to `gcloud`, so authentication is handled by your local Google Cloud CLI session.

Examples:

```bash
gcloud auth login
gcloud auth application-default login
```

## Local Development

Install frontend dependencies:

```bash
npm --prefix ui install
```

Run the desktop app in development:

```bash
cargo tauri dev --manifest-path src-tauri/Cargo.toml
```

Build the frontend only:

```bash
npm --prefix ui run build
```

Build the desktop app:

```bash
cargo tauri build --manifest-path src-tauri/Cargo.toml
```

## Testing

Run the Rust tests:

```bash
cargo test
```

Run the frontend tests:

```bash
npm --prefix ui run test
```

## Configuration Storage

Application settings are stored in the native user config directory under `transcoder-api-dashboard/config.json`.

Stored shape:

```json
{
  "version": 1,
  "googleCloud": {
    "projectId": "",
    "location": "us-central1"
  }
}
```

Behavior:

- Missing config creates defaults.
- Corrupt config is renamed to `config.corrupt.<timestamp>.json` and recreated.
- Older config versions are backed up to `config.json.bak` before migration.

## Project Layout

```text
.
├── src/         Rust domain logic and gcloud integration
├── src-tauri/   Tauri desktop shell
└── ui/          SolidJS frontend
```

## License

MIT. See [`LICENSE`](./LICENSE).
