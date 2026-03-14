import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const backupFile = process.argv[2];

if (!backupFile) {
  console.log("📖 Uso: node scripts/restore-from-json.mjs <ruta-del-archivo.json>");
  process.exit(0);
}

async function restore() {
  try {
    const rawData = fs.readFileSync(path.resolve(process.cwd(), backupFile), 'utf8');
    const backup = JSON.parse(rawData);

    if (!backup.data || !backup.metadata) {
      throw new Error("El archivo no parece ser un backup válido generado por GuildBoard.");
    }

    console.log(`🚀 Iniciando restauración desde: ${backupFile}`);
    console.log(`📅 Fecha del backup: ${backup.metadata.timestamp}`);
    console.log(`📊 Tablas a restaurar: ${backup.metadata.tables.join(', ')}`);

    // El orden importa por las claves foráneas. 
    // Para una restauración completa, lo ideal es desactivar triggers o ir en orden inverso.
    // Aquí iremos tabla por tabla.
    
    for (const table of backup.metadata.tables) {
      const rows = backup.data[table];
      if (!rows || rows.length === 0) {
        console.log(`- ⏭️ Saltando ${table} (sin datos)`);
        continue;
      }

      console.log(`- 🔄 Restaurando ${table} (${rows.length} filas)...`);
      
      // 1. Limpiar tabla actual (¡CUIDADO!)
      const { error: delError } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (delError) {
        console.warn(`  ⚠️ Error limpiando ${table}: ${delError.message}`);
      }

      // 2. Insertar datos
      const { error: insError } = await supabase.from(table).insert(rows);
      if (insError) {
        console.error(`  ❌ Error insertando en ${table}: ${insError.message}`);
      } else {
        console.log(`  ✅ ${table} restaurada.`);
      }
    }

    console.log("\n✨ Restauración completada.");

  } catch (e) {
    console.error(`\n❌ Error de restauración: ${e.message}`);
  }
}

restore();
