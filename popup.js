const $ = (id) => document.getElementById(id);
let cfg = null;
let tab = null;

// ---------------------------------------------------------------------------
// Stockage
// ---------------------------------------------------------------------------
function save(patch) {
    Object.assign(cfg, patch);
    chrome.storage.local.set(patch);
    render();
}

let saveTimer;
function saveSoon(patch) {
    Object.assign(cfg, patch);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => chrome.storage.local.set(patch), 120);
    paintPopup();
    renderGrid();
}

// ---------------------------------------------------------------------------
// Rendu
// ---------------------------------------------------------------------------
function paintPopup() {
    const t = gltResolveTheme(cfg);
    const r = document.documentElement;
    ['bg', 'surface', 'border', 'muted', 'text', 'accent'].forEach((k) => r.style.setProperty(`--${k}`, t[k]));
    r.style.setProperty('--on-accent', t.mode === 'light' ? '#ffffff' : t.bg);
    r.classList.toggle('light', t.mode === 'light');
}

function preview(t) {
    const p = document.createElement('div');
    p.className = 'preview';
    p.style.background = t.bg;
    p.innerHTML = `
        <div class="pv-bar" style="background:${t.surface};border-bottom:1px solid ${t.border}"></div>
        <div class="pv-panel" style="background:${t.surface};border:1px solid ${t.border}">
            <div class="pv-line" style="background:${t.text};width:70%"></div>
            <div class="pv-line" style="background:${t.muted};width:45%"></div>
        </div>
        <div class="pv-btn" style="background:${t.accent}"></div>
        <div class="pv-dots">
            <span class="pv-dot" style="background:${t.danger}"></span>
            <span class="pv-dot" style="background:${t.warning}"></span>
            <span class="pv-dot" style="background:${t.success}"></span>
        </div>`;
    return p;
}

function renderGrid() {
    const grid = $('grid');
    grid.replaceChildren();
    const entries = [...Object.entries(GLT_THEMES), ['custom', { ...cfg.custom, name: 'Personnalisé' }]];
    entries.forEach(([id, t]) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `card${cfg.theme === id ? ' selected' : ''}${id === 'custom' ? ' custom' : ''}`;
        card.title = t.name;
        card.appendChild(preview(t));
        const name = document.createElement('span');
        name.className = 'card-name';
        name.textContent = t.name;
        if (id !== 'custom') {
            const m = document.createElement('span');
            m.className = 'card-mode';
            m.textContent = t.mode === 'light' ? '· clair' : '';
            name.appendChild(m);
        }
        card.appendChild(name);
        card.addEventListener('click', () => save({ theme: id }));
        grid.appendChild(card);
    });
}

function renderCustom() {
    $('customBox').hidden = cfg.theme !== 'custom';
    if (cfg.theme !== 'custom') return;
    const box = $('colors');
    if (box.childElementCount !== GLT_COLOR_KEYS.length) {
        box.replaceChildren();
        GLT_COLOR_KEYS.forEach(([key, label]) => {
            const row = document.createElement('label');
            row.className = 'color';
            const input = document.createElement('input');
            input.type = 'color';
            input.dataset.key = key;
            input.addEventListener('input', () => saveSoon({ custom: { ...cfg.custom, [key]: input.value } }));
            const span = document.createElement('span');
            span.textContent = label;
            row.append(input, span);
            box.appendChild(row);
        });
    }
    box.querySelectorAll('input').forEach((i) => { i.value = toHex(cfg.custom[i.dataset.key]); });
    $('customMode').value = cfg.custom.mode || 'dark';
}

function toHex(v) {
    return /^#[0-9a-f]{6}$/i.test(v || '') ? v : '#000000';
}

