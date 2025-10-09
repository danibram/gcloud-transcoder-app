export interface TranscoderJob {
    name: string;
    inputUri?: string;
    outputUri?: string;
    state?: string;
    createTime?: string;
    startTime?: string;
    endTime?: string;
    ttlAfterCompletionDays?: number;
    labels?: { [key: string]: string };
    error?: any;
    config?: any;
}

export interface GoogleCloudSettings {
    projectId: string;
    location: string;
}

export interface JobTemplate {
    name: string;
    displayName?: string;
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
    labels?: { [key: string]: string };
    createTime?: string;
    updateTime?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface PaginatedJobsResponse {
    jobs: TranscoderJob[];
    nextPageToken?: string;
    totalSize?: number;
}

// FileSelectResponse no longer needed for CLI mode

export type JobState = 'succeeded' | 'failed' | 'running' | 'pending' | 'unknown';

export interface CreateJobData {
    inputUri: string;
    outputUri: string;
    templateId?: string;
    batchModePriority?: number;
}

export interface ElectronAPI {
    listTranscoderJobs: (settings?: GoogleCloudSettings, pageSize?: number, pageNumber?: number) => Promise<ApiResponse<PaginatedJobsResponse>>;
    getTranscoderJob: (jobId: string, settings?: GoogleCloudSettings) => Promise<ApiResponse<TranscoderJob>>;
    testGoogleCloudConnection: (settings: GoogleCloudSettings) => Promise<ApiResponse<boolean>>;
    updateSettings: (settings: GoogleCloudSettings) => void;

    // Template operations
    listJobTemplates: (settings?: GoogleCloudSettings) => Promise<ApiResponse<JobTemplate[]>>;
    getJobTemplate: (templateId: string, settings?: GoogleCloudSettings) => Promise<ApiResponse<JobTemplate>>;
    createJobTemplate: (template: Partial<JobTemplate>, settings?: GoogleCloudSettings) => Promise<ApiResponse<JobTemplate>>;
    updateJobTemplate: (templateId: string, template: Partial<JobTemplate>, settings?: GoogleCloudSettings) => Promise<ApiResponse<JobTemplate>>;
    deleteJobTemplate: (templateId: string, settings?: GoogleCloudSettings) => Promise<ApiResponse<boolean>>;

    // Job creation
    createTranscoderJob: (jobData: CreateJobData, settings?: GoogleCloudSettings) => Promise<ApiResponse<TranscoderJob>>;

    platform: string;
    versions: NodeJS.ProcessVersions;
}

// Extend Window interface for ElectronAPI
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
