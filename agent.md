# Transcoder API Desktop Application - Agent Specification

## 📋 Project Overview

**Project Name:** Transcoder API Desktop Application
**Version:** 1.0.0
**Type:** Electron Desktop Application
**Purpose:** Monitor and manage Google Cloud Video Transcoder API jobs through a native desktop interface

## 🏗️ Architecture

### Technology Stack

#### Core Framework
- **Electron** `^27.0.0` - Desktop application framework
- **TypeScript** `^5.2.2` - Type-safe JavaScript development
- **Node.js** `18.17.1+` - Runtime environment

#### Frontend Framework
- **SolidJS** `^1.8.0` - Reactive UI framework
- **Vite** `^4.4.9` - Build tool and dev server
- **vite-plugin-solid** `^2.7.0` - SolidJS integration for Vite

#### Styling
- **Tailwind CSS** `^3.3.3` - Utility-first CSS framework
- **PostCSS** `^8.4.31` - CSS processing
- **Autoprefixer** `^10.4.16` - CSS vendor prefixes

#### Google Cloud Integration
- **@google-cloud/video-transcoder** `^4.4.0` - Google Cloud Transcoder API client

#### Development Tools
- **ESLint** `^8.50.0` - Code linting
- **@typescript-eslint/parser** `^6.7.0` - TypeScript ESLint parser
- **@typescript-eslint/eslint-plugin** `^6.7.0` - TypeScript ESLint rules
- **@types/electron** - TypeScript definitions for Electron
- **Concurrently** `^8.2.2` - Run multiple commands simultaneously
- **Electron Builder** `^24.6.4` - Application packaging and distribution

## 📁 Project Structure

```
transcoder-api-ui/
├── scripts/
│   └── dev.js                    # Custom development script
├── src/
│   ├── main/
│   │   └── main.ts                 # Electron main process
│   ├── preload/
│   │   └── preload.ts             # IPC bridge (secure communication)
│   └── renderer/
│       ├── index.html             # HTML entry point
│       └── src/
│           ├── main.tsx           # SolidJS entry point
│           ├── App.tsx            # Main application component
│           ├── index.css          # Tailwind CSS imports
│           ├── types.ts           # TypeScript type definitions
│           └── components/
│               ├── Header.tsx     # Application header
│               ├── Dashboard.tsx  # Dashboard overview
│               ├── JobsTable.tsx  # Jobs table component
│               ├── JobModal.tsx   # Job details modal
│               ├── Icons.tsx      # SVG icon components
│               └── ErrorBoundary.tsx # Error handling
├── .vscode/
│   └── settings.json             # VS Code configuration
├── dist/                          # Build output directory
│   ├── main/
│   │   └── main.js               # Compiled main process
│   ├── preload/
│   │   └── preload.js            # Compiled preload script
│   └── renderer/                 # Vite build output
├── package.json                   # Project configuration
├── tsconfig.json                  # TypeScript config (renderer)
├── tsconfig.main.json            # TypeScript config (main process)
├── tsconfig.node.json            # TypeScript config (build tools)
├── vite.config.ts                # Vite configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── .eslintrc.js                  # ESLint configuration
├── .gitignore                    # Git ignore rules
├── README.md                     # Project documentation
├── SETUP.md                      # Setup and troubleshooting guide
└── agent.md                      # This specification file
```

## 🔧 Configuration Files

### TypeScript Configuration

#### `tsconfig.json` (Renderer Process)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/renderer/**/*"]
}
```

#### `tsconfig.main.json` (Main Process)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "strict": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/main/**/*", "src/preload/**/*"]
}
```

### Vite Configuration
```typescript
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import path from 'path';

export default defineConfig({
  plugins: [solid()],
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
  },
});
```

### Tailwind Configuration
```javascript
export default {
  content: ["./src/renderer/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
    },
  },
};
```

## 🚀 Scripts and Commands

### Development
```bash
npm run dev                    # Start development (recommended - uses custom script)
npm run dev:concurrent         # Alternative concurrent approach
npm run dev:renderer          # Start Vite dev server (port 3000)
npm run dev:main              # Build and start Electron main process
npm run dev:main:watch        # Watch mode for main process TypeScript
```

### Building
```bash
npm run build                 # Build both renderer and main process
npm run build:renderer        # Build renderer with Vite
npm run build:main           # Compile main process TypeScript
```

### Production
```bash
npm start                     # Build and start production app
npm run dist                  # Build and package for current platform
npm run dist:all             # Build and package for all platforms
```

### Development Tools
```bash
npm run clean                 # Clean dist directory
npm run type-check           # TypeScript type checking
npm run lint                 # ESLint code linting
```

## 🔌 IPC Communication

### Main Process → Renderer
The main process exposes secure APIs through the preload script:

```typescript
// Available in renderer via window.electronAPI
interface ElectronAPI {
  listTranscoderJobs: () => Promise<ApiResponse<TranscoderJob[]>>;
  getTranscoderJob: (jobId: string) => Promise<ApiResponse<TranscoderJob>>;
  platform: string;
  versions: NodeJS.ProcessVersions;
}
```

