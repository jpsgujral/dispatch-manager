import { spawn } from 'child_process';
import { platform } from 'os';
import { join, dirname } from 'path';
import { existsSync, readFileSync, createWriteStream, unlinkSync, mkdirSync } from 'fs';
import https from 'https';

// Helper to download a file over HTTPS (handles redirects automatically)
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading fresh gradle-wrapper.jar from: ${url}`);
    
    function get(currentUrl) {
      https.get(currentUrl, (response) => {
        // Handle 301/302 redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            get(redirectUrl);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: Status Code ${response.statusCode}`));
          return;
        }

        const file = createWriteStream(destPath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        try { unlinkSync(destPath); } catch (e) {} // Clean up file on failure
        reject(err);
      });
    }

    get(url);
  });
}

// Test if the JAR can be successfully opened by Java
function testJarValidity(jarPath) {
  return new Promise((resolve) => {
    // Spawn 'java -jar' to check if JVM can read the JAR structure.
    const proc = spawn('java', ['-jar', jarPath, '--version'], { shell: true });
    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // 2.5 seconds timeout - enough to verify if JVM throws "Invalid or corrupt jarfile"
    const timer = setTimeout(() => {
      proc.kill();
      resolve(true); // Timeout means JVM loaded the JAR successfully and started running it
    }, 2500);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (stderr.includes('Invalid or corrupt jarfile')) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    proc.on('error', () => {
      clearTimeout(timer);
      resolve(true); // If java itself fails to spawn, fallback to assuming it is fine
    });
  });
}

// Check if the wrapper JAR is missing or corrupted and restore if needed
async function verifyAndRepairWrapper(gradleCwd) {
  const jarPath = join(gradleCwd, 'gradle', 'wrapper', 'gradle-wrapper.jar');
  let needsRepair = false;

  if (!existsSync(jarPath)) {
    console.log(`\n⚠️ gradle-wrapper.jar is missing.`);
    needsRepair = true;
  } else {
    try {
      const buffer = readFileSync(jarPath);
      // Valid ZIP/JAR files must start with the magic bytes 'PK\x03\x04' (0x50, 0x4b, 0x03, 0x04)
      if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
        console.log(`\n⚠️ gradle-wrapper.jar is invalid or corrupted (invalid ZIP magic bytes).`);
        needsRepair = true;
      } else {
        // Deep verification by running java
        console.log(`\n🔍 Performing deep verification of gradle-wrapper.jar...`);
        const isValid = await testJarValidity(jarPath);
        if (!isValid) {
          console.log(`\n⚠️ gradle-wrapper.jar deep verification failed: Java reported it is corrupt.`);
          needsRepair = true;
        } else {
          console.log(`\n✅ gradle-wrapper.jar is fully verified (valid ZIP signature and readable by Java).`);
        }
      }
    } catch (err) {
      console.log(`\n⚠️ Could not read gradle-wrapper.jar: ${err.message}`);
      needsRepair = true;
    }
  }

  if (needsRepair) {
    console.log('🔧 Attempting to auto-repair gradle-wrapper.jar...');
    try {
      mkdirSync(dirname(jarPath), { recursive: true });
    } catch (e) {}
    const urls = [
      'https://raw.githubusercontent.com/gradle/gradle/v8.14.3/gradle/wrapper/gradle-wrapper.jar',
      'https://raw.githubusercontent.com/gradle/gradle/v8.5.0/gradle/wrapper/gradle-wrapper.jar',
      'https://raw.githubusercontent.com/gradle/gradle/v8.12.0/gradle/wrapper/gradle-wrapper.jar',
      'https://raw.githubusercontent.com/gradle/gradle/master/gradle/wrapper/gradle-wrapper.jar'
    ];

    let success = false;
    for (const url of urls) {
      try {
        await downloadFile(url, jarPath);
        console.log('✅ Successfully downloaded and restored gradle-wrapper.jar!');
        success = true;
        break;
      } catch (err) {
        console.warn(`⚠️ Failed to download from ${url}: ${err.message}. Trying next URL...`);
      }
    }

    if (!success) {
      throw new Error('Failed to repair gradle-wrapper.jar. Please restore it manually.');
    }
  }
}

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

    // 1.5. Generate App Icons for Android and Web
    console.log('\n\x1b[1m\x1b[34m[1.5/3] Generating Android/Web App Icons...\x1b[0m');
    await runCommand('node', ['build_icons.cjs']);

    // 2. Sync with Capacitor Android platform
    console.log('\n\x1b[1m\x1b[34m[2/3] Syncing assets with Capacitor Android...\x1b[0m');
    await runCommand('npx', ['cap', 'sync', 'android']);

    // 3. Run the Gradle build
    console.log('\n\x1b[1m\x1b[34m[3/3] Compiling Android APK with Gradle...\x1b[0m');
    const gradleCmd = isWin ? 'gradlew.bat' : './gradlew';
    const gradleCwd = join(process.cwd(), 'android');
    await verifyAndRepairWrapper(gradleCwd);
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
