# Template JSON Support

Custom templates are the advanced mode of the app.

The Templates screen lets operators create or replace a Google Cloud Transcoder job template by pasting JSON config. The app stores nothing proprietary about that config locally beyond what Google Cloud returns for the template itself.

## Important Model

The app is not a full visual template builder.

Instead, it supports custom specs like this:

- you provide template JSON
- the app sends it to `gcloud`
- the app can list, view, and reuse that template later

## Supported Template Areas

The frontend and Rust model explicitly account for these config sections:

- `inputs`
- `editList`
- `elementaryStreams`
- `muxStreams`
- `output`
- `adBreaks`
- `pubsubDestination`
- `spriteSheets`
- `overlays`
- `labels`

## Fields The UI Knows About

### Inputs

- input `key`
- input `uri`

Use this to point a template at one or more source assets.

### Edit List

- edit `key`
- source input references
- `startTimeOffset`
- `endTimeOffset`

Use this for trims or segment selection.

### Elementary Streams

Supported elementary stream families in the type model:

- video streams
- audio streams

Supported video sub-shape:

- `videoStream.h264`

Known H.264 fields surfaced by the app model:

- `heightPixels`
- `widthPixels`
- `frameRate`
- `bitrateBps`
- `pixelFormat`
- `rateControlMode`
- `crfLevel`
- `allowOpenGop`
- `gopFrameCount`
- `gopDuration`
- `enableTwoPass`
- `vbvSizeBits`
- `vbvFullnessBits`
- `entropyCoder`
- `bPyramid`
- `bFrameCount`
- `aqStrength`
- `profile`
- `tune`
- `preset`

Known audio fields surfaced by the app model:

- `codec`
- `bitrateBps`
- `channelCount`
- `channelLayout`
- `sampleRateHertz`

### Mux Streams

- `key`
- `container`
- `fileName`
- linked `elementaryStreams`
- `segmentSettings.segmentDuration`
- `segmentSettings.individualSegments`

This is also the most important section for the job detail screen, because output files are inferred from `muxStreams`.

### Output

- `output.uri`

The app uses this to show where processed assets are written.

### Ad Breaks

- `startTimeOffset`

### Pub/Sub Destination

- `topic`

### Sprite Sheets

- `format`
- `filePrefix`
- `spriteWidthPixels`
- `spriteHeightPixels`
- `columnCount`
- `rowCount`
- `totalCount`
- `interval`
- `quality`

### Overlays

Supported overlay areas:

- overlay image source
- overlay resolution
- overlay alpha
- static placement animation
- fade animation
- animation end timing

Known overlay animation fields:

- `animationType`
- `animationStatic.xy`
- `animationStatic.startTimeOffset`
- `animationFade.fadeType`
- `animationFade.xy`
- `animationFade.startTimeOffset`
- `animationFade.endTimeOffset`
- `animationEnd.startTimeOffset`

## What "Support" Means Here

Support in this app means one or more of these:

- the TypeScript model knows the field
- the JSON can be viewed and edited in the Templates screen
- the returned job/template can be displayed without the UI breaking
- output discovery in the Job Details modal can use the config

It does not mean the app validates every Google Cloud Transcoder rule locally.

Google Cloud remains the source of truth for whether a template is valid.

## Current Editing Experience

Template editing is raw JSON in a textarea. That is intentional for now: it keeps the full Google Cloud shape available without forcing the app to own a partial or lossy visual schema editor.
