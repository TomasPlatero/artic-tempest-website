import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public', 'assets');

async function convertDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            await convertDir(fullPath);
            continue;
        }

        const ext = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            const output = fullPath.replace(ext, '.webp');
            if (!fs.existsSync(output)) {
                console.log(`Converting ${path.relative(publicDir, fullPath)} to WebP...`);
                try {
                    await sharp(fullPath).webp({ quality: 85 }).toFile(output);
                } catch (err) {
                    console.error(`Failed to convert ${file}:`, err);
                }
            }
        }
    }
}

convertDir(publicDir)
    .then(() => console.log('Image conversion complete.'))
    .catch(err => console.error('Error converting images:', err));