### Security Model
- **Context Isolation:** Enabled for security
- **Node Integration:** Disabled in renderer
- **Preload Script:** Secure bridge between main and renderer processes

## 📊 Data Models

### TranscoderJob Interface
```typescript
interface TranscoderJob {
  name: string;                    // Full job resource name
  inputUri?: string;              // Input video URI
  outputUri?: string;             // Output video URI
  state?: string;                 // Job processing state
  createTime?: string;            // ISO timestamp
  startTime?: string;             // ISO timestamp
  endTime?: string;               // ISO timestamp
  ttlAfterCompletionDays?: number; // Time to live
  labels?: { [key: string]: string }; // Custom labels
  error?: any;                    // Error details if failed
  config?: any;                   // Job configuration
}
```

### API Response Interface
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Job States
```typescript
type JobState = 'succeeded' | 'failed' | 'running' | 'pending' | 'unknown';
```

## 🎨 UI Components

### Component Hierarchy
```
App
├── ErrorBoundary
├── Header
├── Dashboard
├── JobsTable
└── JobModal
```

### Component Specifications

#### Header Component
- **Purpose:** Application title and refresh functionality
- **Props:** `onRefresh: () => void`, `isLoading: boolean`
- **Features:** Animated refresh button, gradient app icon

#### Dashboard Component
- **Purpose:** Overview section with status legend
- **Props:** None
- **Features:** Status indicators for different job states

#### JobsTable Component
- **Purpose:** Display jobs in tabular format
- **Props:** `jobs`, `isLoading`, `error`, `onJobClick`, `onRefresh`
- **Features:** Sortable columns, clickable rows, loading states, error handling

#### JobModal Component
- **Purpose:** Detailed job information in modal overlay
- **Props:** `job`, `isOpen`, `onClose`
- **Features:** Escape key handling, click-outside-to-close, detailed job info sections

#### ErrorBoundary Component
- **Purpose:** Catch and display React errors gracefully
- **Features:** Error details, retry functionality

## 🔐 Authentication & Environment

### Environment Variables
```bash
# Required
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Optional (defaults provided)
GOOGLE_CLOUD_LOCATION=us-central1

# Authentication (choose one)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
# OR use Application Default Credentials via gcloud CLI
```

### Authentication Methods

#### Method 1: Application Default Credentials (Recommended)
```bash
gcloud auth application-default login
```

#### Method 2: Service Account Key
1. Create service account in Google Cloud Console
2. Download JSON key file
3. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

### Required Permissions
- **Role:** `roles/transcoder.user` or custom role with:
  - `transcoder.jobs.list`
  - `transcoder.jobs.get`

## 🎯 Features

### Core Functionality
- ✅ **Job Listing:** Display all transcoder jobs in project
- ✅ **Job Details:** Comprehensive job information in modal
- ✅ **Real-time Updates:** Auto-refresh every 30 seconds
- ✅ **Error Handling:** Graceful error states and recovery
- ✅ **Loading States:** Visual feedback during API calls

### UI/UX Features
- ✅ **Responsive Design:** Works on different window sizes
- ✅ **Keyboard Shortcuts:** Escape to close modal, Cmd+R to refresh
- ✅ **Status Indicators:** Color-coded job states
- ✅ **Hover Effects:** Interactive elements with smooth transitions
- ✅ **Empty States:** Helpful messages when no jobs exist

### Technical Features
- ✅ **Type Safety:** Full TypeScript coverage
- ✅ **Performance:** SolidJS fine-grained reactivity
- ✅ **Security:** Context isolation and secure IPC
- ✅ **Error Boundaries:** Graceful error handling
- ✅ **Hot Reload:** Fast development with Vite HMR

## 🔄 State Management

### SolidJS Reactive Primitives
```typescript
// Application state using SolidJS signals
const [jobs, setJobs] = createSignal<TranscoderJob[]>([]);
const [isLoading, setIsLoading] = createSignal(true);
const [error, setError] = createSignal<string | null>(null);
const [selectedJob, setSelectedJob] = createSignal<TranscoderJob | null>(null);
const [isModalOpen, setIsModalOpen] = createSignal(false);
```

### State Flow
1. **Initial Load:** Fetch jobs on app mount
2. **Auto Refresh:** Refresh every 30 seconds (when not loading/modal open)
3. **Manual Refresh:** User-triggered refresh via button
4. **Job Selection:** Click job → open modal with details
5. **Error Handling:** Display errors with retry options

## 📱 Responsive Design

### Breakpoints (Tailwind CSS)
- **Mobile:** `< 768px` - Single column layout
- **Tablet:** `768px - 1024px` - Responsive grid
- **Desktop:** `> 1024px` - Full multi-column layout

### Responsive Features
- **Header:** Stacks vertically on mobile
- **Table:** Horizontal scroll on small screens
- **Modal:** Full-screen on mobile, centered on desktop
- **Grid Layouts:** Responsive column counts

## 🚀 Build & Distribution

