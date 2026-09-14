# Le Cockpit Business — lecockpit-business.fr

Site statique de quatre pages. La page de vente a un seul job : faire réserver
un diagnostic de 45 min. La page webinaire en a un autre : faire s'inscrire au live.

```
site/
├── index.html          la page de vente
├── programme.html      le détail du programme (présenté en call)
├── cgv.html            conditions générales de vente
├── webinaire.html      page d'inscription aux webinaires (/webinaire)
├── assets/styles.css   design system « Ivoire éditorial »
├── assets/script.js    réservation, nav, bandeau, photos, courbe, FAQ, inscription
├── assets/img/         photos des témoignages et captures de preuve
└── serve.py            serveur local sans cache (développement uniquement)
```

Aucune dépendance, aucun build. Les polices viennent de Google Fonts
(Instrument Serif + Manrope). Pour prévisualiser en local :

```bash
cd site && python3 serve.py
```

Puis http://localhost:8788. `serve.py` est un `http.server` ordinaire à une
chose près : il envoie `Cache-Control: no-store`. Sans cela le navigateur
ressert l'ancien CSS après une modification et on débogue un rendu périmé —
c'est arrivé plusieurs fois pendant la construction. Passer un numéro en
argument pour changer de port : `python3 serve.py 3000`.

Ce fichier ne sert qu'au développement local : il n'a pas à être déployé.

---

## 1. À faire en premier — le lien de réservation

Tous les CTA de la page pointent vers **une seule** destination, définie à un
seul endroit : `assets/script.js`, ligne ~14.

```js
var BOOKING_URL = 'https://cal.com/noe-porchier-cizaire/bilan-strategique-ia?utm_source=lp';
```

C'est fait. Le script pose cette URL sur tous les `[data-booking]` des trois
pages, avec `target="_blank"` et `rel="noopener"`. Pour changer de lien de
réservation, il n'y a que cette ligne à toucher.

Si la valeur repasse à `null`, les boutons redeviennent volontairement inertes
et un avertissement s'affiche en console — plutôt que des CTA morts en ligne.

---

## 2. Contenus à fournir

Chaque emplacement manquant est un `<span class="todo" data-todo="…">` : visible
à l'écran en orange encadré, et greppable.

```bash
grep -n 'data-todo=' index.html          # tout lister
grep -c 'data-todo=' index.html          # combien il en reste
```

Quand tout est intégré, supprimer le bloc `--- 19. Placeholders` de
`assets/styles.css` (la classe `.todo` n'aura plus d'usage).

### Témoignages — section 4 (`temoignage-1/2/3-*`)

Trois témoignages, six champs chacun. **Aucun chiffre ne doit être inventé** :
c'est exactement le reproche fait à la version actuelle du site.

| Champ | Clé |
|---|---|
| Prénom + initiale | `temoignage-N-nom` |
| Métier | `temoignage-N-metier` |
| Heures récupérées au méta-audit | `temoignage-N-heures` |
| Ce qui a été délégué | `temoignage-N-taches` |
| Verbatim, 2–3 phrases, ses mots | `temoignage-N-verbatim` |
| Photo | voir ci-dessous |

Les neuf prénoms du bandeau (Cécile, Eleanor, Mohamed, Gaëtan, Louis, Julian,
Camilha, Jérôme, Michel) sont en place ; il reste à choisir lesquels passent
aussi en témoignage détaillé en section 4, et à récupérer leurs verbatims.

**Photos.** Voir « Photos — noms de fichiers » plus haut. Les trois cartes
attendent `temoignage-1.jpg`, `-2` et `-3` ; les personnes à qui elles
correspondent restent à choisir parmi les neuf du bandeau.

### Bandeau défilant — bas du hero

Neuf personnes défilent en boucle continue sous le hero, précédées du compteur
« +25 personnes accompagnées ».

