export interface TranscoderJob {
  name: string;
  inputUri?: string;
  outputUri?: string;
  state?: string;
  createTime?: string;
  startTime?: string;
  endTime?: string;
  ttlAfterCompletionDays?: number;
  labels?: Record<string, string>;
  error?: unknown;
  config?: any;
}

export interface GoogleCloudSettings {
  projectId: string;
  location: string;
}

export interface AppConfig {
  version: number;
  googleCloud: GoogleCloudSettings;
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

export interface JobTemplate {
  name: string;
  displayName?: string | null;
  config?: {
    inputs?: Array<{
      key?: string;
      uri?: string;
    }>;
    editList?: Array<{
      key?: string;
      inputs?: string[];
      startTimeOffset?: string;
      endTimeOffset?: string;
    }>;
    elementaryStreams?: Array<{
      key?: string;
      videoStream?: {
        h264?: {
          heightPixels?: number;
          widthPixels?: number;
          frameRate?: number;
          bitrateBps?: number;
          pixelFormat?: string;
          rateControlMode?: string;
          crfLevel?: number;
          allowOpenGop?: boolean;
          gopFrameCount?: number;
          gopDuration?: string;
          enableTwoPass?: boolean;
          vbvSizeBits?: number;
          vbvFullnessBits?: number;
          entropyCoder?: string;
          bPyramid?: boolean;
          bFrameCount?: number;
          aqStrength?: number;
          profile?: string;
          tune?: string;
          preset?: string;
        };
      };
      audioStream?: {
        codec?: string;
        bitrateBps?: number;
        channelCount?: number;
        channelLayout?: string[];
        sampleRateHertz?: number;
      };
    }>;
    muxStreams?: Array<{
      key?: string;
      container?: string;
      fileName?: string;
      elementaryStreams?: string[];
      segmentSettings?: {
        segmentDuration?: string;
        individualSegments?: boolean;
      };
    }>;
    output?: {
      uri?: string;
    };
    adBreaks?: Array<{
      startTimeOffset?: string;
    }>;
    pubsubDestination?: {
      topic?: string;
    };
    spriteSheets?: Array<{
      format?: string;
      filePrefix?: string;
      spriteWidthPixels?: number;
      spriteHeightPixels?: number;
      columnCount?: number;
      rowCount?: number;
      totalCount?: number;
      interval?: string;
      quality?: number;
    }>;
    overlays?: Array<{
      image?: {
        uri?: string;
        resolution?: {
          x?: number;
          y?: number;
        };
        alpha?: number;
      };
      animations?: Array<{
        animationType?: string;
        animationStatic?: {
          xy?: {
            x?: number;
            y?: number;
          };
          startTimeOffset?: string;
        };
        animationFade?: {
          fadeType?: string;
          xy?: {
            x?: number;
            y?: number;
          };
          startTimeOffset?: string;
          endTimeOffset?: string;
        };
        animationEnd?: {
          startTimeOffset?: string;
        };
      }>;
    }>;
  };
  labels?: Record<string, string>;
  createTime?: string;
  updateTime?: string;
}

export interface PaginatedJobsResponse {
  jobs: TranscoderJob[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface CreateJobData {
  inputUri: string;
  outputUri: string;
  templateId?: string;
  batchModePriority?: number;
}

export interface OpResult {
  ok: boolean;
  message: string;
}

export type JobState = 'succeeded' | 'failed' | 'running' | 'pending' | 'unknown';
