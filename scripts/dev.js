#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

function log(color, prefix, message) {
    console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

// Build main process first
log(colors.cyan, 'SETUP', 'Building main process...');

const buildMain = spawn('npm', ['run', 'build:main'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
});

buildMain.on('close', (code) => {
    if (code !== 0) {
        log(colors.red, 'ERROR', 'Failed to build main process');
        process.exit(1);
    }

    log(colors.green, 'SUCCESS', 'Main process built successfully');
    log(colors.cyan, 'SETUP', 'Starting development servers...');

    // Start Vite first
    const vite = spawn('npm', ['run', 'dev:renderer'], {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd(),
        detached: false
    });

    // Wait a bit for Vite to start, then start Electron
    setTimeout(() => {
        log(colors.cyan, 'SETUP', 'Starting Electron...');
        const electron = spawn('electron', ['dist/main/main.js', '--dev'], {
            stdio: 'inherit',
            shell: true,
            cwd: process.cwd(),
            detached: false
        });

        // Handle process termination
        const cleanup = () => {
            log(colors.yellow, 'CLEANUP', 'Shutting down development servers...');
            try {
                electron.kill('SIGTERM');
                vite.kill('SIGTERM');
            } catch (e) {
                // Processes might already be dead
            }
            process.exit(0);
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

        electron.on('close', (code) => {
            log(colors.yellow, 'ELECTRON', 'Electron closed, shutting down...');
            try {
                vite.kill('SIGTERM');
            } catch (e) {
                // Process might already be dead
            }
            process.exit(code || 0);
        });

        vite.on('close', (code) => {
            log(colors.yellow, 'VITE', 'Vite closed, shutting down...');
            try {
                electron.kill('SIGTERM');
            } catch (e) {
                // Process might already be dead
            }
            process.exit(code || 0);
        });

    }, 2000); // Wait 2 seconds for Vite to start
});