### Electron Builder Configuration
```json
{
  "build": {
    "appId": "com.yourcompany.transcoder-api",
    "productName": "Transcoder API Dashboard",
    "directories": {
      "output": "release"
    },
    "files": ["dist/**/*", "node_modules/**/*"],
    "mac": {
      "category": "public.app-category.developer-tools"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

### Supported Platforms
- **macOS:** `.dmg` installer
- **Windows:** `.exe` NSIS installer
- **Linux:** `.AppImage` portable executable

## 🔧 Development Setup & Fixes Applied

### Issues Resolved (September 2025)

#### 1. PostCSS Configuration Error
**Problem:** `SyntaxError: Unexpected token 'export'`
**Solution:** Changed PostCSS and Tailwind configs from ESM to CommonJS syntax
```javascript
// Fixed: postcss.config.js & tailwind.config.js
module.exports = { /* config */ }; // Instead of export default
```

#### 2. Electron Import Issues
**Problem:** `Cannot read properties of undefined (reading 'whenReady')`
**Solution:**
- Reordered imports in main.ts (Electron first)
- Added @types/electron dependency
- Updated tsconfig.main.json with proper types

#### 3. Development Script Improvements
**Problem:** Concurrent processes with poor error handling
**Solution:** Created custom `scripts/dev.js` with:
- Sequential main process build
- Proper process management
- Colored logging
- Graceful shutdown handling

#### 4. TypeScript Configuration
**Problem:** Compilation errors and path resolution issues
**Solution:**
- Added `rootDir: "src"` to tsconfig.main.json
- Updated build output structure to `dist/main/main.js`
- Fixed package.json main entry point

### Current Working Setup (Verified)
✅ **npm run dev** - Custom development script (recommended)
✅ **npm run dev:concurrent** - Alternative concurrent approach
✅ **PostCSS + Tailwind** - Working with CommonJS syntax
✅ **TypeScript compilation** - Separate configs for main/renderer
✅ **Electron + Vite** - Proper process coordination
✅ **Hot reload** - Vite HMR for renderer, rebuild for main

## 🧪 Development Workflow

### Getting Started
1. **Clone repository**
2. **Install dependencies:** `npm install`
3. **Set up authentication:** Configure Google Cloud credentials
4. **Start development:** `npm run dev` (uses improved custom script)

### Code Style
- **TypeScript:** Strict mode enabled
- **ESLint:** Configured for TypeScript + SolidJS
- **Formatting:** 4-space indentation, consistent imports
- **Naming:** PascalCase for components, camelCase for functions

### Git Workflow
- **Main branch:** Production-ready code
- **Feature branches:** `feature/description`
- **Commit messages:** Conventional commits format

## 🔍 Debugging

### Development Tools
- **Electron DevTools:** Available in development mode
- **Vite HMR:** Hot module replacement for fast development
- **TypeScript:** Compile-time error checking
- **ESLint:** Runtime code quality checks

### Common Issues
1. **PostCSS Config Error:** Ensure `postcss.config.js` uses CommonJS syntax
2. **Module Not Found:** Check TypeScript path aliases in configs
3. **Authentication Errors:** Verify Google Cloud credentials and permissions
4. **Build Failures:** Ensure all TypeScript errors are resolved

## 📈 Performance Considerations

### SolidJS Optimizations
- **Fine-grained Reactivity:** Only updates changed DOM nodes
- **No Virtual DOM:** Direct DOM manipulation for better performance
- **Compile-time Optimizations:** Vite + SolidJS compiler optimizations

### Electron Optimizations
- **Context Isolation:** Security without performance penalty
- **Preload Scripts:** Minimal API surface for renderer process
- **Background Processes:** Non-blocking API calls

### Bundle Optimizations
- **Tree Shaking:** Vite removes unused code
- **Code Splitting:** Automatic chunk splitting
- **Asset Optimization:** Compressed images and fonts

## 🔮 Future Enhancements

### Potential Features
- **Job Creation:** Create new transcoder jobs from UI
- **Job Management:** Cancel, retry, or delete jobs
- **Batch Operations:** Select multiple jobs for bulk actions
- **Export Functionality:** Export job data to CSV/JSON
- **Notifications:** Desktop notifications for job status changes
- **Themes:** Dark/light mode toggle
- **Multi-project Support:** Switch between different GCP projects

### Technical Improvements
- **Caching:** Local storage for job data
- **Offline Mode:** Basic functionality without internet
- **Auto-updates:** Electron auto-updater integration
- **Logging:** Structured logging for debugging
- **Analytics:** Usage analytics and error reporting

## 📚 Resources

### Documentation Links
- [Electron Documentation](https://www.electronjs.org/docs)
- [SolidJS Documentation](https://www.solidjs.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Google Cloud Transcoder API](https://cloud.google.com/transcoder/docs)

### Development Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Electron Security Best Practices](https://www.electronjs.org/docs/tutorial/security)
- [SolidJS Tutorial](https://www.solidjs.com/tutorial)

---

**Last Updated:** September 25, 2025
**Agent Version:** 1.1.0 (Verified Working Setup)
**Status:** ✅ All scripts tested and working
**Stack:** Electron 27 + TypeScript 5 + SolidJS 1.8 + Vite 4 + Tailwind CSS 3
**Maintainer:** Development Team
