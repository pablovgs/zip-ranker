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
        console.log('🚀 Déploiement des commandes (Serveur Spécifique)...');

        if (!process.env.GUILD_ID) {
            console.error('❌ ERREUR : GUILD_ID manquant dans le .env');
            return;
        }

        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log('✅ Commandes enregistrées avec succès !');
    } catch (error) {
        console.error('❌ Erreur API Discord :', error);
    }
})();
