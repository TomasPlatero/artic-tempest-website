import dotenv from 'dotenv';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

const { DISCORD_BOT_TOKEN, DISCORD_APP_ID } = process.env;

if (!DISCORD_BOT_TOKEN || !DISCORD_APP_ID) {
    console.error(' Faltan variables de entorno: DISCORD_BOT_TOKEN o DISCORD_APP_ID');
    process.exit(1);
}

// Lista de comandos a registrar (Sobrescribirá todos los anteriores)
const commands = [
    {
        name: 'ping',
        description: 'Comprueba si el Asistente Guildboard está funcionando.',
        type: 1,
    },
    {
        name: 'status',
        description: 'Muestra el estado actual del reclutamiento de la hermandad.',
        type: 1,
    },
    {
        name: 'progreso',
        description: 'Consulta el progreso actual en la banda de Midnight.',
        type: 1,
    },
];

async function registerCommands() {
    const url = `https://discord.com/api/v10/applications/${DISCORD_APP_ID}/commands`;

    try {
        console.log('Empezando a registrar comandos 글로벌 (globales)...');

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            },
            body: JSON.stringify(commands),
        });

        if (response.ok) {
            console.log('✅ Comandos registrados exitosamente.');
            const data = await response.json();
            console.log(data);
        } else {
            console.error('❌ Error registrando comandos:');
            const errorText = await response.text();
            console.error(errorText);
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
}

registerCommands();
