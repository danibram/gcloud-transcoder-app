# Built-In Presets

The "Process Video" screen exposes two Google Cloud preset template IDs out of the box.

## `preset/web-hd`

Best for:

- general web delivery
- default operator workflow
- higher quality exports without needing custom JSON

UI label:

- `Web HD (1280x720)`

Used when:

- the user explicitly selects it
- no template is provided and the app falls back to the default template

## `preset/web-sd`

Best for:

- lighter web outputs
- lower bandwidth targets
- quick SD-grade deliveries

UI label:

- `Web SD (640x360)`

## How The App Uses Them

When a user submits a new job, the app passes the selected template ID to `gcloud transcoder jobs create --template-id=...`.

The app does not expand these presets into local JSON. They stay Google-managed presets and are treated as stable template identifiers.

## Batch Priority Options

The job creation form also exposes three batch mode priority choices:

- `10`: low priority, cheaper
- `20`: medium priority
- `30`: high priority, faster

These are convenience options in the UI and map directly to the `--batch-mode-priority` CLI flag.
