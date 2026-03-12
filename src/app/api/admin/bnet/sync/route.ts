import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, supabaseAdmin } from '@/shared/auth/auth-options';
import { bnet } from '@/shared/integrations/bnet/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time for Vercel/Next.js

// Valid instance IDs inside Midnight (tier 516)
// 1307: La Aguja del Vacío (Voidspire)
// 1308: Marcha a Quel'Danas
// 1314: La Falla Onírica (Dreamwell/Dreamrift)
const MIDNIGHT_INSTANCES = [1307, 1308, 1314];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return new NextResponse('No autorizado', { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role_level')
      .eq('user_id', session.user.id)
      .single();

    const isOfficer =
      profile?.role_level === 'officer' || profile?.role_level === 'gm';
    if (!isOfficer) return new NextResponse('Prohibido', { status: 403 });

    const { tierId } = await req.json();
    if (!tierId)
      return NextResponse.json(
        { error: 'Falta el ID del Tier (ej: 516 para Midnight).' },
        { status: 400 },
      );

    // Create a ReadableStream for Server-Sent Events (SSE)
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const log = (msg: string) => {
          const data = JSON.stringify({ message: msg });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };
        const logError = (msg: string) => {
          const data = JSON.stringify({ error: msg });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        try {
          log(`Starting Battle.net sync for Expansion Tier ${tierId}...`);

          // 1. Fetch Expansion Details
          const expData = await bnet.getExpansion(tierId);
          const expName =
            typeof expData.name === 'string'
              ? expData.name
              : expData.name?.es_ES ||
                expData.name?.en_US ||
                'Unknown Expansion';

          log(`=> Expansión conectada: ${expName}`);

          await supabaseAdmin.from('bnet_expansions').upsert({
            id: expData.id,
            name: expName,
          });

          const instanceRefs =
            expData.dungeons?.concat(expData.raids || []) || [];
          const relevantInstances = instanceRefs.filter((i: any) =>
            MIDNIGHT_INSTANCES.includes(i.id),
          );

          let totalItemsSynced = 0;

          for (const instRef of relevantInstances) {
            const instRefName =
              typeof instRef.name === 'string'
                ? instRef.name
                : instRef.name?.es_ES || instRef.name?.en_US;
            log(`---> Inspeccionando banda: ${instRefName} (${instRef.id})`);

            const instData = await bnet.getInstance(instRef.id);
            const instName =
              typeof instData.name === 'string'
                ? instData.name
                : instData.name?.es_ES || instData.name?.en_US;

            await supabaseAdmin.from('bnet_instances').upsert({
              id: instData.id,
              name: instName,
              expansion_id: expData.id,
            });

            const encounters = instData.encounters || [];
            for (let x = 0; x < encounters.length; x++) {
              const encRef = encounters[x];
              const encRefName =
                typeof encRef.name === 'string'
                  ? encRef.name
                  : encRef.name?.es_ES || encRef.name?.en_US;
              log(
                `-----> Jefe ${x + 1}/${encounters.length}: ${encRefName} (${encRef.id})`,
              );

              const encData = await bnet.getEncounter(encRef.id);
              const encName =
                typeof encData.name === 'string'
                  ? encData.name
                  : encData.name?.es_ES || encData.name?.en_US;

              await supabaseAdmin.from('bnet_encounters').upsert({
                id: encData.id,
                name: encName,
                instance_id: instData.id,
              });

              const items = encData.items || [];
              let itemsForBoss = 0;
              log(
                `        [⏳] Detectados ${items.length} objetos en la tabla de botín. Analizando...`,
              );

              for (const itemRef of items) {
                const itemId = itemRef.item.id;

                try {
                  const itemData = await bnet.getItem(itemId);
                  let iconUrl = null;

                  try {
                    const mediaData = await bnet.getItemMedia(itemId);
                    if (mediaData.assets && mediaData.assets.length > 0) {
                      iconUrl = mediaData.assets[0].value;
                    }
                  } catch (e) {
                    // Silent fail for missing media
                  }

                  const itemName =
                    typeof itemData.name === 'string'
                      ? itemData.name
                      : itemData.name?.es_ES || itemData.name?.en_US;

                  await supabaseAdmin.from('bnet_items').upsert({
                    id: itemData.id,
                    name: itemName,
                    quality: itemData.quality.type,
                    item_level: itemData.level,
                    required_level: itemData.required_level,
                    icon: iconUrl,
                    item_class_id: itemData.item_class.id,
                    item_subclass_id: itemData.item_subclass.id,
                    inventory_type: itemData.inventory_type.type,
                  });

                  await supabaseAdmin.from('bnet_encounter_loot').upsert({
                    encounter_id: encData.id,
                    item_id: itemData.id,
                  });

                  itemsForBoss++;
                  totalItemsSynced++;

                  if (itemsForBoss % 5 === 0 || itemsForBoss === items.length) {
                    log(
                      `        [✔] ${itemsForBoss}/${items.length} objetos cacheados localmente...`,
                    );
                  }
                } catch (e: any) {
                  log(
                    `        [!] Error al procesar objeto ${itemId}: ${e.message}`,
                  );
                }
              }
            }
          }

          // Send the special "DONE" signal
          const doneData = JSON.stringify({
            done: true,
            message: `✅ Sincronización completa. Expansión: ${expName}. Instancias: ${relevantInstances.length}. Objetos procesados: ${totalItemsSynced}.`,
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
        } catch (e: any) {
          logError(e.message);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (e: any) {
    console.error('Bnet Sync error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
