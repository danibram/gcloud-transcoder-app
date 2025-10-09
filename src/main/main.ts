import { exec } from 'child_process';
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { promisify } from 'util';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

// Promisify exec for async/await usage
const execAsync = promisify(exec);

// Current settings
let currentSettings: GoogleCloudSettings = {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'maximal-record-121815',
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
};

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

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// CLI wrapper functions for gcloud transcoder commands
async function listJobsCLI(settings: GoogleCloudSettings): Promise<TranscoderJob[]> {
    try {
        const command = `gcloud transcoder jobs list --location=${settings.location} --project=${settings.projectId} --format=json --limit=100`;

        console.log('Executing CLI command:', command);
        const { stdout } = await execAsync(command);

        if (!stdout.trim()) {
            return [];
        }

        const jobs = JSON.parse(stdout);

        // Transform gcloud CLI output to our format
        return jobs.map((job: any) => ({
            name: job.name || '',
            inputUri: job.config?.inputs?.[0]?.uri || '',
            outputUri: job.config?.output?.uri || '',
            state: job.state || 'UNKNOWN',
            createTime: job.createTime || '',
            startTime: job.startTime || '',
            endTime: job.endTime || '',
            ttlAfterCompletionDays: job.ttlAfterCompletionDays || 0,
            labels: job.labels || {},
            error: job.error,
            config: job.config,
        }));
    } catch (error) {
        console.error('CLI Error:', error);
        throw error;
    }
}

async function getJobCLI(jobId: string, settings: GoogleCloudSettings): Promise<TranscoderJob> {
    try {
        const command = `gcloud transcoder jobs describe ${jobId} --location=${settings.location} --project=${settings.projectId} --format=json`;

        console.log('Executing CLI command:', command);
        const { stdout } = await execAsync(command);

        const job = JSON.parse(stdout);

        return {
            name: job.name || '',
            inputUri: job.config?.inputs?.[0]?.uri || '',
            outputUri: job.config?.output?.uri || '',
            state: job.state || 'UNKNOWN',
            createTime: job.createTime || '',
            startTime: job.startTime || '',
            endTime: job.endTime || '',
            ttlAfterCompletionDays: job.ttlAfterCompletionDays || 0,
            labels: job.labels || {},
            error: job.error,
            config: job.config,
        };
    } catch (error) {
        console.error('CLI Error:', error);
        throw error;
    }
}

async function testGCloudCLI(settings: GoogleCloudSettings): Promise<void> {
    try {
        // Test basic gcloud connectivity and auth
        const authCommand = 'gcloud auth list --filter=status:ACTIVE --format="value(account)" --limit=1';
        const { stdout: authOutput } = await execAsync(authCommand);

        if (!authOutput.trim()) {
            throw new Error('No active gcloud authentication found. Please run "gcloud auth login" or "gcloud auth application-default login"');
        }

        console.log('Active gcloud account:', authOutput.trim());

        // Test transcoder API access with a minimal list command
        const testCommand = `gcloud transcoder jobs list --location=${settings.location} --project=${settings.projectId} --limit=1 --format=json`;
        await execAsync(testCommand);

        console.log('gcloud CLI test successful');
    } catch (error) {
        console.error('gcloud CLI test failed:', error);
        throw error;
    }
}

// Template CLI wrapper functions
async function listTemplatesCLI(settings: GoogleCloudSettings): Promise<JobTemplate[]> {
    try {
        const command = `gcloud transcoder templates list --location=${settings.location} --project=${settings.projectId} --format=json --limit=100`;

        console.log('Executing CLI command:', command);
        const { stdout } = await execAsync(command);

        if (!stdout.trim()) {
            return [];
        }

        const templates = JSON.parse(stdout);

        // Transform gcloud CLI output to our format
        return templates.map((template: any) => ({
            name: template.name || '',
            displayName: template.displayName || '',
            config: template.config || {},
            labels: template.labels || {},
            createTime: template.createTime || '',
            updateTime: template.updateTime || '',
        }));
    } catch (error) {
        console.error('CLI Error listing templates:', error);
        throw error;
    }
}

