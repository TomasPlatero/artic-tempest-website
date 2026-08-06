import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "..", "public", "assets");

/**
 * WebP encode settings — balance calidad/compresión máxima.
 * alphaQuality solo se aplica si la imagen tiene canal alfa (logos, etc.).
 */
const WEBP_OPTIONS = { quality: 80, effort: 6, alphaQuality: 85 };

/** Extensiones de imagen de entrada que se convierten a WebP */
const RASTER_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

/** Temp file suffix usado en recompress */
const TMP_SUFFIX = "-recompress-tmp.webp";

/** Cache de archivos ya procesados para no re-comprimir en cada build */
const CACHE_FILE = path.join(publicDir, ".webp-cache.json");

/** Hash de la configuración actual — si cambia, el cache se invalida */
const SETTINGS_HASH = `q${WEBP_OPTIONS.quality}e${WEBP_OPTIONS.effort}a${WEBP_OPTIONS.alphaQuality}`;

function isRecompressTemp(fileName) {
	return fileName.endsWith(TMP_SUFFIX);
}

function loadCache() {
	try {
		const raw = fs.readFileSync(CACHE_FILE, "utf8");
		const cache = JSON.parse(raw);
		if (cache.settingsHash === SETTINGS_HASH) return new Set(cache.files);
	} catch {
		/* no cache or invalid — empezar de cero */
	}
	return new Set();
}

function saveCache(processedFiles) {
	try {
		const cache = {
			settingsHash: SETTINGS_HASH,
			files: [...processedFiles].sort((a, b) => String(a).localeCompare(String(b))),
		};
		fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2) + "\n");
	} catch (err) {
		console.error(`  ⚠ Could not write cache: ${err.message}`);
	}
}

function relPath(fullPath) {
	return path.relative(publicDir, fullPath).replace(/\\/g, "/");
}

async function convertRasters(dir) {
	const results = [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		if (entry.name.includes("..")) continue; // path traversal guard
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			results.push(...(await convertRasters(fullPath)));
			continue;
		}

		const ext = path.extname(entry.name).toLowerCase();
		if (!RASTER_EXTENSIONS.has(ext)) continue;

		const output = fullPath.replace(ext, ".webp");

		// Skip if the destination WebP is newer than the source
		if (
			fs.existsSync(output) &&
			fs.statSync(output).mtimeMs > fs.statSync(fullPath).mtimeMs
		) {
			// WebP is up to date — queue source for cleanup
			results.push({
				original: fullPath,
				output,
				beforeBytes: 0,
				afterBytes: 0,
			});
			continue;
		}

		console.log(`  Converting ${path.relative(publicDir, fullPath)} → .webp`);
		try {
			const beforeBytes = fs.statSync(fullPath).size;
			await sharp(fullPath).webp(WEBP_OPTIONS).toFile(output);
			const afterBytes = fs.statSync(output).size;
			results.push({ original: fullPath, output, beforeBytes, afterBytes });
		} catch (err) {
			console.error(`  ✗ Failed to convert ${entry.name}:`, err);
		}
	}

	return results;
}

/**
 * Re-comprime WebPs existentes que no se optimizaron con la configuración
 * actual de effort (saltándose los que ya fueron procesados).
 */
