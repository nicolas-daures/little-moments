# Modifier le contenu et les langues

## Activités

Les fichiers `src/data/activities.fr.js` et `src/data/activities.en.js` contiennent chacun un catalogue complet. Ils sont chargés localement, sans API ni service de traduction.

Pour ajouter une activité :

1. Ajoutez une fiche dans chacun des deux fichiers avec le même `id`, puis un `slug` descriptif et unique dans chaque langue (minuscules, chiffres et tirets).
2. Conservez les mêmes valeurs pour `category`, `age`, `time`, `cost` et `place`.
3. Traduisez `title`, `desc`, chaque entrée de `materials`, chaque étape de `steps` et `tip`.
4. Utilisez les mêmes nombres d’éléments et d’étapes dans les deux langues.
5. Lancez `npm run check` puis `npm run format`.

Les catégories internes restent `Créer`, `Explorer`, `Jouer`, `Cuisiner` et `Découvrir`. Leur libellé affiché est traduit par `src/scripts/locale.js`. Les identifiants stables permettent de partager les favoris et les activités vécues entre les deux langues.

Les budgets sont indicatifs et en euros dans les deux langues. Les recettes gardent les quantités métriques et les températures en degrés Celsius.

## Interface et pages

Les messages dynamiques sont centralisés dans `src/scripts/locale.js`. Les pages HTML se trouvent dans `src/pages/`, avec les versions anglaises dans `src/pages/en/`.

Les sélecteurs de langue relient les pages correspondantes. Le choix explicite est enregistré localement ; une visite à la racine suit le choix anglais enregistré, tandis qu’une URL explicite reste accessible dans sa langue. Les nouveaux liens utilisent les pages dédiées, avec des slugs stables dans chaque langue. Ne modifiez pas un `slug` déjà publié sans ajouter une redirection de son ancienne URL. Les anciens liens avec `#activity=` restent pris en charge à l’accueil.

Les informations légales communes se modifient dans `src/config/legal-config.js`. Les champs terminés par `En` permettent de renseigner les formulations anglaises des crédits et durées de conservation.

## Styles et ressources

Modifiez les feuilles CSS dans `src/styles/`. Placez les images, icônes et polices dans `public/`, en conservant leurs licences.

Le build copie les fichiers à leurs URL finales, puis génère les pages d’activités et les sélections. Une référence CSS `fonts/…` est donc relative à la racine publiée, même si sa source se trouve sous `src/styles/`. Pour une page anglaise, les fichiers communs utilisent le préfixe `../`.

## Hors ligne

Modifiez uniquement la logique de `src/service-worker.js`. Le build injecte les constantes `CACHE` et `APP_SHELL`, avec les ressources de base et une version calculée depuis le contenu publié. Les nouvelles pages d’activités et de sélections sont mises en cache au fil des visites, pour éviter de télécharger des centaines de pages à l’installation. Il ne faut plus mettre à jour manuellement le numéro du cache ni sa liste de fichiers.

Le mode développement désactive les nouvelles inscriptions du service worker. Utilisez `npm run build` puis `npm run preview` pour vérifier le fonctionnement avec le cache actif. Si vous avez déjà un ancien service worker sur la même adresse locale, supprimez-le depuis les outils du navigateur.
