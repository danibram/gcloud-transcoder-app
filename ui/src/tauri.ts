import { invoke } from '@tauri-apps/api/core';
import type {
  AppConfig,
  ConnectionTestResult,
  CreateJobData,
  GoogleCloudSettings,
  JobTemplate,
  OpResult,
  PaginatedJobsResponse,
  TranscoderJob,
} from './types';

export const api = {
  settingsGet: () => invoke<AppConfig>('settings_get'),
  settingsUpdate: (settings: GoogleCloudSettings) =>
    invoke<AppConfig>('settings_update', { settings }),
  settingsTestConnection: (candidate: GoogleCloudSettings) =>
    invoke<ConnectionTestResult>('settings_test_connection', { candidate }),
  jobsList: (input: {
    pageSize: number;
    pageNumber: number;
    searchTerm?: string;
  }) =>
    invoke<PaginatedJobsResponse>('jobs_list', {
      pageSize: input.pageSize,
      pageNumber: input.pageNumber,
      searchTerm: input.searchTerm?.trim() ? input.searchTerm : null,
    }),
  jobGet: (jobId: string) => invoke<TranscoderJob>('job_get', { jobId }),
  templatesList: () => invoke<JobTemplate[]>('templates_list'),
  templateGet: (templateId: string) =>
    invoke<JobTemplate>('template_get', { templateId }),
  templateCreate: (input: Partial<JobTemplate>) =>
    invoke<JobTemplate>('template_create', {
      input: normalizeTemplateInput(input),
    }),
  templateUpdateReplace: (templateId: string, input: Partial<JobTemplate>) =>
    invoke<JobTemplate>('template_update_replace', {
      templateId,
      input: normalizeTemplateInput(input),
    }),
  templateDelete: (templateId: string) =>
    invoke<OpResult>('template_delete', { templateId }),
  jobCreate: (input: CreateJobData) =>
    invoke<TranscoderJob>('job_create', { input }),
};

function normalizeTemplateInput(input: Partial<JobTemplate>) {
  return {
    name: input.name ?? '',
    displayName: input.displayName ?? null,
    config: input.config ?? {},
    labels: input.labels ?? {},
  };
}
