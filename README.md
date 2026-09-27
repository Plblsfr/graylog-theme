# Graylog Theme

Extension Chrome / Edge qui refait l'interface de Graylog : thème, mise en forme, navigation rapide.

## Installation

1. Décompresser le dossier.
2. `chrome://extensions` (ou `edge://extensions`) → activer le **mode développeur**.
3. **Charger l'extension non empaquetée** → choisir ce dossier.
4. Recharger l'onglet Graylog.

Active d'office sur `graylog.moveon-hotelbb.com` (tous les ports). Pour une autre instance : ouvrir Graylog → icône de l'extension → **Activer ici**.

## Ce que ça change

**Thème** — 9 palettes (Lens, Nord, Dracula, Catppuccin, Tokyo Night, Contraste, Papier, GitHub, Solarized) ou vos propres couleurs. Toutes les couleurs de Graylog sont remappées, graphiques compris.

**Interface** (chaque point s'active séparément)
- Widgets en cartes : coins arrondis, bordure fine, ombre douce ; actions des widgets visibles au survol.
- Boutons et champs modernisés, anneau de focus à la couleur d'accent, badges en pastilles.
- Barre de navigation translucide, onglet actif en pastille.
- Tableaux : en-têtes discrets et **fixes au défilement**, chiffres alignés, survol des lignes, lignes alternées, mode compact.
- **Niveau en liseré** : un trait coloré + fond léger pour ERROR / WARN, à la place des lignes rouges pleines.
- Pleine largeur, barres de défilement fines, compteur in/out masquable.
- Arrondi réglable, polices de l'interface et du code.

**Outils**
- **Palette de commandes — Ctrl+K** : aller à n'importe quelle page (Streams, Inputs, Pipelines…), lancer une recherche, coller un flowId pour tracer la transaction, favoris, pages récentes, changer de thème.
- **Mode focus — Alt+Maj+F** : masque la navigation et la barre latérale, il ne reste que le contenu.
- **Masquer un élément** : cliquer sur ce qui gêne dans Graylog (bannière, bouton, bloc). Réaffichable à tout moment.
- **Badge d'environnement** : bandeau coloré, préfixe `[PROD]` dans le titre de l'onglet et pastille sur son icône.

## Où régler

- **Dans la page** : bouton flottant en bas à droite ou **Alt+Maj+C**. Tous les réglages s'appliquent en direct.
- **Popup** de l'extension : thème, activation, raccourcis vers le personnalisateur, la palette et le masquage.
- **Alt+Maj+T** : activer / désactiver. Raccourcis modifiables dans `chrome://extensions/shortcuts`.

Onglet **Avancé** : CSS personnalisé (avec les couleurs du thème en variables `var(--glt-accent)`…), export / import de la configuration, et **Copier la structure de la page** (balises et classes seulement, aucun log) pour m'aider à ajuster l'extension à votre version de Graylog.

## Comment ça marche

Graylog génère son CSS à la volée avec des noms de classes qui changent d'une version à l'autre. L'extension :
- relit toutes les règles CSS de la page et **remplace chaque couleur** (gris → échelle du thème, couleurs vives → accent / succès / avertissement / erreur selon leur teinte) ;
- s'appuie sur des repères stables (classes Bootstrap, noms de composants, grille des widgets) et, pour la navigation et la barre latérale, sur leur position à l'écran ;
- affiche ses propres outils dans un Shadow DOM, isolé du CSS de Graylog.

Tout est réversible instantanément. L'extension ne lit ni n'envoie aucune donnée.
