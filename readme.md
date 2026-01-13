# ⚡ Zip Ranker - Discord Time Tracker

**Zip Ranker** est un bot Discord automatisé conçu pour gamifier et suivre le temps de travail (ou d'apprentissage) d'une communauté.

Il automatise la collecte des temps quotidiens via une interface simple et génère des classements hebdomadaires et mensuels pour motiver les membres.

## 🚀 Fonctionnalités

- **📅 Rappel Automatique** : Envoie un message chaque matin à **9h30** (configurable) avec un ping `@here`.
- **⏱️ Saisie Intuitive** : Bouton interactif + Formulaire (Modal) pour entrer son temps en secondes.
- **🛡️ Anti-Spam** : Empêche un utilisateur d'enregistrer son temps deux fois dans la même journée.
- **🏆 Classements** :
  - **Hebdomadaire** : Publié automatiquement le vendredi à 18h.
  - **Mensuel** : Publié automatiquement le dernier jour du mois à 18h.
- **🐳 Docker Ready** : Entièrement conteneurisé pour un déploiement facile et une maintenance zéro.
- **💾 Persistance** : Base de données SQLite locale (pas de configuration complexe).

## 🛠️ Stack Technique

- **Langage** : Node.js (v20)
- **Librairie** : Discord.js v14
- **Base de données** : SQLite3
- **Déploiement** : Docker & Docker Compose

## ⚙️ Installation

### Prérequis
- Docker & Docker Compose
- Un Bot Discord créé sur le [Developer Portal](https://discord.com/developers/applications)

### 1. Cloner le projet
```bash
git clone [https://github.com/TON_PSEUDO/zip-ranker.git](https://github.com/TON_PSEUDO/zip-ranker.git)
cd zip-ranker
