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
        console.log('Déploiement des commandes Slash...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log('✅ Commandes enregistrées avec succès !');
    } catch (error) {
        console.error(error);
    }
})();
