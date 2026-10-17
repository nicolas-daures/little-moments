# Les petits moments

Un site gratuit, en français et en anglais, pour trouver des activités à vivre en famille. Il propose 95 fiches, des filtres, une recherche, des favoris, un historique local, le partage, l’impression et un mode hors ligne.

Le projet utilise du HTML, du CSS et du JavaScript classiques. Le navigateur n’utilise aucune dépendance externe. Node.js sert à préparer les fichiers et à lancer le serveur local ; Prettier est le seul outil installé pour formater le code.

## Démarrer

Prérequis : **Node.js 22 ou plus** et npm. Après avoir décompressé le projet ou cloné le dépôt, ouvrez un terminal dans le dossier contenant `package.json` :

```bash
npm ci
npm run dev
```

Le site est disponible à `http://127.0.0.1:5173/`, et en anglais à `http://127.0.0.1:5173/en/`.

Modifiez les fichiers de `src/` ou `public/`. Le serveur régénère les fichiers après chaque changement ; **actualisez ensuite le navigateur**. Il n’injecte pas de rechargement automatique. Le service worker est désactivé pour les nouvelles visites dans ce mode de développement, pour éviter les surprises liées au cache.

## Organisation

| Emplacement                  | Contenu                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `src/pages/`                 | Pages HTML françaises et anglaises                       |
| `src/scripts/`               | Interface, logique des activités et langues              |
| `src/styles/`                | Feuilles de styles lisibles                              |
| `src/data/`                  | Les deux catalogues d’activités                          |
| `src/config/legal-config.js` | Informations publiques de l’éditeur et de l’hébergement  |
| `src/service-worker.js`      | Logique du cache hors ligne                              |
| `public/`                    | Illustration, icônes, manifestes, polices et licences    |
| `scripts/`                   | Génération, serveur local et vérifications               |
| `docs/`                      | Instructions pour le contenu et les informations légales |
| `dist/`                      | Site généré pour l’hébergement, exclu de Git             |

Les fichiers sources sont organisés par rôle. Le build conserve les URL existantes en copiant les scripts et styles à la racine de `dist/`, et les pages anglaises dans `dist/en/`.

## Commandes

| Commande               | Résultat                                                                  |
| ---------------------- | ------------------------------------------------------------------------- |
| `npm run dev`          | Génère le site, surveille les sources et lance le serveur local           |
| `npm run build`        | Reconstruit entièrement `dist/` depuis `src/` et `public/`                |
| `npm run preview`      | Sert le résultat de build sur le port 4173, avec le mode hors ligne actif |
| `npm run check`        | Vérifie la syntaxe, les catalogues et les liens locaux                    |
| `npm run format`       | Formate les sources avec Prettier                                         |
| `npm run format:check` | Vérifie le formatage sans modifier les fichiers                           |

Pour changer de port : `npm run dev -- --port 3000` ou `npm run preview -- --port 4000`.

Le build rassemble les fichiers locaux sans framework ni compilation JavaScript, puis génère le service worker. La version du cache dépend du contenu : une modification d’un fichier publié change automatiquement cette version. Deux builds des mêmes sources produisent les mêmes fichiers.

**Ne modifiez pas `dist/` directement** : son contenu est remplacé au prochain build. Le ZIP inclut un résultat déjà généré pour permettre aussi un envoi manuel immédiat.

## Publier sur GitHub et Cloudflare Pages

Versionnez les sources, `public/`, les scripts, la documentation, `package.json` et `package-lock.json`. `node_modules/` et `dist/` sont exclus par la configuration Git fournie.

Dans Cloudflare Pages, reliez votre dépôt et utilisez :

| Réglage            | Valeur                              |
| ------------------ | ----------------------------------- |
| Framework          | Aucun                               |
| Commande de build  | `npm run build`                     |
| Dossier de sortie  | `dist`                              |
| Racine du projet   | Le dossier contenant `package.json` |
| Version de Node.js | 22 ou plus                          |

Pour un envoi manuel, exécutez `npm run build`, puis envoyez tout le contenu de `dist/`, y compris `en/`, `data/` et `fonts/`. Les URL restent identiques à celles de la version précédente.

## Modifier les activités ou les langues

Les catalogues se trouvent dans `src/data/activities.fr.js` et `src/data/activities.en.js`. Les détails sont expliqués dans [docs/CONTENT.md](docs/CONTENT.md).

Le choix de langue, les favoris et les activités vécues restent dans le navigateur. Les favoris et activités vécues sont communs aux deux langues d’une même adresse de site.

## Informations légales avant publication publique

Complétez `src/config/legal-config.js`, puis reconstruisez le site. Les champs manquants restent signalés sur les pages légales.

Consultez [docs/LEGAL_SETUP.md](docs/LEGAL_SETUP.md) pour les coordonnées, les journaux d’hébergement, les droits de l’illustration et les durées de conservation. Cette réorganisation ne remplit pas les informations personnelles encore inconnues et ne constitue pas une certification juridique.

Pour conserver le comportement décrit par la politique de confidentialité, vérifiez vos réglages Cloudflare avant d’activer des statistiques ou des intégrations supplémentaires. L’application ne modifie pas votre compte Cloudflare.

## Ressources et licences

Les polices DM Sans et Manrope sont auto-hébergées ; leurs licences SIL OFL 1.1 sont dans `public/fonts/`. L’origine et les droits de l’illustration `public/atelier.webp` restent à documenter comme indiqué dans les notices. Aucune nouvelle licence générale n’est attribuée au contenu par ce README.