async function getTemplateCLI(templateId: string, settings: GoogleCloudSettings): Promise<JobTemplate> {
    try {
        const command = `gcloud transcoder templates describe ${templateId} --location=${settings.location} --project=${settings.projectId} --format=json`;

        console.log('Executing CLI command:', command);
        const { stdout } = await execAsync(command);

        const template = JSON.parse(stdout);

        return {
            name: template.name || '',
            displayName: template.displayName || '',
            config: template.config || {},
            labels: template.labels || {},
            createTime: template.createTime || '',
            updateTime: template.updateTime || '',
        };
    } catch (error) {
        console.error('CLI Error getting template:', error);
        throw error;
    }
}

async function createTemplateCLI(template: Partial<JobTemplate>, settings: GoogleCloudSettings): Promise<JobTemplate> {
    try {
        // Create a temporary file with the template configuration
        const fs = require('fs');
        const os = require('os');
        const path = require('path');

        const tempFile = path.join(os.tmpdir(), `template-${Date.now()}.json`);
        const templateConfig = {
            displayName: template.displayName || '',
            config: template.config || {},
            labels: template.labels || {}
        };

        fs.writeFileSync(tempFile, JSON.stringify(templateConfig, null, 2));

        const templateName = template.name || `template-${Date.now()}`;
        const command = `gcloud transcoder templates create ${templateName} --location=${settings.location} --project=${settings.projectId} --file=${tempFile} --format=json`;

        console.log('Executing CLI command:', command);
        const { stdout } = await execAsync(command);

        // Clean up temp file
        fs.unlinkSync(tempFile);

        const createdTemplate = JSON.parse(stdout);

        return {
            name: createdTemplate.name || '',
            displayName: createdTemplate.displayName || '',
            config: createdTemplate.config || {},
            labels: createdTemplate.labels || {},
            createTime: createdTemplate.createTime || '',
            updateTime: createdTemplate.updateTime || '',
        };
    } catch (error) {
        console.error('CLI Error creating template:', error);
        throw error;
    }
}

async function updateTemplateCLI(templateId: string, template: Partial<JobTemplate>, settings: GoogleCloudSettings): Promise<JobTemplate> {
    try {
        // For updates, we need to use patch command with specific fields
        let command = `gcloud transcoder templates update ${templateId} --location=${settings.location} --project=${settings.projectId}`;

        if (template.displayName) {
            command += ` --display-name="${template.displayName}"`;
        }

        // For complex config updates, we might need to use --file approach
        if (template.config) {
            const fs = require('fs');
            const os = require('os');
            const path = require('path');

            const tempFile = path.join(os.tmpdir(), `template-update-${Date.now()}.json`);
            fs.writeFileSync(tempFile, JSON.stringify(template.config, null, 2));
            command += ` --config-file=${tempFile}`;
        }

        command += ' --format=json';

        console.log('Executing CLI command:', command);
        const { stdout } = await execAsync(command);

        const updatedTemplate = JSON.parse(stdout);

        return {
            name: updatedTemplate.name || '',
            displayName: updatedTemplate.displayName || '',
            config: updatedTemplate.config || {},
            labels: updatedTemplate.labels || {},
            createTime: updatedTemplate.createTime || '',
            updateTime: updatedTemplate.updateTime || '',
        };
    } catch (error) {
        console.error('CLI Error updating template:', error);
        throw error;
    }
}

async function deleteTemplateCLI(templateId: string, settings: GoogleCloudSettings): Promise<void> {
    try {
        const command = `gcloud transcoder templates delete ${templateId} --location=${settings.location} --project=${settings.projectId} --quiet`;

        console.log('Executing CLI command:', command);
        await execAsync(command);

        console.log('Template deleted successfully');
    } catch (error) {
        console.error('CLI Error deleting template:', error);
        throw error;
    }
}

