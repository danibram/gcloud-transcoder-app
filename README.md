# Google Cloud Transcoder API Desktop Application

A modern desktop application built with Electron for monitoring and managing Google Cloud Video Transcoder API jobs. Features a native interface with job tables and detailed modals.

![Transcoder API Dashboard](https://img.shields.io/badge/Electron-27+-blue?logo=electron)
![SolidJS](https://img.shields.io/badge/SolidJS-1.8+-blue?logo=solid)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3+-blue?logo=tailwindcss)

## ✨ Features

- 📊 **Job Table View**: Visualize all transcoder jobs in a clean, sortable table
- 🔍 **Detailed Modal**: Click any job to see complete information including configuration, timestamps, and error details
- ⚙️ **Integrated Settings**: Manage Google Cloud credentials and project configuration directly from the application
- 🔐 **Multiple Authentication Methods**: Support for Application Default Credentials and Service Account key files
- 🔄 **Real-time Updates**: Manual and automatic refresh every 30 seconds
- 🎨 **Modern Interface**: Built with SolidJS, TypeScript, and Tailwind CSS
- ⚡ **Native Application**: Runs as a native desktop application with Electron
- 📱 **Responsive Design**: Works perfectly across different window sizes
- 🌍 **Cross-platform**: Available for macOS, Windows, and Linux

## 🚀 Installation and Setup

### Prerequisites

- Node.js 16+
- Google Cloud Project with Video Transcoder API enabled
- Google Cloud authentication configured

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/transcoder-api-ui.git
cd transcoder-api-ui
npm install
```

### 2. Authentication Setup

You can now configure authentication directly from the application using the "Settings" button in the interface, or use traditional methods:

**Option A: In-App Configuration (Recommended)**
1. Run the application with `npm run dev`
2. Click the "Settings" button in the top-right corner
3. Configure your Project ID, Location, and authentication method
4. The application will automatically validate the connection

**Option B: Application Default Credentials**
```bash
gcloud auth application-default login
```

**Option C: Service Account Key**
1. Create a service account in Google Cloud Console
2. Download the JSON key file
3. Set the environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

### 3. Environment Variables (Optional)

If not using in-app configuration:
```bash
export GOOGLE_CLOUD_PROJECT_ID=your-project-id
export GOOGLE_CLOUD_LOCATION=us-central1
```

### 4. Run the Application

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

## 📦 Build and Distribution

### Build for Your Platform
```bash
npm run build
```

### Create Distribution Package
```bash
npm run dist
```

### Build for All Platforms
```bash
npm run dist:all
```

Distribution files will be generated in the `release/` folder.

## 🏗️ Architecture

### Project Structure
```
transcoder-api-ui/
├── scripts/
│   └── dev.js                    # Custom development script
├── src/
│   ├── main/
│   │   └── main.ts               # Electron main process
│   ├── preload/
│   │   └── preload.ts            # IPC bridge (secure communication)
│   └── renderer/
│       ├── index.html            # HTML entry point
│       └── src/
│           ├── main.tsx          # SolidJS entry point
│           ├── App.tsx           # Main application component
│           ├── index.css         # Tailwind CSS imports
│           ├── types.ts          # TypeScript type definitions
│           ├── stores/
│           │   └── settingsStore.ts # Settings management
│           └── components/
│               ├── Header.tsx
│               ├── Dashboard.tsx
│               ├── JobsTable.tsx
│               ├── JobModal.tsx
│               ├── SettingsPage.tsx
│               ├── Icons.tsx
│               └── ErrorBoundary.tsx
├── .vscode/
│   └── settings.json             # VS Code configuration
├── dist/                         # Build output directory
├── package.json                  # Project configuration
├── tsconfig.json                 # TypeScript config (renderer)
├── tsconfig.main.json           # TypeScript config (main process)
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── postcss.config.js            # PostCSS configuration
```

### Main Process (main/)
- Electron window management
- IPC communication with renderer process
- Google Cloud Transcoder API integration
- Settings management and validation

### Renderer Process (renderer/)
- SolidJS user interface with TypeScript
- Secure communication with main process
- Application state management
- Settings store with localStorage persistence

## 🎮 Usage

### Initial Setup
1. **First time**: Click "Settings" to configure your Google Cloud credentials
2. **Project ID**: Enter your Google Cloud Project ID
3. **Location**: Select the region where your jobs are located (e.g., us-central1)
4. **Authentication**: Choose between Application Default Credentials or Service Account Key
5. **Validation**: The application will automatically test the connection

### Main Dashboard
- View all transcoder jobs in table format
- See status, input/output URIs, and creation timestamps
- Use the "Refresh" button to update data
- Access "Settings" to change configuration

### Job Details
- Click any table row to open the details modal
- View complete job information including:
  - Job status and timeline
  - Input and output URIs
  - Detailed configuration
  - Error information (if applicable)
  - Labels and metadata

### Keyboard Shortcuts
- `Cmd/Ctrl + R`: Refresh jobs
- `Escape`: Close modal

### Job States
- 🟢 **Succeeded**: Completed successfully
- 🔵 **Running**: Currently processing
- 🟡 **Pending**: Waiting to start
- 🔴 **Failed**: Failed with errors
- ⚪ **Unknown**: Unknown state

## 🔧 Advanced Configuration

### Supported Environment Variables
```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Build Customization
Edit the `build` section in `package.json` to customize:
- Application ID
- Product name
- Icons and resources
- Platform-specific configuration

## 🛠️ Development

### Tech Stack
- **Electron**: Desktop application framework
- **SolidJS**: Reactive UI framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and dev server
- **Google Cloud Video Transcoder API**: Video transcoding service
- **IPC (Inter-Process Communication)**: Secure process communication

### Available Scripts
- `npm run dev`: Run in development mode
- `npm run build`: Build the application
- `npm run start`: Run in production mode
- `npm run dist`: Create distribution package
- `npm run dist:all`: Build for all platforms
- `npm run type-check`: TypeScript type checking
- `npm run lint`: ESLint code linting
- `npm run clean`: Clean build directory

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. The application will open automatically

## 🐛 Troubleshooting

### Common Issues

**Authentication Error**
- Verify that `gcloud auth application-default login` has been executed
- Confirm that credentials have permissions for the Transcoder API

**No Jobs Displayed**
- Verify the Project ID and Location in settings
- Confirm that jobs exist in the specified region

**Build Error**
- Run `npm install` to install dependencies
- Verify that Node.js is version 16 or higher

### Debug Logs
Logs are displayed in:
- **Development**: Browser console (F12)
- **Production**: Terminal where the application was executed

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 🙏 Acknowledgments

- Google Cloud Platform for the Video Transcoder API
- Electron for the desktop application framework
- SolidJS community for the reactive UI framework
- The open source community for the tools and libraries used

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation in the `agent.md` file
- Review the troubleshooting section

## 🔗 Links

- [Google Cloud Video Transcoder API Documentation](https://cloud.google.com/transcoder/docs)
- [Electron Documentation](https://www.electronjs.org/docs)
- [SolidJS Documentation](https://www.solidjs.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🎨 App Icons

The application includes a complete set of professional icons:
- **Favicon**: `favicon.ico` for web browsers
- **App Icons**: High-resolution PNG icons (192x192, 512x512)
- **Apple Touch Icon**: Optimized for iOS devices
- **Maskable Icons**: PWA-compatible adaptive icons
- **Cross-platform**: Icons for macOS, Windows, and Linux builds

## 🌟 Screenshots

*Add screenshots of your application here to showcase the interface*

## 📈 Roadmap

- [ ] Add job creation functionality
- [ ] Implement job cancellation
- [ ] Add batch operations
- [ ] Export job data to CSV/JSON
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Real-time job status notifications

---

**Made with ❤️ using Electron, SolidJS, and TypeScript**