**Où éditer.** Une seule série dans `index.html`, sous `<div class="marquee">`.
`script.js` la duplique autant de fois qu'il faut pour couvrir l'écran, et
recalcule au redimensionnement. Ajouter ou retirer quelqu'un = un seul
`<li class="member">` à toucher.

**Comment la boucle est sans couture.** Chaque série se translate de −100 % de
sa propre largeur en 44 s. Quand la première sort du cadre, la suivante occupe
exactement sa position de départ. En fin de cycle le contenu ne couvre plus que
`(nombre de séries − 1) × largeur d'une série` : il en faut donc toujours au
moins une de plus que ce que l'écran affiche. Le calcul est dans `fillMarquee()`.

**Réglages.** Vitesse : `animation-duration` sur `.marquee__track` (44 s, 34 s
sous 900 px). Pause au survol.

> **Exception d'accessibilité assumée.** Le bandeau défile même quand le système
> demande de réduire les animations (`prefers-reduced-motion`, réglage macOS
> « Réduire les animations »). C'est un choix explicite de Noé. Pour restaurer
> le repli — bandeau figé, une seule série en lignes centrées — remplacer dans
> `styles.css` § 20 la règle `.marquee__track { animation-duration: 44s
> !important; }` par :
>
> ```css
> .marquee { overflow: visible; justify-content: center; mask-image: none; }
> .marquee__track {
>   animation: none; flex: 1 1 auto; max-width: 100%;
>   flex-wrap: wrap; justify-content: center;
>   gap: 18px 8px; padding-inline: var(--gutter);
> }
> .marquee__track[aria-hidden="true"] { display: none; }
> .member { border-right: 0; padding-inline: 22px; }
> ```

### Photos — noms de fichiers