// Job creation CLI wrapper function
async function createJobCLI(jobData: {
    inputUri: string;
    outputUri: string;
    templateId?: string;
    batchModePriority?: number;
}, settings: GoogleCloudSettings): Promise<TranscoderJob> {
    try {
        const jobId = `job-${Date.now()}`;
        let command = `gcloud transcoder jobs create ${jobId} --location=${settings.location} --project=${settings.projectId}`;

        // Add required parameters
        command += ` --input-uri="${jobData.inputUri}"`;
        command += ` --output-uri="${jobData.outputUri}"`;

        // Add optional template
        if (jobData.templateId) {
            command += ` --template-id="${jobData.templateId}"`;
        } else {
            command += ` --template-id="preset/web-hd"`; // Default template
        }

        // Add batch mode priority if specified
        if (jobData.batchModePriority) {
            command += ` --batch-mode-priority=${jobData.batchModePriority}`;
        }

        command += ' --format=json';

        console.log('Executing CLI command:', command);
        const { stdout } = await execAsync(command);

        const createdJob = JSON.parse(stdout);

        return {
            name: createdJob.name || '',
            inputUri: jobData.inputUri,
            outputUri: jobData.outputUri,
            state: createdJob.state || 'PENDING',
            createTime: createdJob.createTime || new Date().toISOString(),
            startTime: createdJob.startTime || '',
            endTime: createdJob.endTime || '',
            ttlAfterCompletionDays: createdJob.ttlAfterCompletionDays || 0,
            labels: createdJob.labels || {},
            error: createdJob.error,
            config: createdJob.config,
        };
    } catch (error) {
        console.error('CLI Error creating job:', error);
        throw error;
    }
}

// Function to update settings
function updateTranscoderSettings(settings: GoogleCloudSettings) {
    currentSettings = { ...settings };
}

