const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');
require('dotenv').config();

// Configuration
const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

// Initialisation du Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Base de données
const db = new sqlite3.Database('./data/zip-ranker.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connecté à la base de données SQLite.');
});

db.run(`CREATE TABLE IF NOT EXISTS times (
    userId TEXT,
    time INTEGER,
    date TEXT
)`);

// --- FONCTIONS ---

// Fonction pour envoyer le message quotidien
async function sendDaily() {
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) return console.error("Salon introuvable ! Vérifiez l'ID.");

    // 1. NETTOYAGE : Supprimer l'ancien message du Zip
    try {
        // On cherche dans les 20 derniers messages
        const fetchedMessages = await channel.messages.fetch({ limit: 20 });
        // On trouve le message du bot qui a le titre "ZIP RANKER"
        const oldMessage = fetchedMessages.find(m => 
            m.author.id === client.user.id && 
            m.embeds.length > 0 && 
            m.embeds[0].title === '⚡ ZIP RANKER'
        );
        
        if (oldMessage) {
            await oldMessage.delete();
            console.log('Ancien message Zip supprimé.');
        }
    } catch (error) {
        console.error("Erreur lors du nettoyage :", error);
    }

    // 2. ENVOI DU NOUVEAU
    const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('⚡ ZIP RANKER')
        .setDescription('**Avez-vous fait le ZIP du jour ?**')
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('daily_check')
                .setLabel('✅ J\'enregistre mon temps')
                .setStyle(ButtonStyle.Success),
        );

    await channel.send({ content: '@here', embeds: [embed], components: [row] });
    console.log('Message quotidien envoyé !');
}

// Fonction pour générer le classement
// interaction est optionnel : s'il est présent, on répond en "invisible", sinon en public
async function sendRanking(type, interaction = null) {
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel && !interaction) return; // Si pas de salon et pas d'interaction, on annule

    let dateCondition = "";
    let title = "";
    
    // Calcul des dates pour SQL
    const now = new Date();
    
    if (type === 'weekly') {
        title = "🏆 Classement de la Semaine";
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateCondition = `WHERE date >= '${lastWeek}'`;
    } else if (type === 'monthly') {
        title = "👑 Classement du Mois";
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        dateCondition = `WHERE date >= '${firstDay}'`;
    }

    const sql = `SELECT userId, SUM(time) as total_time FROM times ${dateCondition} GROUP BY userId ORDER BY total_time DESC`;

    db.all(sql, [], async (err, rows) => {
        if (err) return console.error(err);
        
        // Message si vide
        if (rows.length === 0) {
            const emptyMsg = `Pas de données pour le ${title.toLowerCase()}...`;
            if (interaction) return interaction.reply({ content: emptyMsg, ephemeral: true });
            else return channel.send(emptyMsg);
        }

        let description = "";
        let rank = 1;

        for (const row of rows) {
            let user;
            try {
                user = await client.users.fetch(row.userId);
            } catch (e) {
                user = { username: "Utilisateur inconnu" };
            }

            const minutes = Math.floor(row.total_time / 60);
            const seconds = row.total_time % 60;
            
            let medal = "⚫";
            if (rank === 1) medal = "🥇";
            if (rank === 2) medal = "🥈";
            if (rank === 3) medal = "🥉";

            description += `${medal} **${rank}. ${user.username}** : ${minutes}m ${seconds}s\n`;
            rank++;
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();

        // LOGIQUE D'AFFICHAGE (Public ou Privé)
        if (interaction) {
            // Si c'est une commande /week ou /month -> Invisible (Ephemeral)
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            // Si c'est le CRON -> Public
            await channel.send({ embeds: [embed] });
        }
    });
}

// --- EVENTS ---

client.once(Events.ClientReady, c => {
    console.log(`✅ ZIP RANKER connecté !`);

    // Planification : 9h30 tous les jours
    const dailyTime = process.env.DAILY_TIME || '30 9 * * *';
    cron.schedule(dailyTime, () => {
        sendDaily();
    }, { timezone: "Europe/Paris" });

    // Planification : Vendredi 18h (Hebdo - PUBLIC)
    const weeklyTime = process.env.WEEKLY_TIME || '0 18 * * 5';
    cron.schedule(weeklyTime, () => {
        sendRanking('weekly'); // Pas d'interaction, donc public
    }, { timezone: "Europe/Paris" });

    // Planification : Dernier jour du mois 18h (Mensuel - PUBLIC)
    cron.schedule('0 18 28-31 * *', () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (tomorrow.getMonth() !== today.getMonth()) {
            sendRanking('monthly'); // Pas d'interaction, donc public
        }
    }, { timezone: "Europe/Paris" });
});

client.on(Events.InteractionCreate, async interaction => {
    // Gestion des Commandes Slash (/daily, /week, /month)
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'daily') {
            await interaction.reply({ content: '✅ Message envoyé !', ephemeral: true });
            sendDaily();
        }
        if (interaction.commandName === 'week') {
            // On passe l'interaction pour que ce soit invisible
            sendRanking('weekly', interaction); 
        }
        if (interaction.commandName === 'month') {
            // On passe l'interaction pour que ce soit invisible
            sendRanking('monthly', interaction);
        }
    }

    // Gestion du Bouton
    if (interaction.isButton()) {
        if (interaction.customId === 'daily_check') {
            const modal = new ModalBuilder()
                .setCustomId('timeModal')
                .setTitle('Enregistrer ton temps');

            const timeInput = new TextInputBuilder()
                .setCustomId('timeInput')
                .setLabel('Temps en secondes')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 90 (pour 1m30s)')
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(timeInput);
            modal.addComponents(firstActionRow);
            await interaction.showModal(modal);
        }
    }

    // Gestion du Modal (Réception du temps)
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'timeModal') {
            const input = interaction.fields.getTextInputValue('timeInput');
            const time = parseInt(input);

            if (isNaN(time)) {
                return interaction.reply({ content: '❌ Merci d\'entrer un nombre valide !', ephemeral: true });
            }

            const today = new Date().toISOString().split('T')[0];

            // Vérification si déjà joué aujourd'hui
            db.get("SELECT * FROM times WHERE userId = ? AND date = ?", [interaction.user.id, today], (err, row) => {
                if (row) {
                    // Optionnel : Proposer d'écraser le temps ici plus tard
                    return interaction.reply({ content: '⚠️ Tu as déjà enregistré ton temps aujourd\'hui !', ephemeral: true });
                }

                // Insertion en base
                db.run("INSERT INTO times (userId, time, date) VALUES (?, ?, ?)", [interaction.user.id, time, today], (err) => {
                    if (err) return console.error(err);
                    
                    const minutes = Math.floor(time / 60);
                    const seconds = time % 60;
                    
                    interaction.reply({ 
                        content: `✅ **${minutes}m ${seconds}s** enregistrées !`, 
                        ephemeral: true 
                    });
                });
            });
        }
    }
});

client.login(TOKEN);
