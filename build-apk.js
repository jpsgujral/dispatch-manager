import { spawn } from 'child_process';
import { platform } from 'os';
import { join } from 'path';

// Helper to run a command and stream its output in real-time
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`\x1b[36m> Running: ${command} ${args.join(' ')}\x1b[0m`);
    
    // Using shell: true is critical for cross-platform compatibility
    // (especially on Windows to execute .cmd and .bat scripts properly)
    const child = spawn(command, args, {
      cwd,
      shell: true,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  const isWin = platform() === 'win32';
  
  try {
    // 1. Build Web Assets
    console.log('\n\x1b[1m\x1b[34m[1/3] Building web assets with Vite...\x1b[0m');
    await runCommand('npm', ['run', 'build']);

    // 2. Sync with Capacitor Android platform
    console.log('\n\x1b[1m\x1b[34m[2/3] Syncing assets with Capacitor Android...\x1b[0m');
    await runCommand('npx', ['cap', 'sync', 'android']);

    // 3. Run the Gradle build
    console.log('\n\x1b[1m\x1b[34m[3/3] Compiling Android APK with Gradle...\x1b[0m');
    const gradleCmd = isWin ? 'gradlew.bat' : './gradlew';
    const gradleCwd = join(process.cwd(), 'android');
    await runCommand(gradleCmd, ['assembleDebug'], gradleCwd);

    console.log('\n\x1b[1m\x1b[32m==================================================\x1b[0m');
    console.log('\x1b[1m\x1b[32m🎉 Android APK Build Completed Successfully!\x1b[0m');
    console.log('\x1b[32mYour debug APK is located at:\x1b[0m');
    console.log('\x1b[33mandroid/app/build/outputs/apk/debug/app-debug.apk\x1b[0m');
    console.log('\x1b[1m\x1b[32m==================================================\x1b[0m\n');
  } catch (error) {
    console.error('\n\x1b[1m\x1b[31m❌ Build failed:\x1b[0m', error.message);
    process.exit(1);
  }
}

main();
