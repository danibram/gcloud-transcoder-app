# Job Observability

The dashboard is designed for operators, not just developers.

## Dashboard View

The main jobs table supports:

- manual refresh
- pagination
- page size selection
- URI search
- quick status scanning

Search currently filters against:

- input URI
- output URI

## Statuses

The UI visually distinguishes these common states:

- `SUCCEEDED`
- `RUNNING`
- `PENDING`
- `FAILED`

Anything else is treated as an unknown or generic state and still displayed.

## Job Detail View

When a job is opened, the modal can show:

- job ID
- status badge
- input URI
- output URI
- processed video files derived from mux streams
- `gs://` storage URLs
- public `https://storage.googleapis.com/...` URLs
- creation and timing metadata
- raw config/debug payloads for advanced inspection

## Output File Discovery

The app builds the processed file list primarily from:

- `job.config.muxStreams`
- `job.config.output.uri`

If no mux streams are present but an output URI exists, the UI falls back to a simple default `output.mp4` assumption for display purposes.

That fallback is a convenience for operators, not a guarantee about the actual emitted file name.
