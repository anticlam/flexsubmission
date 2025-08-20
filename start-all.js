#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Flex Living Dashboard...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check if directories exist
const backendDir = path.join(__dirname, 'flex-dashboard-backend');
const frontendDir = path.join(__dirname, 'flex-dashboard-frontend');

if (!fs.existsSync(backendDir)) {
    console.error('❌ Error: Backend directory not found');
    process.exit(1);
}

if (!fs.existsSync(frontendDir)) {
    console.error('❌ Error: Frontend directory not found');
    process.exit(1);
}

let backendProcess;
let frontendProcess;

// Cleanup function
const cleanup = () => {
    console.log('\n🛑 Shutting down services...');
    if (backendProcess) {
        backendProcess.kill();
        console.log('   ✅ Backend server stopped');
    }
    if (frontendProcess) {
        frontendProcess.kill();
        console.log('   ✅ Frontend server stopped');
    }
    console.log('👋 All services stopped. Goodbye!');
    process.exit(0);
};

// Handle Ctrl+C
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start backend
console.log('\n🔧 Starting Backend Server...');
backendProcess = spawn('node', ['server.js'], {
    cwd: backendDir,
    stdio: ['inherit', 'pipe', 'pipe']
});

backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
});

backendProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);
});

// Wait for backend to start
setTimeout(() => {
    console.log('   ✅ Backend server started');
    console.log('   🌐 Backend running at: http://localhost:3001');
    
    // Start frontend
    console.log('\n⚡ Starting Frontend Server...');
    frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: frontendDir,
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
    });

    frontendProcess.stdout.on('data', (data) => {
        console.log(`[Frontend] ${data.toString().trim()}`);
    });

    frontendProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        // Vite often outputs info to stderr, so don't treat it as error
        if (output.includes('Local:') || output.includes('ready in')) {
            console.log(`[Frontend] ${output}`);
        } else {
            console.error(`[Frontend Error] ${output}`);
        }
    });

    setTimeout(() => {
        console.log('   ✅ Frontend server started');
        console.log('   🌐 Frontend running at: http://localhost:5173');
        
        console.log('\n🎉 All services are running!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 Manager Dashboard: http://localhost:5173/dashboard');
        console.log('🏠 Property Page:     http://localhost:5173/property');
        console.log('🔧 Backend API:       http://localhost:3001/api');
        console.log('');
        console.log('💡 Press Ctrl+C to stop all services');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }, 3000);

}, 2000);

// Handle process errors
backendProcess.on('error', (err) => {
    console.error('❌ Failed to start backend:', err.message);
    process.exit(1);
});

backendProcess.on('exit', (code) => {
    if (code !== 0) {
        console.error(`❌ Backend process exited with code ${code}`);
    }
});
