const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Target directory in Android resource structure
const RES_PATH = './android/app/src/main/res';

const densities = {
  'mdpi': { size: 48, foregroundSize: 108 },
  'hdpi': { size: 72, foregroundSize: 162 },
  'xhdpi': { size: 96, foregroundSize: 216 },
  'xxhdpi': { size: 144, foregroundSize: 324 },
  'xxxhdpi': { size: 192, foregroundSize: 432 }
};

function main() {
  console.log("### Starting Android/Web App Icon Build System ###");

  // 1. Generate full high-quality icons for Web/Desktop Launcher
  console.log("[Web] Generating main 512x512 PNG assets...");
  execSync('npx -y sharp-cli -i ./assets/icon_full.svg -o ./assets/icon_full.png resize 512 512');
  execSync('npx -y sharp-cli -i ./assets/icon_full.svg -o ./assets/icon_full_192.png resize 192 192');

  // 2. Map through densities and generate Android assets
  for (const [density, config] of Object.entries(densities)) {
    const mipmapDir = path.join(RES_PATH, `mipmap-${density}`);
    if (!fs.existsSync(mipmapDir)) {
      fs.mkdirSync(mipmapDir, { recursive: true });
    }

    // A. ic_launcher.png (legacy squircle)
    const legacyPath = path.join(mipmapDir, 'ic_launcher.png');
    console.log(`[Android] Generating mipmap-${density}/ic_launcher.png (${config.size}x${config.size})`);
    execSync(`npx -y sharp-cli -i ./assets/icon_legacy.svg -o ${legacyPath} resize ${config.size} ${config.size}`);

    // B. ic_launcher_round.png (circle-cut)
    const roundPath = path.join(mipmapDir, 'ic_launcher_round.png');
    console.log(`[Android] Generating mipmap-${density}/ic_launcher_round.png (${config.size}x${config.size})`);
    execSync(`npx -y sharp-cli -i ./assets/icon_round.svg -o ${roundPath} resize ${config.size} ${config.size}`);

    // C. ic_launcher_foreground.png (no-bg adaptive foreground)
    const fgPath = path.join(mipmapDir, 'ic_launcher_foreground.png');
    console.log(`[Android] Generating mipmap-${density}/ic_launcher_foreground.png (${config.foregroundSize}x${config.foregroundSize})`);
    execSync(`npx -y sharp-cli -i ./assets/icon_foreground.svg -o ${fgPath} resize ${config.foregroundSize} ${config.foregroundSize}`);
  }

  // 3. Update Adaptive background color resource file to custom brand Slate-Dark
  console.log("[Android] Updating color resource values/ic_launcher_background.xml...");
  const bgColorPath = path.join(RES_PATH, 'values/ic_launcher_background.xml');
  const bgContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0F172A</color>
</resources>
`;
  fs.writeFileSync(bgColorPath, bgContent, 'utf8');

  console.log("### App icon build system ran successfully! All icons placed. ###");
}

try {
  main();
} catch (error) {
  console.error("Failed building custom app icons:", error.message);
  process.exit(1);
}
