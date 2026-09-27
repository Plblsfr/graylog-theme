# Graylog Theme

Extension Chrome / Edge qui change le thème de Graylog.

## Installation

1. Décompresser le dossier.
2. Ouvrir `chrome://extensions` (ou `edge://extensions`), activer le **mode développeur**.
3. **Charger l'extension non empaquetée** → choisir ce dossier.
4. Recharger l'onglet Graylog.

Elle est active d'office sur `graylog.moveon-hotelbb.com` (tous les ports). Pour une autre instance : ouvrir Graylog, cliquer sur l'icône de l'extension → **Activer ici**.

## Utilisation

- **Thèmes prêts à l'emploi** : Lens, Nord, Dracula, Catppuccin, Tokyo Night, Contraste élevé, et en clair Papier, GitHub, Solarized. Le changement est instantané, sans recharger la page.
- **Personnalisé** : dix couleurs (fond, panneaux, bordures, textes, accent, info, succès, avertissement, erreur), avec « Copier » pour partir d'un thème existant.
- **Polices** de l'interface et du code, **tableaux compacts**.
- **CSS personnalisé**, avec les couleurs du thème en variables : `var(--glt-bg)`, `--glt-surface`, `--glt-border`, `--glt-muted`, `--glt-text`, `--glt-accent`, `--glt-info`, `--glt-success`, `--glt-warning`, `--glt-danger`.
- **Alt + Maj + T** : activer / désactiver (modifiable dans `chrome://extensions/shortcuts`).

## Comment ça marche

Graylog génère son CSS à la volée (styled-components, Mantine) avec des noms de classes qui changent d'une version à l'autre. L'extension ne cible donc aucune classe : elle relit toutes les règles CSS de la page et **remplace chaque couleur**.

- Les **gris** sont placés sur l'échelle « fond → texte » de Graylog et reportés sur celle du thème (fond, panneaux, bordures, texte secondaire, texte).
- Les **couleurs vives** sont ramenées selon leur teinte vers l'erreur, l'avertissement, le succès, l'info ou l'accent du thème, en gardant les nuances (survol plus foncé, etc.).
- Les **ombres** et voiles de modale restent sombres ; le texte des boutons et badges est choisi pour rester lisible.
- Les **graphiques** : le fond, les grilles et les libellés suivent le thème ; les couleurs des séries de données ne sont pas touchées.

Les valeurs d'origine sont conservées : changer de thème ou désactiver est immédiat et réversible. Le thème Graylog d'origine (clair ou sombre) est détecté tout seul ; si la détection se trompe, le régler dans le popup (« Thème actuel de Graylog »).

L'extension ne lit ni n'envoie aucune donnée : elle ne fait que modifier les couleurs de la page.
