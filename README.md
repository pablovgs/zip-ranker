# ⚡ Zip Ranker - Discord Speedrun Bot

**Zip Ranker** est un bot Discord conçu pour animer une communauté de **Speedrun** (ou de records "Zip").

Il permet aux membres d'enregistrer leurs temps quotidiens sur un challenge spécifique. Contrairement à un tracker classique, **Zip Ranker récompense la rapidité** : le classement est basé sur la **moyenne des temps** la plus basse.

## 🎯 Pourquoi ce bot ?

Idéal pour les serveurs communautaires où les joueurs s'affrontent sur un mini-jeu ou une épreuve quotidienne (ex: *"Le Zip du jour"*).
Il automatise la collecte des scores, calcule les moyennes et gère les classements sans intervention humaine.

## 🚀 Fonctionnalités

- **📅 Daily Challenge** : Un message automatique chaque matin à **9h30** invite les joueurs à poster leur temps.
- **⏱️ Saisie Rapide** : Bouton interactif + Formulaire pour entrer son chrono (en secondes).
- **📊 Logique Speedrun** :
  - Le classement se fait par **Moyenne** (AVG).
  - Tri **Ascendant** (Le plus petit temps est le meilleur).
- **👤 Statistiques Perso (`/stats`)** :
  - Affiche le **Record personnel** (PB).
  - Calcule la **Moyenne globale**.
  - Suit la **Série de jours (Streak 🔥)** pour motiver l'assiduité.
- **🏆 Classements Automatisés** :
  - **Hebdomadaire** : Publié le vendredi à 18h.
  - **Mensuel** : Publié le dernier jour du mois.

## 🛠️ Stack Technique

- **Langage** : Node.js (v20)
- **Framework** : Discord.js v14
- **Data** : SQLite3 (Léger & Local)
- **Infrastructure** : Docker & Docker Compose

## ⚙️ Installation

### Prérequis
- Docker & Docker Compose d'installés.
- Un Bot créé sur le [Discord Developer Portal](https://discord.com/developers/applications).
- L'ID de votre Serveur (Guild ID) pour les commandes instantanées.

### 1. Cloner & Configurer
```bash
git clone [https://github.com/TON_PSEUDO/zip-ranker.git](https://github.com/TON_PSEUDO/zip-ranker.git)
cd zip-ranker
cp .env.example .env
# Remplissez le fichier .env avec vos Tokens et IDs
