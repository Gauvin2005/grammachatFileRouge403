# Scénarios de Tests d'Intégration - Grammachat

## Vue d'ensemble
Ce document décrit les scénarios de tests d'intégration pour l'application Grammachat, basés sur les User Stories du MVP.

## User Stories Testées

### US1: Authentification Utilisateur
**En tant qu'utilisateur, je veux pouvoir créer un compte et me connecter pour accéder à l'application.**

#### Scénario 1.1: Inscription réussie
- **Prérequis**: Aucun
- **Étapes**:
  1. L'utilisateur accède à l'écran d'inscription
  2. Il saisit un email valide, un nom d'utilisateur unique et un mot de passe
  3. Il confirme le mot de passe
  4. Il clique sur "Créer le compte"
- **Résultat attendu**: 
  - Le compte est créé avec succès
  - L'utilisateur est automatiquement connecté
  - Il est redirigé vers l'écran principal
  - Un token JWT est généré et stocké

#### Scénario 1.2: Connexion réussie
- **Prérequis**: Un compte utilisateur existe
- **Étapes**:
  1. L'utilisateur accède à l'écran de connexion
  2. Il saisit son email et mot de passe
  3. Il clique sur "Se connecter"
- **Résultat attendu**:
  - La connexion est réussie
  - L'utilisateur est redirigé vers l'écran principal
  - Ses informations de profil sont chargées

#### Scénario 1.3: Échec d'authentification
- **Prérequis**: Aucun
- **Étapes**:
  1. L'utilisateur saisit des identifiants incorrects
  2. Il tente de se connecter
- **Résultat attendu**:
  - Un message d'erreur approprié est affiché
  - L'utilisateur reste sur l'écran de connexion

### US2: Envoi de Messages
**En tant qu'utilisateur connecté, je veux pouvoir envoyer des messages texte pour communiquer.**

#### Scénario 2.1: Envoi de message sans erreur
- **Prérequis**: Utilisateur connecté
- **Étapes**:
  1. L'utilisateur accède à l'écran de chat
  2. Il tape un message sans erreur orthographique
  3. Il clique sur "Envoyer"
- **Résultat attendu**:
  - Le message est envoyé avec succès
  - Il apparaît dans la liste des messages
  - L'utilisateur gagne de l'XP (bonus pour aucun erreur)
  - Le niveau peut augmenter si le seuil est atteint

#### Scénario 2.2: Envoi de message avec erreurs
- **Prérequis**: Utilisateur connecté
- **Étapes**:
  1. L'utilisateur tape un message avec des erreurs orthographiques
  2. Il envoie le message
- **Résultat attendu**:
  - Le message est envoyé
  - Les erreurs sont détectées et affichées
  - L'utilisateur gagne moins d'XP (pénalité pour erreurs)
  - Les erreurs sont stockées avec le message

### US3: Système de Gamification
**En tant qu'utilisateur, je veux voir mon XP et mon niveau progresser pour être motivé à améliorer mon orthographe.**

#### Scénario 3.1: Gain d'XP et montée de niveau
- **Prérequis**: Utilisateur avec XP proche du seuil de niveau
- **Étapes**:
  1. L'utilisateur envoie un message parfait
  2. Il gagne suffisamment d'XP pour monter de niveau
- **Résultat attendu**:
  - L'XP est mis à jour
  - Le niveau augmente
  - Une notification de félicitations est affichée
  - Le profil utilisateur reflète les changements

#### Scénario 3.2: Affichage du classement
- **Prérequis**: Plusieurs utilisateurs avec différents niveaux d'XP
- **Étapes**:
  1. L'utilisateur accède à l'écran de classement
- **Résultat attendu**:
  - Le classement est affiché par ordre décroissant d'XP
  - L'utilisateur peut voir sa position
  - Les informations sont mises à jour en temps réel

### US4: Gestion du Profil
**En tant qu'utilisateur, je veux pouvoir consulter et modifier mon profil.**

#### Scénario 4.1: Consultation du profil
- **Prérequis**: Utilisateur connecté
- **Étapes**:
  1. L'utilisateur accède à l'écran de profil
- **Résultat attendu**:
  - Toutes les informations du profil sont affichées
  - L'XP et le niveau sont visibles
  - La progression vers le niveau suivant est montrée

#### Scénario 4.2: Modification du profil
- **Prérequis**: Utilisateur connecté
- **Étapes**:
  1. L'utilisateur modifie son nom d'utilisateur
  2. Il sauvegarde les modifications
- **Résultat attendu**:
  - Les modifications sont sauvegardées
  - Le profil est mis à jour
  - Les changements sont reflétés dans toute l'application

### US5: Fonctionnalités Administrateur
**En tant qu'administrateur, je veux pouvoir consulter la liste des utilisateurs.**

#### Scénario 5.1: Accès aux utilisateurs (Admin)
- **Prérequis**: Utilisateur avec rôle administrateur
- **Étapes**:
  1. L'administrateur accède à la liste des utilisateurs
- **Résultat attendu**:
  - La liste complète des utilisateurs est affichée
  - Les informations de base sont visibles
  - La pagination fonctionne correctement

## Tests de Performance

### Scénario P1: Charge de messages
- **Objectif**: Vérifier que l'application peut gérer un grand nombre de messages
- **Étapes**:
  1. Envoyer 100 messages rapidement
  2. Vérifier la réactivité de l'interface
- **Résultat attendu**: L'application reste réactive

### Scénario P2: Synchronisation
- **Objectif**: Vérifier la synchronisation entre app mobile et API
- **Étapes**:
  1. Envoyer un message depuis l'app
  2. Vérifier qu'il apparaît dans l'API
  3. Modifier depuis l'API
  4. Vérifier la mise à jour dans l'app
- **Résultat attendu**: Synchronisation bidirectionnelle fonctionnelle

## Tests de Sécurité

### Scénario S1: Authentification sécurisée
- **Objectif**: Vérifier la sécurité de l'authentification
- **Étapes**:
  1. Tenter d'accéder à une route protégée sans token
  2. Utiliser un token expiré
  3. Utiliser un token invalide
- **Résultat attendu**: Accès refusé dans tous les cas

### Scénario S2: Validation des données
- **Objectif**: Vérifier la validation des entrées utilisateur
- **Étapes**:
  1. Envoyer des données malformées
  2. Envoyer des données avec des caractères spéciaux
  3. Tenter des injections SQL/NoSQL
- **Résultat attendu**: Validation et rejet des données invalides

## Critères d'Acceptation Globaux

1. **Fonctionnalité**: Toutes les fonctionnalités du MVP fonctionnent correctement
2. **Performance**: Temps de réponse < 2 secondes pour les opérations courantes
3. **Sécurité**: Aucune vulnérabilité de sécurité majeure
4. **Stabilité**: L'application ne crash pas lors des tests
5. **Compatibilité**: Fonctionne sur iOS et Android
6. **Accessibilité**: Interface utilisable par tous les utilisateurs

## Outils de Test

- **Backend**: Jest, Supertest
- **Frontend**: Jest, React Native Testing Library
- **Intégration**: Cypress, Detox
- **Performance**: Lighthouse, Flipper
- **Sécurité**: OWASP ZAP, ESLint Security Plugin