async function renderSite() {
    const box = $('site');
    box.replaceChildren();
    box.className = 'site';
    const dot = document.createElement('span');
    dot.className = 'dot';
    const txt = document.createElement('span');
    txt.className = 'txt';
    box.append(dot, txt);

    let url = null;
    try { url = tab && tab.url ? new URL(tab.url) : null; } catch (e) { url = null; }
    if (!url || !/^https?:$/.test(url.protocol)) {
        txt.textContent = 'Ouvrez un onglet Graylog pour voir le résultat.';
        return;
    }
    const origin = `${url.protocol}//${url.hostname}`;
    const isDefault = url.hostname === GLT_DEFAULT_HOST;
    const isExtra = (cfg.sites || []).includes(origin);

    if (isDefault || isExtra) {
        box.classList.add('on');
        txt.innerHTML = '';
        txt.append(cfg.enabled ? 'Appliqué sur ' : 'En pause sur ');
        const b = document.createElement('b');
        b.textContent = url.hostname;
        txt.appendChild(b);
        if (isExtra) {
            const rm = button('Retirer', 'btn sm ghost', async () => {
                const sites = cfg.sites.filter((s) => s !== origin);
                await chrome.storage.local.set({ sites });
                cfg.sites = sites;
                await chrome.permissions.remove({ origins: [gltPattern(origin)] }).catch(() => {});
                await gltSyncSites(sites);
                chrome.tabs.reload(tab.id);
                renderSite();
            });
            box.appendChild(rm);
        }
        return;
    }

    txt.textContent = `${url.hostname} n'est pas concerné.`;
    box.appendChild(button('Activer ici', 'btn sm primary', async () => {
        const ok = await chrome.permissions.request({ origins: [gltPattern(origin)] });
        if (!ok) return;
        const sites = [...new Set([...(cfg.sites || []), origin])];
        await chrome.storage.local.set({ sites });
        cfg.sites = sites;
        await gltSyncSites(sites);
        chrome.tabs.reload(tab.id);
        renderSite();
    }));
}

function button(label, cls, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
}

function render() {
    paintPopup();
    $('enabled').checked = !!cfg.enabled;
    $('main').classList.toggle('off', !cfg.enabled);
    renderGrid();
    renderCustom();
    renderSite();
}

// ---------------------------------------------------------------------------
// Démarrage
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => [null]);
    cfg = await chrome.storage.local.get(GLT_DEFAULTS);
    cfg.custom = { ...GLT_DEFAULTS.custom, ...(cfg.custom || {}) };

    // Réglages simples
    $('sourceMode').value = cfg.sourceMode;
    $('fontUi').value = cfg.fontUi;
    $('fontMono').value = cfg.fontMono;
    $('compact').checked = !!cfg.compact;
    $('customCss').value = cfg.customCss;
    if (cfg.customCss) $('cssBox').open = true;

    $('enabled').addEventListener('change', (e) => save({ enabled: e.target.checked }));
    $('sourceMode').addEventListener('change', (e) => save({ sourceMode: e.target.value }));
    $('compact').addEventListener('change', (e) => save({ compact: e.target.checked }));
    $('fontUi').addEventListener('input', (e) => saveSoon({ fontUi: e.target.value }));
    $('fontMono').addEventListener('input', (e) => saveSoon({ fontMono: e.target.value }));
    $('customCss').addEventListener('input', (e) => saveSoon({ customCss: e.target.value }));
    $('customCss').addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        e.preventDefault();
        const t = e.target, s = t.selectionStart;
        t.setRangeText('    ', s, t.selectionEnd, 'end');
        saveSoon({ customCss: t.value });
    });
    $('customMode').addEventListener('change', (e) => save({ custom: { ...cfg.custom, mode: e.target.value } }));

    // Partir d'un thème existant
    const from = $('customFrom');
    Object.entries(GLT_THEMES).forEach(([id, t]) => {
        const o = document.createElement('option');
        o.value = id;
        o.textContent = t.name;
        from.appendChild(o);
    });
    $('copyFrom').addEventListener('click', () => {
        const t = GLT_THEMES[from.value];
        save({ custom: { ...t, name: 'Personnalisé' } });
    });

    $('reset').addEventListener('click', async () => {
        const keep = { sites: cfg.sites || [] };
        await chrome.storage.local.clear();
        await chrome.storage.local.set({ ...GLT_DEFAULTS, ...keep });
        location.reload();
    });

    render();
});
