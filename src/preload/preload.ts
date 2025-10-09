import { contextBridge, ipcRenderer } from 'electron';

// Types
interface TranscoderJob {
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

interface GoogleCloudSettings {
    projectId: string;
    location: string;
}

interface JobTemplate {
    name: string;
    displayName?: string;
    config?: any;
    labels?: { [key: string]: string };
    createTime?: string;
    updateTime?: string;
}

interface CreateJobData {
    inputUri: string;
    outputUri: string;
    templateId?: string;
    batchModePriority?: number;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

interface PaginatedJobsResponse {
    jobs: TranscoderJob[];
    nextPageToken?: string;
    totalSize?: number;
}

interface ElectronAPI {
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

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI: ElectronAPI = {
    // Transcoder API methods
    listTranscoderJobs: (settings?: GoogleCloudSettings, pageSize?: number, pageNumber?: number) => ipcRenderer.invoke('list-transcoder-jobs', settings, pageSize, pageNumber),
    getTranscoderJob: (jobId: string, settings?: GoogleCloudSettings) => ipcRenderer.invoke('get-transcoder-job', jobId, settings),

    // Settings methods
    testGoogleCloudConnection: (settings: GoogleCloudSettings) => ipcRenderer.invoke('test-google-cloud-connection', settings),
    updateSettings: (settings: GoogleCloudSettings) => ipcRenderer.send('update-settings', settings),

    // Template methods
    listJobTemplates: (settings?: GoogleCloudSettings) => ipcRenderer.invoke('list-job-templates', settings),
    getJobTemplate: (templateId: string, settings?: GoogleCloudSettings) => ipcRenderer.invoke('get-job-template', templateId, settings),
    createJobTemplate: (template: Partial<JobTemplate>, settings?: GoogleCloudSettings) => ipcRenderer.invoke('create-job-template', template, settings),
    updateJobTemplate: (templateId: string, template: Partial<JobTemplate>, settings?: GoogleCloudSettings) => ipcRenderer.invoke('update-job-template', templateId, template, settings),
    deleteJobTemplate: (templateId: string, settings?: GoogleCloudSettings) => ipcRenderer.invoke('delete-job-template', templateId, settings),

    // Job creation methods
    createTranscoderJob: (jobData: CreateJobData, settings?: GoogleCloudSettings) => ipcRenderer.invoke('create-transcoder-job', jobData, settings),

    // Utility methods
    platform: process.platform,
    versions: process.versions
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declarations for the renderer process
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