function createWindow(): void {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 600,
        icon: path.join(__dirname, '../../public/icon-512-maskable.png'), // App icon
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../preload/preload.js')
        },
        titleBarStyle: 'default',
        show: false // Don't show until ready
    });

    // Load the app
    const isDev = process.argv.includes('--dev');

    if (isDev) {
        mainWindow.loadURL('http://localhost:3001');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // Emitted when the window is closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC handlers for Google Cloud Transcoder CLI
ipcMain.handle('list-transcoder-jobs', async (event, settings?: GoogleCloudSettings): Promise<ApiResponse<TranscoderJob[]>> => {
    try {
        const useSettings = settings || currentSettings;
        console.log('Listing jobs using gcloud CLI for project:', useSettings.projectId, 'location:', useSettings.location);

        const jobs = await listJobsCLI(useSettings);
        return { success: true, data: jobs };
    } catch (error) {
        console.error('Error listing transcoder jobs via CLI:', error);

        // Provide more specific error messages for CLI
        let errorMessage = 'Failed to fetch transcoder jobs';
        if (error instanceof Error) {
            if (error.message.includes('gcloud: command not found')) {
                errorMessage = 'Google Cloud CLI (gcloud) not found. Please install the Google Cloud SDK.';
            } else if (error.message.includes('No active gcloud authentication')) {
                errorMessage = 'No active gcloud authentication. Please run "gcloud auth login" or "gcloud auth application-default login".';
            } else if (error.message.includes('PERMISSION_DENIED')) {
                errorMessage = 'Permission denied. Please check your Google Cloud credentials and API access.';
            } else if (error.message.includes('API_DISABLED')) {
                errorMessage = 'Transcoder API is not enabled. Please enable it in Google Cloud Console.';
            } else if (error.message.includes('PROJECT_NOT_FOUND')) {
                errorMessage = 'Project not found. Please check your Project ID.';
            } else if (error.message.includes('LOCATION_NOT_FOUND')) {
                errorMessage = 'Invalid location. Please check your region setting.';
            } else {
                errorMessage = `CLI Error: ${error.message}`;
            }
        }

        return {
            success: false,
            error: errorMessage
        };
    }
});

ipcMain.handle('get-transcoder-job', async (event, jobId: string, settings?: GoogleCloudSettings): Promise<ApiResponse<TranscoderJob>> => {
    try {
        const useSettings = settings || currentSettings;
        console.log('Getting job via CLI:', jobId);

        const job = await getJobCLI(jobId, useSettings);
        return { success: true, data: job };
    } catch (error) {
        console.error('Error getting transcoder job via CLI:', error);

        let errorMessage = 'Failed to fetch job details';
        if (error instanceof Error) {
            if (error.message.includes('NOT_FOUND')) {
                errorMessage = 'Job not found. Please check the job ID.';
            } else if (error.message.includes('gcloud: command not found')) {
                errorMessage = 'Google Cloud CLI (gcloud) not found. Please install the Google Cloud SDK.';
            } else {
                errorMessage = `CLI Error: ${error.message}`;
            }
        }

        return {
            success: false,
            error: errorMessage
        };
    }
});

// Settings handlers
ipcMain.handle('test-google-cloud-connection', async (event, settings: GoogleCloudSettings): Promise<ApiResponse<boolean>> => {
    try {
        console.log('Testing gcloud CLI connection...');
        await testGCloudCLI(settings);
        return { success: true, data: true };
    } catch (error) {
        console.error('Error testing gcloud CLI connection:', error);

        // Provide more specific error messages for CLI connection test
        let errorMessage = 'Failed to connect to Google Cloud via CLI';
        if (error instanceof Error) {
            if (error.message.includes('gcloud: command not found')) {
                errorMessage = 'Google Cloud CLI (gcloud) not installed. Please install the Google Cloud SDK from https://cloud.google.com/sdk/docs/install';
            } else if (error.message.includes('No active gcloud authentication')) {
                errorMessage = 'No active gcloud authentication. Please run "gcloud auth login" or "gcloud auth application-default login".';
            } else if (error.message.includes('PERMISSION_DENIED')) {
                errorMessage = 'Permission denied. Please check that your credentials have access to the Transcoder API.';
            } else if (error.message.includes('API_DISABLED')) {
                errorMessage = 'Transcoder API is not enabled. Please enable it in Google Cloud Console.';
            } else if (error.message.includes('PROJECT_NOT_FOUND')) {
                errorMessage = 'Project not found. Please check that the project exists and you have access.';
            } else {
                errorMessage = `CLI connection failed: ${error.message}`;
            }
        }

        return {
            success: false,
            error: errorMessage
        };
    }
});

// Template IPC handlers
ipcMain.handle('list-job-templates', async (event, settings?: GoogleCloudSettings): Promise<ApiResponse<JobTemplate[]>> => {
    try {
        const useSettings = settings || currentSettings;
        console.log('Listing templates using gcloud CLI for project:', useSettings.projectId, 'location:', useSettings.location);

        const templates = await listTemplatesCLI(useSettings);
        return { success: true, data: templates };
    } catch (error) {
        console.error('Error listing job templates via CLI:', error);

        let errorMessage = 'Failed to fetch job templates';
        if (error instanceof Error) {
            if (error.message.includes('gcloud: command not found')) {
                errorMessage = 'Google Cloud CLI (gcloud) not found. Please install the Google Cloud SDK.';
            } else if (error.message.includes('No active gcloud authentication')) {
                errorMessage = 'No active gcloud authentication. Please run "gcloud auth login".';
            } else if (error.message.includes('PERMISSION_DENIED')) {
                errorMessage = 'Permission denied. Please check your Google Cloud credentials and API access.';
            } else if (error.message.includes('API_DISABLED')) {
                errorMessage = 'Transcoder API is not enabled. Please enable it in Google Cloud Console.';
            } else {
                errorMessage = `CLI Error: ${error.message}`;
            }
        }

        return {
            success: false,
            error: errorMessage
        };
    }
});

ipcMain.handle('get-job-template', async (event, templateId: string, settings?: GoogleCloudSettings): Promise<ApiResponse<JobTemplate>> => {
    try {
        const useSettings = settings || currentSettings;
        console.log('Getting template via CLI:', templateId);

        const template = await getTemplateCLI(templateId, useSettings);
        return { success: true, data: template };
    } catch (error) {
        console.error('Error getting job template via CLI:', error);

        let errorMessage = 'Failed to fetch template details';
        if (error instanceof Error) {
            if (error.message.includes('NOT_FOUND')) {
                errorMessage = 'Template not found. Please check the template ID.';
            } else if (error.message.includes('gcloud: command not found')) {
                errorMessage = 'Google Cloud CLI (gcloud) not found. Please install the Google Cloud SDK.';
            } else {
                errorMessage = `CLI Error: ${error.message}`;
            }
        }

        return {
            success: false,
            error: errorMessage
        };
    }
});

ipcMain.handle('create-job-template', async (event, template: Partial<JobTemplate>, settings?: GoogleCloudSettings): Promise<ApiResponse<JobTemplate>> => {
    try {
        const useSettings = settings || currentSettings;
        console.log('Creating template via CLI:', template.name);

        const createdTemplate = await createTemplateCLI(template, useSettings);
        return { success: true, data: createdTemplate };
    } catch (error) {
        console.error('Error creating job template via CLI:', error);

        let errorMessage = 'Failed to create template';
        if (error instanceof Error) {
            if (error.message.includes('ALREADY_EXISTS')) {
                errorMessage = 'Template with this name already exists. Please choose a different name.';
            } else if (error.message.includes('INVALID_ARGUMENT')) {
                errorMessage = 'Invalid template configuration. Please check your settings.';
            } else {
                errorMessage = `CLI Error: ${error.message}`;
            }
        }

        return {
            success: false,
            error: errorMessage
        };
    }
});

ipcMain.handle('update-job-template', async (event, templateId: string, template: Partial<JobTemplate>, settings?: GoogleCloudSettings): Promise<ApiResponse<JobTemplate>> => {
    try {
        const useSettings = settings || currentSettings;
        console.log('Updating template via CLI:', templateId);

        const updatedTemplate = await updateTemplateCLI(templateId, template, useSettings);
        return { success: true, data: updatedTemplate };
    } catch (error) {
        console.error('Error updating job template via CLI:', error);

        let errorMessage = 'Failed to update template';
        if (error instanceof Error) {
            if (error.message.includes('NOT_FOUND')) {
                errorMessage = 'Template not found. Please check the template ID.';
            } else if (error.message.includes('INVALID_ARGUMENT')) {
                errorMessage = 'Invalid template configuration. Please check your settings.';
            } else {
                errorMessage = `CLI Error: ${error.message}`;
            }
        }

        return {
            success: false,
            error: errorMessage
        };
    }
});

ipcMain.handle('delete-job-template', async (event, templateId: string, settings?: GoogleCloudSettings): Promise<ApiResponse<boolean>> => {
    try {
        const useSettings = settings || currentSettings;
        console.log('Deleting template via CLI:', templateId);

        await deleteTemplateCLI(templateId, useSettings);
        return { success: true, data: true };
    } catch (error) {
        console.error('Error deleting job template via CLI:', error);

        let errorMessage = 'Failed to delete template';
        if (error instanceof Error) {
            if (error.message.includes('NOT_FOUND')) {
                errorMessage = 'Template not found. Please check the template ID.';
            } else if (error.message.includes('FAILED_PRECONDITION')) {
                errorMessage = 'Cannot delete template. It may be in use by active jobs.';
            } else {
                errorMessage = `CLI Error: ${error.message}`;
            }
        }

        return {
            success: false,
            error: errorMessage
        };
    }
});

// Job creation IPC handler
ipcMain.handle('create-transcoder-job', async (event, jobData: {
    inputUri: string;
    outputUri: string;
    templateId?: string;
    batchModePriority?: number;
}, settings?: GoogleCloudSettings): Promise<ApiResponse<TranscoderJob>> => {
    try {
        const useSettings = settings || currentSettings;
        console.log('Creating transcoder job via CLI:', jobData);

        const createdJob = await createJobCLI(jobData, useSettings);
        return { success: true, data: createdJob };
    } catch (error) {
        console.error('Error creating transcoder job via CLI:', error);

        let errorMessage = 'Failed to create transcoder job';
        if (error instanceof Error) {
            if (error.message.includes('INVALID_ARGUMENT')) {
                errorMessage = 'Invalid job configuration. Please check your input/output URIs and template.';
            } else if (error.message.includes('PERMISSION_DENIED')) {
                errorMessage = 'Permission denied. Please check your Google Cloud credentials and bucket access.';
            } else if (error.message.includes('NOT_FOUND')) {
                errorMessage = 'Template or bucket not found. Please verify your template ID and bucket paths.';
            } else if (error.message.includes('ALREADY_EXISTS')) {
                errorMessage = 'Job with this ID already exists. Please try again.';
            } else {
                errorMessage = `CLI Error: ${error.message}`;
            }
        }

        return {
            success: false,
            error: errorMessage
        };
    }
});

ipcMain.on('update-settings', (event, settings: GoogleCloudSettings) => {
    updateTranscoderSettings(settings);
});

// Handle app protocol for better security
app.setAsDefaultProtocolClient('transcoder-api');
