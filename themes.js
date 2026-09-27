// Thèmes et configuration par défaut — partagé par le script de page, le popup et le service worker.
// Chaque thème décrit une échelle : bg (fond de page) → surface (panneaux) → border → muted (texte secondaire) → text,
// plus les couleurs d'accent et d'état vers lesquelles les couleurs vives de Graylog sont ramenées.

var GLT_DEFAULT_HOST = 'graylog.moveon-hotelbb.com';

var GLT_THEMES = {
    lens: {
        name: 'Lens', mode: 'dark',
        bg: '#111215', surface: '#1a1b20', border: '#2d2e36', muted: '#9a9ba7', text: '#e7e7ec',
        accent: '#a78bfa', info: '#67d4e8', success: '#6ee79a', warning: '#fbbf24', danger: '#f87171'
    },
    nord: {
        name: 'Nord', mode: 'dark',
        bg: '#2e3440', surface: '#3b4252', border: '#4c566a', muted: '#aab3c5', text: '#eceff4',
        accent: '#88c0d0', info: '#8fbcbb', success: '#a3be8c', warning: '#ebcb8b', danger: '#bf616a'
    },
    dracula: {
        name: 'Dracula', mode: 'dark',
        bg: '#21222c', surface: '#282a36', border: '#44475a', muted: '#a4a9c9', text: '#f8f8f2',
        accent: '#bd93f9', info: '#8be9fd', success: '#50fa7b', warning: '#ffb86c', danger: '#ff5555'
    },
    mocha: {
        name: 'Catppuccin', mode: 'dark',
        bg: '#181825', surface: '#1e1e2e', border: '#45475a', muted: '#a6adc8', text: '#cdd6f4',
        accent: '#cba6f7', info: '#89dceb', success: '#a6e3a1', warning: '#fab387', danger: '#f38ba8'
    },
    tokyo: {
        name: 'Tokyo Night', mode: 'dark',
        bg: '#16161e', surface: '#1f2335', border: '#3b4261', muted: '#a9b1d6', text: '#c0caf5',
        accent: '#7aa2f7', info: '#7dcfff', success: '#9ece6a', warning: '#e0af68', danger: '#f7768e'
    },
    oled: {
        name: 'Contraste', mode: 'dark',
        bg: '#000000', surface: '#0e0f11', border: '#3d3f45', muted: '#c2c4cc', text: '#ffffff',
        accent: '#4da3ff', info: '#3fd7ff', success: '#3ddc84', warning: '#ffcc00', danger: '#ff5c5c'
    },
    paper: {
        name: 'Papier', mode: 'light',
        bg: '#f4f5f8', surface: '#ffffff', border: '#dcdfe6', muted: '#6b6d7a', text: '#1b1c21',
        accent: '#7c3aed', info: '#0891b2', success: '#15803d', warning: '#b45309', danger: '#dc2626'
    },
    github: {
        name: 'GitHub', mode: 'light',
        bg: '#f6f8fa', surface: '#ffffff', border: '#d0d7de', muted: '#59636e', text: '#1f2328',
        accent: '#0969da', info: '#1b7c83', success: '#1a7f37', warning: '#9a6700', danger: '#cf222e'
    },
    solarized: {
        name: 'Solarized', mode: 'light',
        bg: '#eee8d5', surface: '#fdf6e3', border: '#d6ccae', muted: '#657b83', text: '#073642',
        accent: '#268bd2', info: '#2aa198', success: '#859900', warning: '#b58900', danger: '#dc322f'
    }
};

var GLT_COLOR_KEYS = [
    ['bg', 'Fond de page'], ['surface', 'Panneaux'], ['border', 'Bordures'], ['muted', 'Texte secondaire'], ['text', 'Texte'],
    ['accent', 'Accent / liens'], ['info', 'Info'], ['success', 'Succès'], ['warning', 'Avertissement'], ['danger', 'Erreur']
];

