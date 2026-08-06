import sharp from 'sharp';
// import fs from 'fs';
import path from 'path';

const svgString = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#09090b" rx="100" ry="100"/>
  <text x="50%" y="55%" font-family="sans-serif" font-size="180" font-weight="900" fill="#3b82f6" text-anchor="middle" dominant-baseline="middle">AT</text>
</svg>`;

async function run() {
    const buffer = Buffer.from(svgString);

    await sharp(buffer)
        .resize(192, 192)
        .png()
        .toFile(path.join(process.cwd(), 'public', 'icon-192x192.png'));

    await sharp(buffer)
        .resize(512, 512)
        .png()
        .toFile(path.join(process.cwd(), 'public', 'icon-512x512.png'));

    console.log("PWA Icons generated");
}

run();
