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

// --- FONCTIONS UTILITAIRES ---

// Formatte les secondes en "1m 30s"
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}m ${seconds}s`;
}

// Calcule la série (Streak) d'un utilisateur
async function calculateStreak(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT date FROM times WHERE userId = ? ORDER BY date DESC", [userId], (err, rows) => {
            if (err) return reject(err);
            if (!rows || rows.length === 0) return resolve(0);

            // On dédoublonne les dates (au cas où)
            const uniqueDates = [...new Set(rows.map(r => r.date))];
            
            let streak = 0;
            const today = new Date().toISOString().split('T')[0];
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterday = yesterdayDate.toISOString().split('T')[0];

            // Vérifie si la série est active (joué aujourd'hui ou hier)
            if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
                streak = 1;
                // On remonte dans le temps
                for (let i = 0; i < uniqueDates.length - 1; i++) {
                    const d1 = new Date(uniqueDates[i]);
                    const d2 = new Date(uniqueDates[i+1]);
                    const diffTime = Math.abs(d1 - d2);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                    if (diffDays === 1) streak++;
                    else break;
                }
            }
            resolve(streak);
        });
    });
}

// --- FONCTIONS PRINCIPALES ---

async function sendDaily() {
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) return console.error("Salon introuvable !");

    // 1. NETTOYAGE : Supprimer l'ancien message
    try {
        const fetchedMessages = await channel.messages.fetch({ limit: 20 });
        const oldMessage = fetchedMessages.find(m => 
            m.author.id === client.user.id && 
            m.embeds.length > 0 && 
            m.embeds[0].title === '⚡ ZIP DU JOUR'
        );
        if (oldMessage) await oldMessage.delete();
    } catch (error) {
        console.error("Erreur nettoyage :", error);
    }

    // 2. ENVOI DU NOUVEAU
    const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('⚡ ZIP DU JOUR')
        .setDescription('**Quel est ton temps sur le casse-tête du jour ?**\n*Plus c\'est bas, mieux c\'est !*')
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('daily_check')
                .setLabel('⏱️ Enregistrer mon Chrono')
                .setStyle(ButtonStyle.Primary),
        );

    await channel.send({ content: '@here', embeds: [embed], components: [row] });
}

async function sendRanking(type, interaction = null) {
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel && !interaction) return;

    let dateCondition = "";
    let title = "";
    const now = new Date();
    
    if (type === 'weekly') {
        title = "🏆 Classement Semaine (Moyenne)";
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateCondition = `WHERE date >= '${lastWeek}'`;
    } else if (type === 'monthly') {
        title = "👑 Classement Mois (Moyenne)";
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        dateCondition = `WHERE date >= '${firstDay}'`;
    }

    // TRI PAR MOYENNE ASCENDANTE (Le plus petit temps gagne)
    const sql = `SELECT userId, AVG(time) as avg_time, COUNT(*) as games_played FROM times ${dateCondition} GROUP BY userId ORDER BY avg_time ASC`;

    db.all(sql, [], async (err, rows) => {
        if (err) return console.error(err);
        
        if (rows.length === 0) {
            const msg = `Pas de données pour le ${title.toLowerCase()}...`;
            return interaction ? interaction.reply({ content: msg, ephemeral: true }) : channel.send(msg);
        }

        let description = "";
        let rank = 1;

        for (const row of rows) {
            let user;
            try { user = await client.users.fetch(row.userId); } 
            catch (e) { user = { username: "Inconnu" }; }

            let medal = "⚫";
            if (rank === 1) medal = "🥇";
            if (rank === 2) medal = "🥈";
            if (rank === 3) medal = "🥉";

            description += `${medal} **${rank}. ${user.username}** : ${formatTime(row.avg_time)} *(${row.games_played} essais)*\n`;
            rank++;
        }

        const embed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle(title)
            .setDescription(description)
            .setFooter({ text: "Classement Speedrun : La moyenne la plus basse gagne !" })
            .setTimestamp();

        if (interaction) await interaction.reply({ embeds: [embed], ephemeral: true });
        else await channel.send({ embeds: [embed] });
    });
}

// --- EVENTS ---

client.once(Events.ClientReady, c => {
    console.log(`✅ BOT CONNECTÉ : ${c.user.tag}`);

    // Cron Quotidien (9h30)
    cron.schedule(process.env.DAILY_TIME || '30 9 * * *', () => sendDaily(), { timezone: "Europe/Paris" });

    // Cron Hebdo (Vendredi 18h - Public)
    cron.schedule(process.env.WEEKLY_TIME || '0 18 * * 5', () => sendRanking('weekly'), { timezone: "Europe/Paris" });

    // Cron Mensuel (Fin de mois - Public)
    cron.schedule('0 18 28-31 * *', () => {
        const t = new Date();
        const tmr = new Date(t); tmr.setDate(tmr.getDate() + 1);
        if (tmr.getMonth() !== t.getMonth()) sendRanking('monthly');
    }, { timezone: "Europe/Paris" });
});

client.on(Events.InteractionCreate, async interaction => {
    // --- COMMANDES SLASH ---
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'daily') {
            await interaction.reply({ content: '✅', ephemeral: true });
            sendDaily();
        }
        if (interaction.commandName === 'week') sendRanking('weekly', interaction);
        if (interaction.commandName === 'month') sendRanking('monthly', interaction);
        
        // NOUVELLE COMMANDE STATS
        if (interaction.commandName === 'stats') {
            const userId = interaction.user.id;
            db.all("SELECT time, date FROM times WHERE userId = ? ORDER BY date DESC", [userId], async (err, rows) => {
                if (err || !rows || rows.length === 0) {
                    return interaction.reply({ content: "❌ Pas encore de temps enregistré !", ephemeral: true });
                }

                const streak = await calculateStreak(userId);
                const bestTime = Math.min(...rows.map(r => r.time));
                const totalSeconds = rows.reduce((acc, row) => acc + row.time, 0);
                const average = totalSeconds / rows.length;
                const lastTime = rows[0].time;

                const embed = new EmbedBuilder()
                    .setColor(0x3498db)
                    .setTitle(`📊 Stats de ${interaction.user.username}`)
                    .addFields(
                        { name: '🔥 Série (Streak)', value: `${streak} jours`, inline: true },
                        { name: '🧩 Participations', value: `${rows.length}`, inline: true },
                        { name: '\u200B', value: '\u200B', inline: true },
                        { name: '⚡ Dernier', value: formatTime(lastTime), inline: true },
                        { name: '🏆 Record', value: `**${formatTime(bestTime)}**`, inline: true },
                        { name: '📈 Moyenne', value: formatTime(average), inline: true },
                    )
                    .setFooter({ text: "Mode Speedrun" });

                await interaction.reply({ embeds: [embed], ephemeral: true });
            });
        }
    }

    // --- BOUTON ---
    if (interaction.isButton() && interaction.customId === 'daily_check') {
        const modal = new ModalBuilder()
            .setCustomId('timeModal')
            .setTitle('⏱️ Ton Temps (Speedrun)');

        const timeInput = new TextInputBuilder()
            .setCustomId('timeInput')
            .setLabel('Temps en secondes')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 95 (pour 1m35s)')
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(timeInput));
        await interaction.showModal(modal);
    }

    // --- MODAL ---
    if (interaction.isModalSubmit() && interaction.customId === 'timeModal') {
        const val = interaction.fields.getTextInputValue('timeInput');
        const time = parseInt(val);

        if (isNaN(time) || time <= 0) return interaction.reply({ content: '❌ Nombre invalide !', ephemeral: true });

        const today = new Date().toISOString().split('T')[0];
        const userId = interaction.user.id;

        db.get("SELECT * FROM times WHERE userId = ? AND date = ?", [userId, today], (err, row) => {
            if (row) return interaction.reply({ content: '⚠️ Tu as déjà joué aujourd\'hui !', ephemeral: true });

            db.run("INSERT INTO times (userId, time, date) VALUES (?, ?, ?)", [userId, time, today], (err) => {
                if (err) console.error(err);
                interaction.reply({ content: `✅ **${formatTime(time)}** enregistré ! (/stats pour voir ta série 🔥)`, ephemeral: true });
            });
        });
    }
});

client.login(TOKEN);