async function recompressWebPs(dir, cache) {
	const results = [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		if (entry.name.includes("..")) continue; // path traversal guard
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			results.push(...(await recompressWebPs(fullPath, cache)));
			continue;
		}

		if (path.extname(entry.name).toLowerCase() !== ".webp") continue;
		if (isRecompressTemp(entry.name)) {
			try {
				fs.unlinkSync(fullPath);
				console.log(`  🧹 Cleaned stale temp ${entry.name}`);
			} catch {
				/* ignore */
			}
			continue;
		}

		// Si ya fue procesado con esta configuración, saltar
		if (cache.has(relPath(fullPath))) continue;

		const beforeBytes = fs.statSync(fullPath).size;
		if (beforeBytes < 20_000) {
			cache.add(relPath(fullPath));
			continue;
		}

		console.log(`  Recompressing ${path.relative(publicDir, fullPath)}...`);
		try {
			const tmpPath = fullPath.replace(/\.webp$/, TMP_SUFFIX);
			await sharp(fullPath).webp({ quality: 80, effort: 6 }).toFile(tmpPath);

			const afterBytes = fs.statSync(tmpPath).size;

			// Solo reemplazar si realmente es más pequeño
			if (afterBytes < beforeBytes) {
				// renameSync es atómico en el mismo filesystem y evita
				// sharing violations de Windows al no leer/escribir el archivo original
				try {
					fs.renameSync(tmpPath, fullPath);
				} catch {
					// Fallback: copyFileSync + unlink para casos cross-device
					fs.copyFileSync(tmpPath, fullPath);
					fs.unlinkSync(tmpPath);
				}
				cache.add(relPath(fullPath));
				results.push({
					original: fullPath,
					output: fullPath,
					beforeBytes,
					afterBytes,
				});
			} else {
				cache.add(relPath(fullPath));
				console.log(
					`  ⏭ Already optimal — ${path.relative(publicDir, fullPath)}`,
				);
				fs.unlinkSync(tmpPath);
			}
		} catch (err) {
			console.error(`  ✗ Failed to recompress ${entry.name}:`, err);
		}
	}

	return results;
}

function deleteOriginals(results) {
	for (const { original, beforeBytes, afterBytes } of results) {
		if (!original.endsWith(".webp") && fs.existsSync(original)) {
			try {
				fs.unlinkSync(original);
				const rel = path.relative(publicDir, original);
				if (beforeBytes > 0) {
					const pct = (
						((beforeBytes - afterBytes) / beforeBytes) *
						100
					).toFixed(1);
					console.log(
						`  ✔ ${rel} — ${(beforeBytes / 1024).toFixed(0)}KB → ${(afterBytes / 1024).toFixed(0)}KB (${pct}%)`,
					);
				} else {
					console.log(`  ✔ Deleted ${rel}`);
				}
			} catch (err) {
				console.error(`  ✗ Failed to delete ${original}:`, err);
			}
		}
	}
}

async function main() {
	console.log("🖼  Image optimization pipeline\n");

	// Fase 1: Convertir PNG/JPG a WebP
	console.log("📸 Phase 1: Converting raster images to WebP...");
	const rasterResults = await convertRasters(publicDir);
	deleteOriginals(rasterResults);

	// Fase 2: Re-comprimir WebPs grandes
	const cache = loadCache();
	console.log("\n🔧 Phase 2: Recompressing large WebPs (effort: 6)...");
	const recompressResults = await recompressWebPs(publicDir, cache);

	// Marcar en cache los WebP recién convertidos (ya están optimizados)
	for (const r of rasterResults) {
		if (r.output.endsWith(".webp")) {
			cache.add(relPath(r.output));
		}
	}

	// Resumen
	const allConversions = rasterResults.filter((r) => r.beforeBytes > 0);
	const totalBefore = allConversions.reduce((s, r) => s + r.beforeBytes, 0);
	const totalAfter = allConversions.reduce((s, r) => s + r.afterBytes, 0);
	const recompBefore = recompressResults.reduce((s, r) => s + r.beforeBytes, 0);
	const recompAfter = recompressResults.reduce((s, r) => s + r.afterBytes, 0);

	console.log("\n📊 Summary:");
	if (allConversions.length > 0) {
		const pct = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1);
		console.log(
			`  Raster → WebP: ${(totalBefore / 1024).toFixed(0)}KB → ${(totalAfter / 1024).toFixed(0)}KB (${pct}% saved)`,
		);
	} else {
		console.log("  Raster → WebP: No new conversions needed");
	}
	if (recompressResults.length > 0) {
		const pct = (((recompBefore - recompAfter) / recompBefore) * 100).toFixed(
			1,
		);
		console.log(
			`  WebP recompress: ${(recompBefore / 1024).toFixed(0)}KB → ${(recompAfter / 1024).toFixed(0)}KB (${pct}% saved)`,
		);
	} else {
		console.log("  WebP recompress: No WebPs needed recompression");
	}

	// Persistir cache para el próximo build
	saveCache(cache);

	console.log("\n✅ Image optimization complete.");
}

main().catch((err) => {
	console.error("Error during image optimization:", err);
	process.exit(1);
});
