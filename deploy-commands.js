const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
    { name: 'daily', description: 'Tester le message quotidien' },
    { name: 'week', description: 'Tester le classement hebdo' },
    { name: 'month', description: 'Tester le classement mensuel' }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
    console.log('✅ Commandes enregistrées !');
})();