Déposer les images dans `assets/img/temoignages/` sous les noms exacts listés
dans `NOMS-ATTENDUS.txt` (ce fichier tient l'état à jour : déposé / manquant).
Rien à modifier dans le HTML — la page les récupère seule, et tant qu'un fichier
est absent le monogramme reste affiché.

Trois règles qui ont déjà posé problème :

1. **Tout en minuscules.** macOS ne distingue pas la casse, la plupart des
   serveurs web si. `Gaetan.jpg` s'affichait en local et aurait renvoyé une 404
   en production.
2. **Extension `.jpg`**, écrite en dur dans le HTML.
3. **Sans accent ni espace** : `jerome.jpg`, pas `Jérôme.jpg`.

**Poids.** Les fichiers déposés le 31/08 faisaient 1024 px et ~600 Ko chacun,
soit 3 Mo au-dessus de la ligne de flottaison pour des vignettes de 44 px. Ils
sont réduits à 220 px (76 Ko au total) ; les originaux sont conservés dans
`assets/img/temoignages/originaux/`, que le site ne sert pas. Refaire la même
réduction pour toute nouvelle photo :

```bash
sips -Z 220 --setProperty formatOptions 72 assets/img/temoignages/*.jpg
```

### Section 4 — La preuve : ordre du bloc

1. **La vidéo**, pleine largeur, en tête de section.
2. **Les trois cartes** de témoignage.
3. **Le mur de captures WhatsApp.**

**La vidéo** est l'embed Tella fourni le 02/09
(`vid_cmt8j1n4z00n204ju2s5cgyn0`), en 16/9 pleine largeur.

> ⚠️ L'incrustation du lecteur affiche « Cécile - Membre de **l'académie** ».
> Ce titre vient des réglages Tella, pas du HTML — le brief demande de bannir
> ce mot, une seule occurrence sur tout le site, vocabulaire unifié sur « le
> programme ». Deux options : renommer la vidéo dans Tella (par exemple
> « Cécile — Consultante IA »), ou passer `title=1` à `title=0` dans l'URL de
> l'`<iframe>` pour masquer l'incrustation — mais on perd alors l'identification
> à l'écran.

La légende sous la vidéo a été pré-remplie : **Cécile · Consultante IA · +12h**,
repris du bandeau. Le nom de famille reste à compléter (`data-todo="video-nom"`),
le brief demandant nom complet et métier affichés. Vérifier au passage que la
Cécile de la vidéo est bien celle du bandeau — je l'ai déduit du prénom.

### Le mur de captures WhatsApp

Huit emplacements dans `assets/img/preuves/`, à nommer `whatsapp-1.jpg` …
`whatsapp-8.jpg`. Chaque capture déposée remplace d'elle-même son cadre
d'attente — testé. Un emplacement vide reste visible en cadre orange.

La mise en page est en **colonnes CSS** et non en grille : les captures ont des
hauteurs quelconques, une grille les rognerait ou laisserait des trous. Quatre
colonnes en desktop, trois sous 1180 px, deux sous 900, une sous 620.

Le cadre d'attente disparaît via `.proofshot:has(img)` : les images introuvables
étant retirées par le script, le sélecteur ne vise que celles qui ont chargé.

Pour changer le nombre d'emplacements, dupliquer ou supprimer une `<figure
class="proofshot">` en ajustant le numéro. Détails et contraintes dans
`assets/img/preuves/NOMS-ATTENDUS.txt`.

> ⚠️ **Anonymiser avant publication** : masquer numéros de téléphone, photos de
> profil et noms de famille, et obtenir l'accord des personnes citées.

### Section 2 — Ce que tu vas obtenir

Bloc réintroduit le 31/08 à la demande de Noé, alors que le brief l'avait
supprimé (« redondant avec le hero, et en vouvoiement alors que toute la page
tutoie »). Deux adaptations à la copie fournie :

- **Passé au tutoiement** — « Récupère », « tes tâches », « ton business » —
  pour ne pas rompre avec le reste de la page, à trois centimètres du « Tu n'as
  pas un problème d'outil ».
- **Emojis retirés**, le brief interdisant les emojis de titre. La copie a
  ensuite été resserrée en quatre formules courtes, cf. « Les gains » ci-dessous.

**Mise en page.** Un grand titre (`.h2--xl`, jusqu'à 72 px) et la courbe de
performance, rien d'autre. Le bloc a d'abord été essayé en colonnes à filets,
en cartes flottantes, en jauges annulaires puis en quatre formules « + / − » —
inutile de refaire ces tours.

La courbe a perdu son propre titre : « Ce que tu vas obtenir. » sert désormais
de titre unique, et « Ta courbe de performance » faisait doublon juste en
dessous.

**La courbe (`.curve` / `.ramp`).** Un parcours en cinq jalons — J0, J7, J14,
J21, J30 — navigable au clic ou au clavier. Elle raconte **ce qui se met en
place** semaine après semaine, pas les étapes de CAP. Le dernier palier
est la promesse tenue : des systèmes qui tournent la nuit, plus aucune tâche à
faible valeur ajoutée, et 14 heures à remettre dans le business ou à rendre aux
proches.

**L'affordance de clic.** Rien ne disait que les cadres étaient cliquables.
Trois signaux ont été ajoutés : une invite en pilule orange au-dessus
(« Clique sur un jalon »), une **pastille** dans chaque cadre — creuse quand le
jalon est disponible, pleine quand il est actif, dessinée comme les points du
tracé pour qu'on relie le cadre à son point — et un **bec** sous le cadre actif
qui pointe vers le graphe. S'y ajoutent le survol qui soulève la carte et
colore sa bordure, et une bordure au repos plus franche
(`rgba(23,19,15,.13)` au lieu de `.07`).

**Trois étages, une seule commande.**

1. Les **cadres du haut** portent le jour, une accroche et une phrase. Ce sont
   eux les boutons (`role="tab"`).
2. Le **graphe** au milieu : le marqueur, le repère vertical et l'étiquette
   d'heures suivent la sélection.
3. La **légende du bas** donne la semaine et les heures. Elle est
   `aria-hidden` et non cliquable : ces deux informations sont déjà répétées en
   tête de chaque panneau, et deux commandes pour une seule sélection seraient
   une faute d'ergonomie autant que d'accessibilité.

C'est un `tablist` ARIA complet : `aria-selected`, `aria-controls`, flèches
gauche/droite, Home et End. **Sans JavaScript, les cinq panneaux s'affichent à
la suite** — le contenu reste lisible et indexable, le script se contente d'en
masquer quatre. La page ouvre sur la semaine 4, pour montrer le résultat avant
le chemin.

**Géométrie.** Les jalons sont aux abscisses 100, 300, 500, 700, 900 (les
centres des cinq colonnes) et aux ordonnées 245, 201, 142.5, 84, 40 —
proportionnelles aux heures (0, 3, 7, 11, 14 sur 14) dans un viewBox
`1000 × 270`. **Ces deux tableaux sont répétés dans `script.js`** (`ABSCISSES`
et `ORDONNEES`) : les modifier des deux côtés à la fois, sinon le marqueur se
décale du tracé.

Le viewBox garde son ratio, sans `preserveAspectRatio="none"` : c'est ce qui
maintient les pastilles rondes et l'épaisseur du trait régulière.

Piège rencontré : `.ramp__panel` est en `display: grid`, ce qui l'emporte sur le
`display: none` que le navigateur applique à l'attribut `hidden`. D'où la règle
explicite `.ramp__panel[hidden] { display: none; }` — à conserver.

Sous 900 px les cinq cadres passent en colonne, jour à gauche et accroche à
droite.

> ⚠️ Seules les extrémités correspondent au méta-audit : `+0h` au départ et
> `+14h` à J30. Les valeurs intermédiaires (+3h, +7h, +11h) sont illustratives
> et doivent être remplacées par les relevés réels, en gardant l'arrivée calée
> sur 14h.
>
> Le visuel de référence du 31/08 affichait « +25h à 40h » à J30 : c'est le
> chiffre que le brief demandait de supprimer. Il n'a pas été repris.

### Section 6 — Qui est Noé

- `capture-projets`, `capture-skills`, `capture-automatisations`,
  `capture-meta-audit` — captures réelles de la stack Claude. Remplacer le
  `<p class="todo…">` par `<img src="…" alt="…">` dans le `.stack__shot`.
- `ne-fais-plus-1..6` + `-h` — la liste « Ce que je ne fais plus », tâche +
  heures en face. C'est l'élément le plus fort de la section : la remplir en
  priorité. Ajouter ou retirer des `<li>` librement.

### Section 7 — Paramètres du programme

- `modules-parametres` — nombre de modules, durée de chacun, accès limité ou à vie
- `mastermind-parametres` — jour, heure, durée, format de groupe, replay ou non
- `charge-hebdo` — heures par semaine attendues du participant.
  **Apparaît deux fois** : section 6 et FAQ « Je n'ai pas le temps de me former ».

Le déroulé semaine par semaine est pré-rempli, calé sur les trois étapes CAP —
Clarifier en semaine 1, Automatiser en 2 et 3, Piloter en 4. À valider.

### Section 10 — FAQ

- `securite-donnees` — traitement des données professionnelles dans Claude :
  ce qui est partagé, ce qui ne l'est pas, ce qui sert ou non à l'entraînement.
- `apres-30-jours` — passerelle vers le Club, à écrire une fois le Club
  lancé.

---

## 3. Retour en haut de page

Le logo et « Accueil » ciblaient l'ancre `#accueil`, posée sur la barre de
navigation. Celle-ci étant en `position: sticky`, elle est déjà en haut de
l'écran dès qu'on a défilé : le navigateur n'avait donc rien à faire défiler et
le clic ne produisait rien.

Ces liens portent maintenant `data-top`, et `script.js` remonte explicitement en
`scrollTo({ top: 0 })` avant d'effacer le `#` de l'URL. Sur `programme.html` et
`cgv.html`, les mêmes liens pointent vers `index.html` : la navigation complète
arrive naturellement en haut.

## 4. La page Programme

`programme.html`, liée depuis « Programme » dans la barre de navigation et
depuis « Voir le programme » dans le hero. C'est la page présentée en appel.

Adaptée de `programme-altitude.html` (dossier ANTIGRAVITY, laissé intact) :
même contenu, refait dans la DA du site et sur **la même feuille de style** —
il n'y a qu'un `assets/styles.css` pour les deux pages, section 23 pour ce qui
est propre au programme.

**Ce qui a changé par rapport à l'original :**

- Les six modules sont regroupés sous les trois étapes CAP. Le découpage tombe
  juste : Méta-audit + Analyse → **Clarifier**, Réduction + Robotisation →
  **Automatiser**, Évaluation → **Piloter**. Module 0 reste en amont.
- **25h → 14h** partout, **Altitude → Le Cockpit Business**, appel de
  **20 → 45 min**, « prochain cycle M.A.R.R.E. » → « prochain cycle CAP ».
- Le libellé de CTA est le même que sur la page de vente. L'original en avait
  trois différents.
- Les emojis de titre de module sont retirés, conformément à la DA.
- L'avertissement légal précise que les 31 000 € sont une valeur estimée des
  prestations prises séparément, pas un tarif.

> ⚠️ **Numérotation des chapitres.** L'original numérote jusqu'à « Ch 40 » mais
> n'en contient que 35 : il manque les 04 à 07, le 13, le 14. J'ai gardé les
> numéros d'origine — ils correspondent peut-être à ta plateforme — mais les
> trous se voient à la lecture. À renuméroter si ce n'est pas le cas.

## 5. La méthode CAP

M.A.R.R.E. a été remplacée le 02/09 par **CAP** — Clarifier, Automatiser,
Piloter. Trois étapes au lieu de cinq, chacune développée : rail de gauche
(lettre, nom, accroche) et corps à droite plafonné à 68 caractères.

L'étape C porte un encart blanc à deux volets — « Ce n'est pas une IA qui
improvise » et « Et je repasse derrière ». C'est le différenciateur de l'offre :
l'audit de consultant encodé dans Claude, puis relu par Noé. À ne pas rogner
lors d'une future passe de raccourcissement.

Suivent « Pourquoi ça marche alors que le reste échoue » (quatre points en
2 × 2) et « Ce que CAP n'est pas » (trois lignes), puis l'encart « Pourquoi
Claude » conservé de la version précédente.

Le nom apparaît aussi dans le surtitre du hero, la meta description, la FAQ
« J'ai déjà essayé l'IA », la section « Qui est Noé » et le déroulé semaine par
semaine. Le jeu de mots « on en a marre de perdre son temps » disparaît avec
l'ancien nom.

## 6. Décisions inscrites dans la page

- **Un seul libellé de CTA** partout : « Réserver mon diagnostic — 20 min ».
  Ne pas en introduire un cinquième.
- **14h**, jamais 25h. Le chiffre apparaît dans le `<h1>`, la courbe de
  progression, la section 4, le `<title>`, la meta description et
  l'avertissement légal du pied de page.
- **30 jours = délai jusqu'au résultat**, pas la durée du programme. Dissocié
  explicitement en haut de la section 6.
- **Pas de prix, pas de garantie.** La réduction de risque passe par la
  section 8 (transparence sur l'appel) et la FAQ.
- **Tutoiement** sur toute la page, sans exception.
- **CTA toujours orange**, jamais noir (règle DA PRCZ).
- Aucun emoji de titre, aucun fond sombre, aucune grille technique : la
  hiérarchie est portée par la typographie.
- Le mot « académie » n'apparaît nulle part. Vocabulaire unifié : « le programme ».

### Écarts assumés par rapport à la maquette du hero

- Le surtitre `PROGRAMME 30 JOURS` est remplacé par `MÉTHODE CAP`,
  conformément à l'arbitrage sur les 30 jours.
- Le lavis radial bas-gauche de la maquette a été retiré : sur une page longue
  il tombait derrière la bande de preuve et se lisait comme un rectangle clair.
  Le lavis haut-droite, seul mentionné dans la DA, est conservé tel quel — son
  asymétrie contrebalance le centrage du titre.
- La scène produit de la maquette (cartes portrait, carte de conversation,
  graphique en barres du méta-audit) a été supprimée. Le hero est désormais une
  bannière centrée sur une seule colonne : surtitre, titre, sous-titre, CTA,
  micro-ligne. La bande de preuve qui suit est centrée elle aussi, pour rester
  cohérente.

---

## 7. Nom de marque et bulle flottante

Le programme s'appelle **Le Cockpit Business** (renommé depuis « Altitude » le
02/09). Le nom apparaît dans le `<title>`, l'Open Graph, le logo de la barre de
navigation et du pied de page, la légende de la vidéo, la section « 45 minutes »
et l'avertissement légal.

Une **bulle flottante** en bas à droite renvoie vers le groupe WhatsApp
`chat.whatsapp.com/LZnoVTxZ6L6Dxyl7SH1f3x`, présenté comme la version gratuite.
Le vert `#25d366` ne sert qu'au glyphe, pour que le service reste
reconnaissable ; la pastille elle-même est une carte blanche comme le reste de
la page. Sous 720 px elle se réduit au glyphe seul, pour ne pas masquer le
contenu.

> ⚠️ **Risque de confusion à arbitrer.** Le programme payant s'appelle « Le
> Cockpit Business » et la communauté gratuite « Le Cockpit ». Sur la même page,
> un logo « LE COCKPIT business » en haut à gauche et une bulle « Rejoindre Le
> Cockpit » en bas à droite désignent deux choses différentes à un mot près.
> Un nom distinct pour la version gratuite lèverait l'ambiguïté.

## 8. Pages légales

`cgv.html` est en ligne, liée depuis les pieds de page. Quinze articles, un
sommaire ancré, même feuille de style que le reste (section 24).

Deux points relevés sur le texte transmis&nbsp;:

- Il disait « Altitude » à sept endroits. Remplacé par « Le Cockpit Business »
  — le nom commercial doit correspondre à celui affiché sur la page de vente.
  L'éditeur reste **NPC Ventures**, ce qui est le point qui compte juridiquement.
- La date indique « mai 2026 » alors que le nom commercial vient de changer.
  Une mise à jour du texte appelle une mise à jour de la date.

Restent à créer&nbsp;: `/mentions-legales` et `/confidentialite`, toujours liées
dans le vide depuis `index.html` et `programme.html`. La politique de
confidentialité est obligatoire dès lors qu'il y a collecte de données&nbsp;;
l'article 12 des CGV n'en tient pas lieu.

---

## 9. Reste à corriger hors de ce dossier (25h → 14h)

Non traité ici, aucun de ces fichiers ne se trouve dans le dossier de travail :

- `ABOUT ME/ALTITUDE.md`
- `ALTITUDE/Plan-Scale-Altitude.md` — dont la ligne « corriger le 14h→25h », désormais inversée
- `ALTITUDE/ICP_Altitude.md` — scripts de closing et de setting
- Les modules HTML de la formation
- Le site en production

À retirer impérativement de la FAQ en production : « Évidemment que oui. 25
heures, c'est le strict minimum. Certains gagnent 30 à 40 heures. »

---

## 10. La page Webinaire — `/webinaire`

`webinaire.html`, servie sous `/webinaire` en production (nginx essaie
`$uri.html`). En local : http://localhost:8788/webinaire.html.

**Un seul objectif, l'inscription.** Pas de liens de navigation, pas de bouton
« Réserver un appel », pas de bulle WhatsApp : chaque sortie avant le
formulaire est une inscription perdue. La marque renvoie tout de même vers
l'accueil. La communauté WhatsApp n'est proposée qu'**après** l'inscription,
sur l'écran de confirmation.

### Contenu

Le titre, le sous-titre, la date (jeudi 17 septembre, 20h30), la durée
(1 heure) et les quatre points du programme viennent du formulaire
ActiveCampaign n° 117 (https://prcz.activehosted.com/f/117), passés au
tutoiement et sans emoji comme le reste du site. Non repris : la mention
« Places suivies limitées », dont le sens n'est pas clair.

### Le formulaire — ActiveCampaign n° 117

Le `<form>` de la page est le formulaire ActiveCampaign lui-même : action
`https://prcz.activehosted.com/proc.php`, champs `firstname` et `email`, et
les champs cachés relevés sur la page hébergée (`u`, `f`, `s`, `c`, `m`,
`act`, `v`, `or`).

- **Sans JavaScript**, il est envoyé tel quel et ActiveCampaign affiche sa
  propre page de remerciement.
- **Avec** (`assets/script.js`, section 10), il est envoyé comme le fait le
  script officiel d'ActiveCampaign pour ce formulaire : en JSONP, `GET` sur
  `proc.php` avec `jsonp=true`. La réponse appelle `window._show_thank_you`
  (la confirmation remplace le formulaire) ou `window._show_error` (le
  message d'ActiveCampaign s'affiche sous le bouton). Au bout de 15 s sans
  réponse, le bouton est rendu.

Vérifié avec un aller-retour réel vers ActiveCampaign sur une adresse
invalide (aucun contact créé). Le cas « inscription réussie » n'a été testé
qu'en simulant la réponse : **faire une vraie inscription test** avant
d'annoncer le live, et vérifier que le contact arrive dans la bonne liste et
reçoit l'email de confirmation.

`?inscrit=1` affiche aussi la confirmation, pour le cas où une redirection
serait réglée côté ActiveCampaign.

### À chaque nouvelle session

Mettre à jour le titre, le sous-titre, « Au programme » et le bloc
« session » (date, heure). Si la session a son propre formulaire
ActiveCampaign, relever sur sa page hébergée les valeurs de `u`, `f` et `or`
et les reporter dans les champs cachés : le script n'a pas à être modifié.

Les UTM ne sont **pas** transmis : le formulaire 117 n'a pas de champ pour
les recevoir, ActiveCampaign les ignorerait. Pour les enregistrer, ajouter
des champs cachés au formulaire dans ActiveCampaign, puis les reporter ici.

### Données personnelles

Le formulaire collecte prénom et email : la page `/confidentialite`, liée sous
le bouton, devient **obligatoire** avant la mise en ligne (voir § 8).

---

## 11. Images de partage (aperçu des liens)

Sans balise `og:image`, LinkedIn, WhatsApp, Slack… prennent la première
image de la page — c'était la photo de Cécile du bandeau. Chaque page
déclare maintenant sa carte 1200 × 630 :

| Page | Image |
|---|---|
| accueil, programme, CGV | `assets/og/accueil.png` |
| webinaire | `assets/og/webinaire.png` |

Les sources sont en HTML, hors du dossier déployé, dans `og/` à la racine du
dépôt (`accueil.html`, `webinaire.html`, `_base.css` qui reprend la feuille
du site). Pour régénérer après une modification :

```bash
sh og/render.sh
```

Le script utilise Chrome sans interface. **La carte du webinaire porte la
date de la session** : à mettre à jour dans `og/webinaire.html` et à
régénérer à chaque nouveau live.

Les réseaux gardent l'aperçu en cache. Après un changement d'image, forcer la
relecture avec le LinkedIn Post Inspector
(https://www.linkedin.com/post-inspector/) ; les anciens messages déjà
envoyés gardent l'ancien aperçu.
