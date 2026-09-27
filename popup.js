const $ = (id) => document.getElementById(id);
let cfg = null;
let tab = null;
let covered = false;

function save(patch) {
    Object.assign(cfg, patch);
    chrome.storage.local.set(patch);
    render();
}

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
    [...Object.entries(GLT_THEMES), ['custom', { ...cfg.custom, name: 'Personnalisé' }]].forEach(([id, t]) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `card${cfg.theme === id ? ' selected' : ''}`;
        card.title = id === 'custom' ? 'Couleurs réglables dans « Personnaliser la page »' : t.name;
        card.appendChild(preview(t));
        const name = document.createElement('span');
        name.className = 'card-name';
        name.textContent = t.name;
        if (t.mode === 'light' && id !== 'custom') {
            const m = document.createElement('span');
            m.className = 'card-mode';
            m.textContent = '· clair';
            name.appendChild(m);
        }
        card.appendChild(name);
        card.addEventListener('click', () => save({ theme: id }));
        grid.appendChild(card);
    });
}

function button(label, cls, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
}

function renderSite() {
    const box = $('site');
    box.replaceChildren();
    box.className = 'site';
    const dot = document.createElement('span');
    dot.className = 'dot';
    const txt = document.createElement('span');
    txt.className = 'txt';
    box.append(dot, txt);
    covered = false;

    let url = null;
    try { url = tab && tab.url ? new URL(tab.url) : null; } catch (e) { url = null; }
    if (!url || !/^https?:$/.test(url.protocol)) {
        txt.textContent = 'Ouvrez un onglet Graylog pour personnaliser la page.';
        return;
    }
    const origin = `${url.protocol}//${url.hostname}`;
    const isExtra = (cfg.sites || []).includes(origin);
    covered = url.hostname === GLT_DEFAULT_HOST || isExtra;

    if (covered) {
        box.classList.add('on');
        txt.append(cfg.enabled ? 'Actif sur ' : 'En pause sur ');
        const b = document.createElement('b');
        b.textContent = url.hostname;
        txt.appendChild(b);
        if (isExtra) {
            box.appendChild(button('Retirer', 'btn sm ghost', async () => {
                const sites = cfg.sites.filter((s) => s !== origin);
                await chrome.storage.local.set({ sites });
                cfg.sites = sites;
                await chrome.permissions.remove({ origins: [gltPattern(origin)] }).catch(() => {});
                await gltSyncSites(sites);
                chrome.tabs.reload(tab.id);
                render();
            }));
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
        render();
    }));
}

function render() {
    paintPopup();
    $('enabled').checked = !!cfg.enabled;
    $('skin').checked = !!cfg.skin;
    $('main').classList.toggle('off', !cfg.enabled);
    renderGrid();
    renderSite();
    $('actions').classList.toggle('disabled', !covered);
}

async function sendToTab(type) {
    if (!tab || !covered) return;
    try {
        await chrome.tabs.sendMessage(tab.id, { type });
        window.close();
    } catch (e) {
        // Onglet ouvert avant l'installation : le script n'y est pas encore
        chrome.tabs.reload(tab.id);
        window.close();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => [null]);
    cfg = await chrome.storage.local.get(GLT_DEFAULTS);
    cfg.custom = { ...GLT_DEFAULTS.custom, ...(cfg.custom || {}) };

    $('enabled').addEventListener('change', (e) => save({ enabled: e.target.checked }));
    $('skin').addEventListener('change', (e) => save({ skin: e.target.checked }));
    $('openCustomizer').addEventListener('click', () => sendToTab('glt:customizer'));
    $('openPalette').addEventListener('click', () => sendToTab('glt:palette'));
    $('openPicker').addEventListener('click', () => sendToTab('glt:picker'));
    $('shortcuts').addEventListener('click', (e) => { e.preventDefault(); chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); });

    render();
});
