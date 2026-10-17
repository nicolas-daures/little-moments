# Informations légales à finaliser

## Avant de rendre le site public

Ouvrez `src/config/legal-config.js`. Les champs vides sont signalés sur les pages légales : ils ne doivent pas rester vides sur le site public.

1. Complétez l’adresse e-mail de contact à rendre publique (`contactEmail`). N’utilisez pas une adresse professionnelle sans le souhaiter explicitement.
2. Complétez l’adresse et le téléphone de l’éditeur (`publisherAddress`, `publisherPhone`). Si vous choisissez plutôt le régime d’anonymat non professionnel de l’article 1-1 II de la LCEN, communiquez d’abord à l’hébergeur les éléments d’identification requis, vérifiez que cette condition est effectivement remplie, puis activez ensemble `anonymousPublisher` et `identityProvidedToHost`. Ne revendiquez pas cette exception sans vérification.
3. Vérifiez les informations de l’hébergeur correspondant à votre contrat. La configuration contient les coordonnées publiques de Cloudflare, Inc., pour le déploiement prévu sur Cloudflare Pages. Les données de l’éditeur restent distinctes de celles de l’hébergeur.
4. Renseignez `trafficLogsRetention` après vérification de l’offre Cloudflare et des options utilisées. N’inventez pas de durée et ne confondez pas vos journaux optionnels avec les traitements de sécurité propres au fournisseur. Confirmez aussi les conditions de traitement et les garanties applicables aux transferts hors EEE.
5. Vérifiez l’origine et les droits de l’image `public/atelier.webp`, conservée depuis la version d’origine, puis renseignez `illustrationCredit` avec la source et le crédit réellement applicables. Aucun justificatif de sa provenance n’était présent dans le projet ; l’archive ne prétend donc pas que ses droits ont été vérifiés. Remplacez-la par une image dont les droits sont établis si nécessaire.
6. La politique prévoit une conservation des e-mails de 12 mois après le dernier échange, sauf nécessité légale ou litige. Appliquez cette durée dans votre messagerie ou adaptez `emailRetention` à une durée justifiée que vous respecterez.

Les informations manquantes sont regroupées dans un avertissement visible en haut des pages légales. Une fois les champs complétés, cet avertissement disparaît. Le navigateur seul ne permet pas de vérifier les options contractuelles de l’hébergement ou l’origine d’une image.

## Hébergement, droits et ressources

Après publication, vérifiez les cookies et ressources sur l’adresse Cloudflare réelle ; contrôlez les journaux et garanties de traitement auprès de l’hébergeur. L’application ne configure pas votre compte Cloudflare. Les polices locales DM Sans et Manrope sont accompagnées de leurs licences SIL OFL 1.1 dans `public/fonts/`. Les autres ressources ne reçoivent aucune nouvelle licence par cette réorganisation.

Les modifications de `src/config/legal-config.js` sont prises en compte après `npm run build`. Les informations demeurent publiques : ne placez aucun secret dans ce fichier. Des champs terminés par `En` permettent de fournir les formulations anglaises.

## Références utilisées pour les notices

- LCEN, article 1-1 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049568614
- CNIL, information des personnes : https://www.cnil.fr/fr/informer-les-personnes
- CNIL, cookies et traceurs : https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/comment-mettre-mon-site-web-en-conformite
- France Num, CGU : https://www.francenum.gouv.fr/guides-et-conseils/developpement-commercial/site-web/rediger-des-conditions-generales-dutilisation
- Cloudflare, confidentialité : https://www.cloudflare.com/fr-fr/privacypolicy/
- Cloudflare, traitement des données : https://www.cloudflare.com/cloudflare-customer-dpa/
- Cloudflare Pages, statistiques : https://developers.cloudflare.com/pages/how-to/web-analytics/

Mise à jour du projet : 17 octobre 2026. Les notices préparées doivent être adaptées aux coordonnées de l’éditeur et aux réglages réels de l’hébergement ; elles ne constituent pas une certification de conformité.
