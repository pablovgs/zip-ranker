const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
    {
        name: 'daily',
        description: 'Déclenche le message du Zip (Admin)',
    },
    {
        name: 'week',
        description: 'Affiche le classement de la semaine (Moyenne)',
    },
    {
        name: 'month',
        description: 'Affiche le classement du mois (Moyenne)',
    },
    {
        name: 'stats',
        description: 'Affiche tes statistiques perso (Série, Record, Moyenne)',
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('🚀 Mise à jour des commandes...');

        // Sécurité : On vérifie que les variables existent avant de lancer
        if (!process.env.GUILD_ID || !process.env.DISCORD_CLIENT_ID) {
            console.log('⚠️ Variables manquantes dans l\'environnement, on passe.');
            return;
        }

        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log('✅ Commandes synchronisées !');
    } catch (error) {
        console.error(error);
    }
})();
