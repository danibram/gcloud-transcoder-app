# Contributing

This project is a Tauri desktop app with a Rust backend and a SolidJS frontend. Keep changes scoped, tested, and consistent with the current architecture.

## Prerequisites

- Rust stable
- Node.js 20+
- npm 10+
- `gcloud` CLI installed
- A Google Cloud account with Transcoder API access for manual testing

## Setup

```bash
git clone https://github.com/<your-org-or-user>/transcoder-api-ui.git
cd transcoder-api-ui
npm --prefix ui install
```

Authenticate locally before testing app flows that hit Google Cloud:

```bash
gcloud auth login
gcloud auth application-default login
```

## Development Commands

Start the desktop app:

```bash
cargo tauri dev --manifest-path src-tauri/Cargo.toml
```

Run Rust tests:

```bash
cargo test
```

Run frontend tests:

```bash
npm --prefix ui run test
```

Build the frontend:

```bash
npm --prefix ui run build
```

Build the desktop app:

```bash
cargo tauri build --manifest-path src-tauri/Cargo.toml
```

## Repository Layout

```text
src/         Rust domain logic, storage, and gcloud adapters
src-tauri/   Tauri shell and command wiring
ui/          SolidJS application
```

## Guidelines

- Keep Google Cloud credentials out of the repository. The app is designed to use the local `gcloud` session.
- Add or update tests when changing Rust services, command wiring, or UI behavior.
- Prefer small, reviewable pull requests with clear behavior changes.
- Update `README.md` or this file when the development workflow changes.

## Pull Requests

Include:

- A short problem statement
- A concise summary of the change
- Test coverage or manual verification notes
- Screenshots for visible UI changes

## Reporting Issues

Useful bug reports include:

- OS and version
- Rust, Node.js, and npm versions
- `gcloud` version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Relevant logs or screenshots