// Modifications de l'interface : [clé, libellé, description, groupe, actif par défaut]
var GLT_FEATURES = [
    ['cards', 'Widgets en cartes', 'Coins arrondis, bordure fine et ombre douce', 'Apparence', true],
    ['quiet', 'Actions discrètes', 'Les icônes des widgets apparaissent au survol', 'Apparence', true],
    ['buttons', 'Boutons modernes', 'Arrondis, sans dégradé, focus visible', 'Apparence', true],
    ['inputs', 'Champs modernes', 'Arrondis, anneau de focus à la couleur d\'accent', 'Apparence', true],
    ['nav', 'Navigation épurée', 'Barre du haut translucide, liens arrondis', 'Apparence', true],
    ['scrollbars', 'Barres de défilement fines', '', 'Apparence', true],
    ['tables', 'Tableaux modernes', 'En-têtes discrets, chiffres alignés', 'Tableaux', true],
    ['sticky', 'En-têtes fixes', 'L\'en-tête reste visible quand on défile', 'Tableaux', true],
    ['hover', 'Survol des lignes', '', 'Tableaux', true],
    ['level', 'Niveau en liseré', 'Liseré coloré et fond léger selon ERROR / WARN, au lieu de lignes pleines', 'Tableaux', true],
    ['zebra', 'Lignes alternées', '', 'Tableaux', false],
    ['compact', 'Lignes compactes', '', 'Tableaux', false],
    ['wide', 'Pleine largeur', 'Supprime la largeur maximale des pages', 'Mise en page', true],
    ['throughput', 'Masquer le débit in / out', 'Compteur de messages de la barre du haut', 'Mise en page', false],
    ['launcher', 'Bouton flottant', 'Accès rapide au personnalisateur, en bas à droite', 'Mise en page', true]
];

// Pages proposées dans la palette de commandes (Ctrl+K)
var GLT_PAGES = [
    ['Recherche', '/search', 'search'], ['Streams', '/streams', 'streams'], ['Alertes', '/alerts', 'alerts events'],
    ['Définitions d\'événements', '/alerts/definitions', 'event definitions'], ['Notifications', '/alerts/notifications', 'notifications'],
    ['Dashboards', '/dashboards', 'dashboards tableaux de bord'], ['Vue d\'ensemble système', '/system/overview', 'system overview'],
    ['Nœuds', '/system/nodes', 'nodes'], ['Inputs', '/system/inputs', 'inputs entrées'], ['Outputs', '/system/outputs', 'outputs sorties'],
    ['Index', '/system/indices', 'indices index sets'], ['Pipelines', '/system/pipelines', 'pipelines rules règles'],
    ['Lookup tables', '/system/lookuptables', 'lookup tables'], ['Utilisateurs', '/system/users', 'users utilisateurs'],
    ['Content packs', '/system/contentpacks', 'content packs'], ['Configuration', '/system/configurations', 'configurations'],
    ['Sidecars', '/system/sidecars', 'sidecars collectors']
];

var GLT_DEFAULTS = {
    enabled: true,
    theme: 'lens',
    custom: Object.assign({}, GLT_THEMES.lens, { name: 'Personnalisé' }),
    sourceMode: 'auto',      // 'auto' | 'light' | 'dark' : thème actuellement réglé dans Graylog
    fontUi: '',
    fontMono: '',
    customCss: '',
    skin: true,              // modifications de l'interface
    features: Object.fromEntries(GLT_FEATURES.map((f) => [f[0], f[4]])),
    radius: 10,
    levelField: 'level',
    hidden: [],              // [{ selector, label }]
    envs: {},                // { hôte: { label, color, ribbon, title, favicon } }
    favorites: [],           // [{ name, url }]
    searchWindow: 900,       // plage (s) des recherches lancées depuis la palette
    sites: []                // origines supplémentaires (https://hôte)
};

function gltResolveTheme(cfg) {
    if (cfg && cfg.theme === 'custom') return Object.assign({}, GLT_THEMES.lens, cfg.custom || {}, { name: 'Personnalisé' });
    return GLT_THEMES[cfg && cfg.theme] || GLT_THEMES.lens;
}

function gltFeature(cfg, key) {
    const f = (cfg && cfg.features) || {};
    if (key in f) return !!f[key];
    const d = GLT_FEATURES.find((x) => x[0] === key);
    return d ? d[4] : false;
}
