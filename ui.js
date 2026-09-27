/* Graylog Theme — interface de l'extension dans la page (Shadow DOM, isolée du CSS de Graylog) :
 * bouton flottant, personnalisateur, palette de commandes (Ctrl+K), sélecteur d'éléments, notifications. */
(() => {
    'use strict';
    if (window.__gltUi) return;
    window.__gltUi = true;
    const GLT = window.GLT || (window.GLT = {});

    const ICONS = {
        palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20 2 2 0 0 0 2-2v-.5a2 2 0 0 1 2-2h1.5A4.5 4.5 0 0 0 22 13 10 10 0 0 0 12 2z"/>',
        close: '<path d="M18 6 6 18M6 6l12 12"/>',
        search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
        page: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
        star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
        history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
        bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
        route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
        eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
        eyeoff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2"/>',
        target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>',
        trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
        up: '<path d="m18 15-6-6-6 6"/>',
        focus: '<path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/>',
        copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
        download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
        upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/>',
        flag: '<path d="M4 22V4a1 1 0 0 1 1-1h13l-2 5 2 5H5"/>',
        sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
        code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
        brush: '<path d="M9.06 11.9 17.5 3.5a2.1 2.1 0 0 1 3 3l-8.4 8.44"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>',
        link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'
    };
    const svg = (n, s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function h(tag, attrs = {}, ...kids) {
        const n = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs || {})) {
            if (v === undefined || v === null || v === false) continue;
            if (k === 'class') n.className = v;
            else if (k === 'text') n.textContent = v;
            else if (k === 'html') n.innerHTML = v;
            else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
            else if (k === 'dataset') Object.assign(n.dataset, v);
            else if (v === true) n.setAttribute(k, '');
            else n.setAttribute(k, v);
        }
        for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) n.append(c.nodeType ? c : document.createTextNode(String(c)));
        return n;
    }

    let cfg = GLT.cfg || null;
    const set = (patch) => { Object.assign(cfg, patch); chrome.storage.local.set(patch); };
    const timers = {};
    const setSoon = (key, patch, ms = 180) => {
        Object.assign(cfg, patch);
        clearTimeout(timers[key]);
        timers[key] = setTimeout(() => chrome.storage.local.set(patch), ms);
    };

    // =====================================================================
    // Hôte Shadow DOM
    // =====================================================================
    let host = null, root = null;

    function ensureRoot() {
        if (root) return root;
        host = document.createElement('div');
        host.id = 'glt-ui';
        host.setAttribute('data-glt-ui', '');
        host.style.cssText = 'all: initial; position: fixed; z-index: 2147483001; top: 0; left: 0; width: 0; height: 0;';
        ['keydown', 'keyup', 'keypress'].forEach((t) => host.addEventListener(t, (e) => {
            // on laisse passer nos raccourcis globaux, pas le reste (Graylog a ses propres raccourcis)
            if (!((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) e.stopPropagation();
        }));
        document.documentElement.appendChild(host);
        root = host.attachShadow({ mode: 'open' });
        root.appendChild(h('style', { text: STYLES }));
        paint();
        return root;
    }

    function paint() {
        if (!host || !cfg) return;
        const t = gltResolveTheme(cfg);
        const light = t.mode === 'light';
        const v = {
            bg: t.surface, bg2: t.bg, border: t.border, muted: t.muted, text: t.text, accent: t.accent,
            'on-accent': light ? '#ffffff' : t.bg, danger: t.danger, success: t.success, warning: t.warning
        };
        Object.entries(v).forEach(([k, val]) => host.style.setProperty(`--${k}`, val));
        host.style.setProperty('color-scheme', light ? 'light' : 'dark');
    }

    // =====================================================================
    // Notification
    // =====================================================================
    let toastTimer;
    function toast(msg) {
        ensureRoot();
        let t = root.querySelector('.toast');
        if (!t) { t = h('div', { class: 'toast' }); root.appendChild(t); }
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
    }

    function copy(text) {
        const fallback = () => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;top:-999px;opacity:0';
            document.documentElement.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (e) { /* noop */ }
            ta.remove();
        };
        if (navigator.clipboard) navigator.clipboard.writeText(text).catch(fallback); else fallback();
    }

    // =====================================================================
    // Bouton flottant
    // =====================================================================
    function syncLauncher() {
        const show = !!(cfg && cfg.enabled && gltFeature(cfg, 'launcher'));
        if (!show && !root) return;
        ensureRoot();
        let b = root.querySelector('.launcher');
        if (!show) { if (b) b.remove(); return; }
        if (!b) {
            b = h('button', { class: 'launcher', type: 'button', title: 'Personnaliser Graylog (Alt+Maj+C)\nPalette de commandes : Ctrl+K', html: svg('palette', 18), onclick: () => toggleCustomizer() });
            root.appendChild(b);
        }
        b.classList.toggle('hidden', !!(panel && panel.isConnected));
    }

    // =====================================================================
    // Personnalisateur
    // =====================================================================
    let panel = null, currentTab = 'theme';
    const syncers = [];

    function field(label, control, hint) {
        return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label, hint ? h('small', { text: hint }) : null), control);
    }

    function toggle(checked, onchange) {
        const input = h('input', { type: 'checkbox' });
        input.checked = !!checked;
        input.addEventListener('change', () => onchange(input.checked));
        return { input, el: h('span', { class: 'switch' }, input, h('span', { class: 'slider' })) };
    }

    function bindToggle(label, hint, read, write) {
        const t = toggle(read(), write);
        syncers.push(() => { t.input.checked = !!read(); });
        return h('label', { class: 'row' }, h('span', { class: 'row-text' }, h('span', { text: label }), hint ? h('small', { text: hint }) : null), t.el);
    }

    function bindInput(input, read, write, key) {
        input.value = read() ?? '';
        input.addEventListener('input', () => write(input.value));
        syncers.push(() => { if (root.activeElement !== input) input.value = read() ?? ''; });
        return input;
    }

    function openCustomizer(tab) {
        ensureRoot();
        if (tab) currentTab = tab;
        if (panel && panel.isConnected) { showTab(currentTab); return; }
        closePalette();
        syncers.length = 0;
        panel = buildPanel();
        root.appendChild(panel);
        syncers.forEach((f) => f());
        requestAnimationFrame(() => panel.classList.add('open'));
        showTab(currentTab);
        syncLauncher();
    }

    function closeCustomizer() {
        if (!panel) return;
        const p = panel;
        panel = null;
        p.classList.remove('open');
        setTimeout(() => p.remove(), 180);
        syncLauncher();
    }

    function toggleCustomizer() { if (panel && panel.isConnected) closeCustomizer(); else openCustomizer(); }

    function showTab(id) {
        currentTab = id;
        if (!panel) return;
        panel.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === id));
        panel.querySelectorAll('.pane').forEach((p) => { p.hidden = p.dataset.tab !== id; });
    }

    const TABS = [['theme', 'Thème', 'brush'], ['ui', 'Interface', 'sliders'], ['hide', 'Masquer', 'eyeoff'], ['env', 'Badge', 'flag'], ['more', 'Avancé', 'code']];

    function buildPanel() {
        const power = toggle(cfg.enabled, (v) => set({ enabled: v }));
        syncers.push(() => { power.input.checked = !!cfg.enabled; });
        power.el.title = 'Activer / désactiver l\'extension (Alt+Maj+T)';

        const p = h('aside', { class: 'panel', role: 'dialog', 'aria-label': 'Personnaliser Graylog' },
            h('header', { class: 'panel-head' },
                h('span', { class: 'panel-logo', html: svg('palette', 16) }),
                h('strong', { text: 'Personnaliser' }),
                h('span', { class: 'spacer' }),
                power.el,
                h('button', { class: 'icon', type: 'button', title: 'Fermer (Échap)', html: svg('close'), onclick: closeCustomizer })),
            h('nav', { class: 'tabs' }, TABS.map(([id, label, ic]) => h('button', {
                class: 'tab', type: 'button', dataset: { tab: id }, html: `${svg(ic, 14)}<span>${label}</span>`, onclick: () => showTab(id)
            }))),
            h('div', { class: 'panes' },
                paneTheme(), paneUi(), paneHide(), paneEnv(), paneMore()),
            h('footer', { class: 'panel-foot' },
                h('span', { html: '<kbd>Ctrl</kbd>+<kbd>K</kbd> palette · <kbd>Alt</kbd>+<kbd>Maj</kbd>+<kbd>F</kbd> focus' })));
        p.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !picking) { e.preventDefault(); closeCustomizer(); } });
        return p;
    }

    // ---------- Onglet Thème ----------
    function themePreview(t) {
        return h('div', {
            class: 'pv', style: `background:${t.bg}`,
            html: `<div class="pv-bar" style="background:${t.surface};border-bottom:1px solid ${t.border}"></div>
                <div class="pv-card" style="background:${t.surface};border:1px solid ${t.border}">
                  <i style="background:${t.text};width:68%"></i><i style="background:${t.muted};width:42%"></i></div>
                <div class="pv-btn" style="background:${t.accent}"></div>
                <div class="pv-dots"><b style="background:${t.danger}"></b><b style="background:${t.warning}"></b><b style="background:${t.success}"></b></div>`
        });
    }

    function paneTheme() {
        const grid = h('div', { class: 'themes' });
        const renderGrid = () => {
            grid.replaceChildren(...[...Object.entries(GLT_THEMES), ['custom', { ...cfg.custom, name: 'Personnalisé' }]].map(([id, t]) =>
                h('button', { class: `theme${cfg.theme === id ? ' selected' : ''}`, type: 'button', title: t.name, onclick: () => set({ theme: id }) },
                    themePreview(t), h('span', { class: 'theme-name' }, t.name, t.mode === 'light' && id !== 'custom' ? h('small', { text: ' clair' }) : null))));
        };
        syncers.push(renderGrid);
        renderGrid();

        // Couleurs personnalisées
        const colors = h('div', { class: 'colors' });
        const customBox = h('div', { class: 'custom' });
        const from = h('select', {}, Object.entries(GLT_THEMES).map(([id, t]) => h('option', { value: id, text: t.name })));
        const mode = h('select', {}, h('option', { value: 'dark', text: 'Sombre' }), h('option', { value: 'light', text: 'Clair' }));
        mode.addEventListener('change', () => set({ custom: { ...cfg.custom, mode: mode.value } }));
        GLT_COLOR_KEYS.forEach(([k, label]) => {
            const input = h('input', { type: 'color' });
            input.addEventListener('input', () => setSoon('custom', { custom: { ...cfg.custom, [k]: input.value } }, 120));
            colors.appendChild(h('label', { class: 'color' }, input, h('span', { text: label })));
            syncers.push(() => { if (root.activeElement !== input) input.value = /^#[0-9a-f]{6}$/i.test(cfg.custom[k] || '') ? cfg.custom[k] : '#000000'; });
        });
        customBox.append(
            h('div', { class: 'inline' }, h('span', { class: 'muted', text: 'Partir de' }), from,
                h('button', { class: 'btn sm', type: 'button', text: 'Copier', onclick: () => set({ custom: { ...GLT_THEMES[from.value], name: 'Personnalisé' } }) }),
                h('span', { class: 'spacer' }), mode),
            colors);
        syncers.push(() => { customBox.hidden = cfg.theme !== 'custom'; mode.value = cfg.custom.mode || 'dark'; });

        const source = h('select', {}, h('option', { value: 'auto', text: 'Détection auto' }), h('option', { value: 'dark', text: 'Sombre' }), h('option', { value: 'light', text: 'Clair' }));
        source.addEventListener('change', () => set({ sourceMode: source.value }));
        syncers.push(() => { source.value = cfg.sourceMode || 'auto'; });

        const fontUi = bindInput(h('input', { type: 'text', list: 'glt-fonts-ui', placeholder: 'Police de Graylog' }), () => cfg.fontUi, (v) => setSoon('fontUi', { fontUi: v }, 400));
        const fontMono = bindInput(h('input', { type: 'text', list: 'glt-fonts-mono', placeholder: 'Police de Graylog' }), () => cfg.fontMono, (v) => setSoon('fontMono', { fontMono: v }, 400));

        return h('section', { class: 'pane', dataset: { tab: 'theme' } },
            grid, customBox,
            h('h4', { text: 'Typographie' }),
            field('Police de l\'interface', fontUi),
            field('Police du code et de l\'éditeur', fontMono),
            h('datalist', { id: 'glt-fonts-ui' }, ['Inter, system-ui, sans-serif', 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', '"IBM Plex Sans", system-ui, sans-serif', '"Segoe UI", sans-serif'].map((v) => h('option', { value: v }))),
            h('datalist', { id: 'glt-fonts-mono' }, ['"JetBrains Mono", "Cascadia Code", Consolas, monospace', '"Fira Code", monospace', 'Consolas, "Courier New", monospace', 'ui-monospace, Menlo, monospace'].map((v) => h('option', { value: v }))),
            h('h4', { text: 'Détection' }),
            field('Thème actuellement réglé dans Graylog', source, 'À forcer seulement si les couleurs semblent inversées'));
    }

    // ---------- Onglet Interface ----------
    function paneUi() {
        const master = bindToggle('Modifier l\'interface', 'Désactiver pour ne garder que les couleurs', () => cfg.skin, (v) => set({ skin: v }));
        master.classList.add('master');

        const radius = h('input', { type: 'range', min: '0', max: '18', step: '1' });
        const radiusVal = h('span', { class: 'range-val' });
        radius.addEventListener('input', () => { radiusVal.textContent = `${radius.value} px`; setSoon('radius', { radius: Number(radius.value) }, 60); });
        syncers.push(() => { if (root.activeElement !== radius) radius.value = cfg.radius ?? 10; radiusVal.textContent = `${radius.value} px`; });

        const groups = {};
        GLT_FEATURES.forEach(([k, label, hint, group]) => {
            (groups[group] = groups[group] || []).push(bindToggle(label, hint, () => gltFeature(cfg, k), (v) => set({ features: { ...(cfg.features || {}), [k]: v } })));
        });

        const levelField = bindInput(h('input', { type: 'text', placeholder: 'level' }), () => cfg.levelField, (v) => setSoon('levelField', { levelField: v || 'level' }, 400));

        const body = h('div', { class: 'ui-body' },
            h('div', { class: 'field' }, h('span', { class: 'field-label', text: 'Arrondi des angles' }), h('div', { class: 'range' }, radius, radiusVal)),
            ...Object.entries(groups).map(([g, rows]) => h('div', { class: 'group' }, h('h4', { text: g }), rows)),
            field('Champ du niveau', levelField, 'Colonne ou clé JSON utilisée pour le liseré (ERROR, WARN…)'),
            h('button', { class: 'btn wide', type: 'button', html: `${svg('focus', 14)}<span>Basculer le mode focus</span><kbd>Alt+Maj+F</kbd>`, onclick: () => GLT.skin && GLT.skin.setFocus(!GLT.skin.focus) }));
        syncers.push(() => body.classList.toggle('disabled', !cfg.skin));

        return h('section', { class: 'pane', dataset: { tab: 'ui' } }, master, body);
    }

    // ---------- Onglet Éléments ----------
    function paneHide() {
        const list = h('div', { class: 'hidden-list' });
        const render = () => {
            const items = cfg.hidden || [];
            list.replaceChildren(...(items.length ? items.map((it, i) => {
                let n = 0;
                try { n = document.querySelectorAll(it.selector).length; } catch (e) { n = -1; }
                return h('div', { class: 'hidden-item' },
                    h('div', { class: 'hidden-text' }, h('span', { text: it.label || 'Élément' }), h('code', { text: it.selector, title: it.selector })),
                    h('span', { class: 'badge', text: n < 0 ? 'invalide' : n ? `${n} ici` : 'absent', title: 'Nombre d\'éléments concernés sur cette page' }),
                    h('button', { class: 'icon', type: 'button', title: 'Réafficher', html: svg('eye', 15), onclick: () => set({ hidden: items.filter((_, j) => j !== i) }) }));
            }) : [h('p', { class: 'empty', text: 'Aucun élément masqué. Cliquez sur le bouton ci-dessus puis sur ce qui vous gêne dans Graylog (bannière, bouton, bloc…).' })]));
        };
        syncers.push(render);
        render();
        return h('section', { class: 'pane', dataset: { tab: 'hide' } },
            h('button', { class: 'btn primary wide', type: 'button', html: `${svg('target', 15)}<span>Choisir un élément à masquer</span>`, onclick: () => startPicker() }),
            h('p', { class: 'hint', text: 'Survolez la page puis cliquez. « Parent » élargit la sélection, Échap annule. Le masquage s\'applique sur toutes les pages où l\'élément apparaît.' }),
            list,
            h('button', { class: 'btn sm ghost', type: 'button', text: 'Tout réafficher', onclick: () => set({ hidden: [] }) }));
    }

    // ---------- Onglet Environnement ----------
    const ENV_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#64748b'];

    function paneEnv() {
        const hostName = location.hostname;
        const env = () => ({ label: '', color: '#ef4444', ribbon: true, title: true, favicon: true, ...((cfg.envs || {})[hostName] || {}) });
        const save = (patch, soon) => {
            const envs = { ...(cfg.envs || {}), [hostName]: { ...env(), ...patch } };
            if (soon) setSoon('env', { envs }, 300); else set({ envs });
        };
        const label = bindInput(h('input', { type: 'text', list: 'glt-env-labels', placeholder: 'ex. PROD', maxlength: '16' }), () => env().label, (v) => save({ label: v.toUpperCase() }, true));
        const swatches = h('div', { class: 'swatches' });
        const custom = h('input', { type: 'color', title: 'Autre couleur' });
        custom.addEventListener('input', () => save({ color: custom.value }, true));
        const renderSw = () => {
            swatches.replaceChildren(...ENV_COLORS.map((c) => h('button', { type: 'button', class: `sw${env().color === c ? ' on' : ''}`, style: `background:${c}`, title: c, onclick: () => save({ color: c }) })), custom);
            if (root.activeElement !== custom) custom.value = env().color;
        };
        syncers.push(renderSw);
        renderSw();
        const preview = h('div', { class: 'env-preview' });
        syncers.push(() => {
            const e = env();
            preview.replaceChildren(
                h('div', { class: 'env-line', style: `background:${e.color}` }),
                h('span', { class: 'env-badge', style: `background:${e.color}`, text: e.label || 'PROD' }),
                h('span', { class: 'muted', text: e.label ? `[${e.label}] Graylog — Search` : 'Aperçu' }));
            preview.classList.toggle('dim', !e.label);
        });
        return h('section', { class: 'pane', dataset: { tab: 'env' } },
            h('p', { class: 'hint', html: `Signale clairement sur quelle instance vous êtes. Réglage propre à <b>${esc(hostName)}</b>.` }),
            preview,
            field('Libellé', label, 'Vide = aucun badge'),
            h('datalist', { id: 'glt-env-labels' }, ['PROD', 'PREPROD', 'RECETTE', 'STAGING', 'DEV', 'LOCAL'].map((v) => h('option', { value: v }))),
            h('div', { class: 'field' }, h('span', { class: 'field-label', text: 'Couleur' }), swatches),
            bindToggle('Bandeau en haut de page', '', () => env().ribbon !== false, (v) => save({ ribbon: v })),
            bindToggle('Préfixe dans le titre de l\'onglet', '', () => env().title !== false, (v) => save({ title: v })),
            bindToggle('Pastille sur l\'icône de l\'onglet', '', () => env().favicon !== false, (v) => save({ favicon: v })));
    }

    // ---------- Onglet Avancé ----------
    function paneMore() {
        // Favoris de la palette
        const favList = h('div', { class: 'fav-list' });
        const renderFav = () => {
            const favs = cfg.favorites || [];
            favList.replaceChildren(...(favs.length ? favs.map((f, i) => h('div', { class: 'fav' },
                h('span', { class: 'fav-icon', html: svg('star', 13) }),
                h('div', { class: 'hidden-text' }, h('span', { text: f.name }), h('code', { text: f.url })),
                h('button', { class: 'icon', type: 'button', title: 'Supprimer', html: svg('trash', 14), onclick: () => set({ favorites: favs.filter((_, j) => j !== i) }) })))
                : [h('p', { class: 'empty', text: 'Ajoutez des pages ou recherches fréquentes : elles apparaîtront en tête de la palette (Ctrl+K).' })]));
        };
        syncers.push(renderFav);
        renderFav();
        const addFav = () => {
            const name = (document.title || '').replace(/^\[[^\]]{1,24}\] /, '').replace(/\s*[-|–]\s*Graylog\s*$/i, '').trim() || location.pathname;
            const url = location.pathname + location.search;
            set({ favorites: [...(cfg.favorites || []).filter((f) => f.url !== url), { name, url }] });
            toast('Page ajoutée aux favoris');
        };

        const win = h('select', {}, [[300, '5 min'], [900, '15 min'], [3600, '1 h'], [14400, '4 h'], [86400, '24 h'], [604800, '7 jours']].map(([v, l]) => h('option', { value: String(v), text: l })));
        win.addEventListener('change', () => set({ searchWindow: Number(win.value) }));
        syncers.push(() => { win.value = String(cfg.searchWindow || 900); });

        const css = bindInput(h('textarea', { spellcheck: 'false', rows: '7', placeholder: '/* Exemple */\n[class*="WidgetHeader"] { font-size: 13px; }\n.navbar-brand { color: var(--glt-accent) !important; }' }), () => cfg.customCss, (v) => setSoon('css', { customCss: v }, 350));
        css.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            e.preventDefault();
            css.setRangeText('    ', css.selectionStart, css.selectionEnd, 'end');
            css.dispatchEvent(new Event('input'));
        });

        const fileIn = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
        fileIn.addEventListener('change', async () => {
            const f = fileIn.files[0];
            if (!f) return;
            try {
                const data = JSON.parse(await f.text());
                const patch = {};
                Object.keys(GLT_DEFAULTS).forEach((k) => { if (k in data && k !== 'sites') patch[k] = data[k]; });
                await chrome.storage.local.set(patch);
                toast('Configuration importée');
            } catch (e) { toast('Fichier invalide'); }
            fileIn.value = '';
        });

        return h('section', { class: 'pane', dataset: { tab: 'more' } },
            h('h4', { text: 'Palette de commandes' }),
            field('Plage des recherches lancées depuis la palette', win),
            h('div', { class: 'inline' }, h('span', { class: 'field-label', text: 'Favoris' }), h('span', { class: 'spacer' }),
                h('button', { class: 'btn sm', type: 'button', html: `${svg('plus', 13)}<span>Page actuelle</span>`, onclick: addFav })),
            favList,
            h('h4', { text: 'CSS personnalisé' }),
            css,
            h('p', { class: 'hint', html: 'Couleurs du thème : <code>var(--glt-accent)</code>, <code>--glt-bg</code>, <code>--glt-surface</code>, <code>--glt-border</code>, <code>--glt-text</code>, <code>--glt-muted</code>, <code>--glt-danger</code>…' }),
            h('h4', { text: 'Configuration' }),
            h('div', { class: 'btn-row' },
                h('button', {
                    class: 'btn sm', type: 'button', html: `${svg('download', 13)}<span>Exporter</span>`,
                    onclick: () => chrome.storage.local.get(null, (all) => {
                        const out = {};
                        Object.keys(GLT_DEFAULTS).forEach((k) => { if (k in all && k !== 'sites') out[k] = all[k]; });
                        const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })), download: 'graylog-theme.json' });
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
                    })
                }),
                h('button', { class: 'btn sm', type: 'button', html: `${svg('upload', 13)}<span>Importer</span>`, onclick: () => fileIn.click() }),
                h('button', {
                    class: 'btn sm danger', type: 'button', text: 'Réinitialiser',
                    onclick: async (e) => {
                        const b = e.currentTarget;
                        if (!b.dataset.confirm) { b.dataset.confirm = '1'; b.textContent = 'Confirmer ?'; setTimeout(() => { delete b.dataset.confirm; b.textContent = 'Réinitialiser'; }, 3000); return; }
                        const { sites = [] } = await chrome.storage.local.get('sites');
                        await chrome.storage.local.clear();
                        await chrome.storage.local.set({ ...GLT_DEFAULTS, sites });
                        toast('Configuration réinitialisée');
                    }
                }), fileIn),
            h('h4', { text: 'Diagnostic' }),
            h('p', { class: 'hint', text: 'Copie la structure de la page (balises et classes uniquement, aucun contenu de log) pour ajuster l\'extension à votre version de Graylog.' }),
            h('button', { class: 'btn sm', type: 'button', html: `${svg('copy', 13)}<span>Copier la structure de la page</span>`, onclick: () => { copy(outline()); toast('Structure copiée dans le presse-papiers'); } }));
    }

    // =====================================================================
    // Palette de commandes
    // =====================================================================
    let pal = null;

    function openPalette() {
        ensureRoot();
        if (pal) { pal.input.focus(); pal.input.select(); return; }
        const input = h('input', { class: 'pal-input', type: 'text', placeholder: 'Aller à une page, lancer une recherche, coller un flowId…', spellcheck: 'false', autocomplete: 'off' });
        const list = h('div', { class: 'pal-list', role: 'listbox' });
        const box = h('div', { class: 'pal', role: 'dialog', 'aria-label': 'Palette de commandes' },
            h('div', { class: 'pal-head', html: svg('search', 17) }, input, h('kbd', { text: 'Échap' })),
            list,
            h('div', { class: 'pal-foot', html: '<span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span><span><kbd>Entrée</kbd> ouvrir</span><span><kbd>Ctrl</kbd>+<kbd>Entrée</kbd> nouvel onglet</span>' }));
        const overlay = h('div', { class: 'pal-overlay', onmousedown: (e) => { if (e.target === overlay) closePalette(); } }, box);
        root.appendChild(overlay);
        pal = { overlay, input, list, items: [], index: 0, recents: [] };
        chrome.storage.local.get({ recents: {} }, ({ recents }) => { if (pal) { pal.recents = recents[location.hostname] || []; renderPalette(); } });
        input.addEventListener('input', () => { pal.index = 0; renderPalette(); });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
            else if (e.key === 'Enter') { e.preventDefault(); run(pal.items[pal.index], e.ctrlKey || e.metaKey); }
            else if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
        });
        renderPalette();
        requestAnimationFrame(() => { overlay.classList.add('open'); input.focus(); });
    }

    function closePalette() {
        if (!pal) return;
        const o = pal.overlay;
        pal = null;
        o.classList.remove('open');
        setTimeout(() => o.remove(), 150);
    }

    function togglePalette() { if (pal) closePalette(); else openPalette(); }

    function move(d) {
        if (!pal.items.length) return;
        pal.index = (pal.index + d + pal.items.length) % pal.items.length;
        paintSelection();
    }

    function paintSelection() {
        pal.list.querySelectorAll('.pal-item').forEach((n, i) => {
            n.classList.toggle('active', i === pal.index);
            if (i === pal.index) n.scrollIntoView({ block: 'nearest' });
        });
    }

    function searchUrl(q, seconds) {
        const p = new URLSearchParams({ q, rangetype: 'relative', relative: String(seconds || cfg.searchWindow || 900) });
        return `/search?${p.toString()}`;
    }

    function score(text, q) {
        if (!q) return 1;
        const t = text.toLowerCase();
        const i = t.indexOf(q);
        if (i >= 0) return 100 - i - (t.length - q.length) * 0.05;
        let ti = 0, s = 0;
        for (const ch of q) {
            const f = t.indexOf(ch, ti);
            if (f < 0) return 0;
            s += f === ti ? 2 : 1;
            ti = f + 1;
        }
        return s;
    }

    function commands(q) {
        const out = [];
        const raw = q.trim();
        const ql = raw.toLowerCase();
        const nav = (url) => (newTab) => { if (newTab) window.open(url, '_blank'); else location.assign(url); };

        if (raw) {
            const uuid = (raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i) || [])[0];
            if (uuid) out.push({ group: 'Recherche', icon: 'route', label: `Tracer le flow ${uuid.slice(0, 8)}…`, hint: '24 dernières heures', run: nav(searchUrl(`"${uuid}"`, 86400)), s: 1000 });
            out.push({ group: 'Recherche', icon: 'search', label: `Rechercher « ${raw} »`, hint: labelWindow(cfg.searchWindow), run: nav(searchUrl(raw)), s: 999 });
        }
        (cfg.favorites || []).forEach((f) => out.push({ group: 'Favoris', icon: 'star', label: f.name, hint: f.url, run: nav(f.url), s: score(`${f.name} ${f.url}`, ql) + 20 }));
        (pal.recents || []).slice(0, 8).forEach((r) => out.push({ group: 'Récents', icon: 'history', label: r.title, hint: r.path, run: nav(r.url), s: score(`${r.title} ${r.path}`, ql) + 10 }));
        GLT_PAGES.forEach(([label, url, kw]) => out.push({ group: 'Pages', icon: 'page', label, hint: url, run: nav(url), s: score(`${label} ${kw}`, ql) }));

        const actions = [
            ['Personnaliser l\'interface', 'sliders', () => openCustomizer(), 'personnaliser réglages settings customizer'],
            ['Masquer un élément de la page', 'target', () => startPicker(), 'masquer cacher hide élément'],
            [GLT.skin && GLT.skin.focus ? 'Quitter le mode focus' : 'Mode focus', 'focus', () => GLT.skin && GLT.skin.setFocus(!GLT.skin.focus), 'focus plein écran zen'],
            [cfg.enabled ? 'Désactiver le thème' : 'Activer le thème', 'power', () => set({ enabled: !cfg.enabled }), 'thème theme on off activer désactiver'],
            ['Ajouter la page aux favoris', 'star', () => {
                const url = location.pathname + location.search;
                const name = document.title.replace(/^\[[^\]]{1,24}\] /, '').replace(/\s*[-|–]\s*Graylog\s*$/i, '').trim() || url;
                set({ favorites: [...(cfg.favorites || []).filter((f) => f.url !== url), { name, url }] });
                toast('Page ajoutée aux favoris');
            }, 'favori bookmark'],
            ['Copier le lien de la page', 'link', () => { copy(location.href); toast('Lien copié'); }, 'copier lien url partager']
        ];
        actions.forEach(([label, icon, fn, kw]) => out.push({ group: 'Actions', icon, label, run: fn, s: score(`${label} ${kw}`, ql) }));
        Object.entries(GLT_THEMES).forEach(([id, t]) => out.push({
            group: 'Thèmes', icon: 'brush', label: `Thème : ${t.name}`, hint: cfg.theme === id ? 'actuel' : t.mode === 'light' ? 'clair' : 'sombre',
            run: () => set({ theme: id, enabled: true }), s: ql ? score(`theme thème ${t.name}`, ql) : 0, swatch: t.accent
        }));

        return out.filter((c) => c.s > 0 || (!ql && c.group !== 'Thèmes'));
    }

    function labelWindow(s) {
        const m = { 300: '5 dernières minutes', 900: '15 dernières minutes', 3600: 'dernière heure', 14400: '4 dernières heures', 86400: '24 dernières heures', 604800: '7 derniers jours' };
        return m[s || 900] || `${s} s`;
    }

    function renderPalette() {
        const q = pal.input.value;
        const ql = q.trim().toLowerCase();
        let items = commands(q);
        if (ql) items = items.sort((a, b) => b.s - a.s).slice(0, 14);
        else {
            const order = ['Favoris', 'Récents', 'Pages', 'Actions'];
            items = items.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group)).filter((it, i, arr) => it.group !== 'Pages' || arr.filter((x) => x.group === 'Pages').indexOf(it) < 6);
        }
        pal.items = items;
        pal.index = Math.min(pal.index, Math.max(0, items.length - 1));
        const frag = [];
        let last = '';
        items.forEach((it, i) => {
            if (!ql && it.group !== last) { frag.push(h('div', { class: 'pal-group', text: it.group })); last = it.group; }
            const row = h('div', {
                class: `pal-item${i === pal.index ? ' active' : ''}`, role: 'option',
                onmousemove: () => { if (pal.index !== i) { pal.index = i; paintSelection(); } },
                onmousedown: (e) => { e.preventDefault(); run(it, e.ctrlKey || e.metaKey || e.button === 1); }
            },
            h('span', { class: 'pal-icon', html: it.swatch ? `<i class="dot" style="background:${esc(it.swatch)}"></i>` : svg(it.icon, 15) }),
            h('span', { class: 'pal-label', text: it.label }),
            it.hint ? h('span', { class: 'pal-hint', text: it.hint }) : null,
            ql ? h('span', { class: 'pal-tag', text: it.group }) : null);
            frag.push(row);
        });
        if (!items.length) frag.push(h('div', { class: 'pal-empty', text: 'Aucun résultat' }));
        pal.list.replaceChildren(...frag);
    }

    function run(it, newTab) {
        if (!it) return;
        closePalette();
        it.run(newTab);
    }

    // =====================================================================
    // Sélecteur d'éléments à masquer
    // =====================================================================
    let picking = null;

    function stableTokens(el) {
        const out = [];
        for (const c of el.classList) {
            const m = /^([A-Za-z][A-Za-z0-9]*(?:__[A-Za-z0-9]+)?)-sc-[\w-]+$/.exec(c);
            if (m) { out.push(`[class*="${m[1]}-sc-"]`); continue; }
            if (/^(sc-|css-|glt-|jsx-|emotion-)/.test(c)) continue;
            if (/^[a-z]+[A-Z][A-Za-z]*$/.test(c) && c.length <= 8) continue;      // hachage styled-components
            if (/\d{3,}|[0-9a-f]{6,}|_{2}[a-z0-9]{5}$/i.test(c)) continue;         // hachages divers
            if (/^(active|open|in|show|hover|focus|focused|selected|disabled|collapsed|expanded|fade)$/.test(c)) continue;
            out.push(`.${CSS.escape(c)}`);
        }
        return out;
    }

    function nodeSel(el) {
        if (el.id && !/\d{3,}|[:.]/.test(el.id) && !el.id.startsWith('glt')) return `#${CSS.escape(el.id)}`;
        const t = stableTokens(el);
        const role = el.getAttribute('role');
        return el.localName + t.join('') + (!t.length && role ? `[role="${CSS.escape(role)}"]` : '');
    }

    function count(sel) {
        try { return [...document.querySelectorAll(sel)].filter((n) => !n.closest('[data-glt-ui]')).length; } catch (e) { return 0; }
    }

    function selectorFor(el) {
        const parts = [nodeSel(el)];
        let cur = el, sel = parts[0];
        const generic = (s) => /^[a-z0-9]+$/.test(s);
        for (let d = 0; d < 5; d++) {
            const n = count(sel);
            if (n >= 1 && n <= 3 && (/[.#[]/.test(sel) || !generic(parts[parts.length - 1])) || parts[0].startsWith('#')) break;
            cur = cur.parentElement;
            if (!cur || cur === document.body || cur === document.documentElement) break;
            parts.unshift(nodeSel(cur));
            sel = parts.join(' > ');
        }
        if (count(sel) > 3 && el.parentElement) {
            const idx = [...el.parentElement.children].filter((c) => c.localName === el.localName).indexOf(el) + 1;
            sel += `:nth-of-type(${idx})`;
        }
        return sel;
    }

    function describe(el) {
        const t = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').replace(/\s+/g, ' ').trim();
        return t ? (t.length > 40 ? `${t.slice(0, 40)}…` : t) : `<${el.localName}>`;
    }

    function startPicker() {
        ensureRoot();
        closePalette();
        if (picking) return;
        const box = h('div', { class: 'pick-box' });
        const tag = h('div', { class: 'pick-tag' });
        const bar = h('div', { class: 'pick-bar' }, h('span', { class: 'pick-help', html: `${svg('target', 15)}<span>Cliquez sur l'élément à masquer · <kbd>Échap</kbd> pour annuler</span>` }));
        const layer = h('div', { class: 'pick-layer' }, box, tag, bar);
        root.appendChild(layer);
        if (panel) panel.classList.add('ghost');
        picking = { layer, box, tag, bar, target: null, chosen: null };

        const place = (el) => {
            if (!el) { box.style.display = 'none'; tag.style.display = 'none'; return; }
            const r = el.getBoundingClientRect();
            Object.assign(box.style, { display: 'block', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
            tag.textContent = `${nodeSel(el)}  ${Math.round(r.width)}×${Math.round(r.height)}`;
            Object.assign(tag.style, { display: 'block', left: `${Math.max(4, r.left)}px`, top: `${r.top > 26 ? r.top - 24 : r.bottom + 4}px` });
        };
        const pickable = (el) => el && el.nodeType === 1 && !el.closest('[data-glt-ui]') && el !== document.body && el !== document.documentElement;

        const onMove = (e) => {
            if (picking.chosen) return;
            const el = e.target;
            if (!pickable(el)) return;
            picking.target = el;
            place(el);
        };
        const onClick = (e) => {
            if (e.composedPath().includes(host)) return;
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            if (e.type !== 'click') return;
            if (!picking.target) return;
            choose(picking.target);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stopPicker(); }
        };
        const onScroll = () => place(picking.chosen || picking.target);

        function choose(el) {
            picking.chosen = el;
            place(el);
            box.classList.add('chosen');
            const sel = selectorFor(el);
            const n = count(sel);
            const selInput = h('input', { class: 'pick-sel', type: 'text', value: sel, spellcheck: 'false', title: 'Sélecteur CSS (modifiable)' });
            const info = h('span', { class: 'pick-count' });
            const refresh = () => {
                const c = count(selInput.value);
                info.textContent = c ? `${c} élément${c > 1 ? 's' : ''}` : 'aucun élément';
                info.classList.toggle('warn', c === 0 || c > 10);
            };
            selInput.addEventListener('input', refresh);
            refresh();
            bar.replaceChildren(
                h('span', { class: 'pick-desc', text: describe(el) }),
                selInput, info,
                h('button', { class: 'btn sm', type: 'button', html: `${svg('up', 13)}<span>Parent</span>`, title: 'Sélectionner l\'élément englobant', onclick: () => { if (el.parentElement && pickable(el.parentElement)) choose(el.parentElement); } }),
                h('button', { class: 'btn sm', type: 'button', text: 'Autre', onclick: () => { picking.chosen = null; box.classList.remove('chosen'); bar.replaceChildren(h('span', { class: 'pick-help', html: `${svg('target', 15)}<span>Cliquez sur l'élément à masquer · <kbd>Échap</kbd> pour annuler</span>` })); } }),
                h('button', {
                    class: 'btn sm primary', type: 'button', html: `${svg('eyeoff', 13)}<span>Masquer</span>`,
                    onclick: () => {
                        const s = selInput.value.trim();
                        if (!count(s)) { toast('Ce sélecteur ne correspond à rien'); return; }
                        set({ hidden: [...(cfg.hidden || []).filter((x) => x.selector !== s), { selector: s, label: describe(el) }] });
                        stopPicker();
                        toast('Élément masqué — réaffichable depuis « Éléments »');
                    }
                }),
                h('button', { class: 'icon', type: 'button', title: 'Annuler', html: svg('close'), onclick: stopPicker }));
            void n;
        }

        picking.cleanup = () => {
            document.removeEventListener('mousemove', onMove, true);
            ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup'].forEach((t) => document.removeEventListener(t, onClick, true));
            document.removeEventListener('keydown', onKey, true);
            window.removeEventListener('scroll', onScroll, true);
        };
        document.addEventListener('mousemove', onMove, true);
        ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup'].forEach((t) => document.addEventListener(t, onClick, true));
        document.addEventListener('keydown', onKey, true);
        window.addEventListener('scroll', onScroll, true);
    }

    function stopPicker() {
        if (!picking) return;
        picking.cleanup();
        picking.layer.remove();
        picking = null;
        if (panel) { panel.classList.remove('ghost'); showTab('hide'); }
    }

    // =====================================================================
    // Diagnostic : structure de la page (sans contenu)
    // =====================================================================
    function outline() {
        const lines = [`Graylog Theme — structure de ${location.pathname} (${window.innerWidth}×${window.innerHeight})`];
        const sig = (el) => {
            const parts = [el.localName];
            if (el.id && !el.id.startsWith('glt')) parts.push(`#${el.id}`);
            const classes = [...el.classList].map((c) => {
                const m = /^([A-Za-z][A-Za-z0-9]*(?:__[A-Za-z0-9]+)?)-sc-/.exec(c);
                if (m) return `.${m[1]}`;
                if (/^(sc-|glt-)/.test(c) || (/^[a-z]+[A-Z][A-Za-z]*$/.test(c) && c.length <= 8)) return '';
                return `.${c}`;
            }).filter(Boolean);
            parts.push([...new Set(classes)].slice(0, 6).join(''));
            const role = el.getAttribute('role');
            if (role) parts.push(`[role=${role}]`);
            const r = el.getAttribute('data-glt-role');
            if (r) parts.push(` ← ${r}`);
            return parts.join('');
        };
        const walk = (el, depth) => {
            if (lines.length > 700 || depth > 16) return;
            const kids = [...el.children].filter((c) => !['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT'].includes(c.tagName) && !c.hasAttribute('data-glt-ui'));
            let i = 0;
            while (i < kids.length) {
                const s = sig(kids[i]);
                let j = i + 1;
                while (j < kids.length && sig(kids[j]) === s) j++;
                lines.push(`${'  '.repeat(depth)}${s}${j - i > 1 ? `  ×${j - i}` : ''}`);
                if (kids[i].localName !== 'svg') walk(kids[i], depth + 1);
                i = j;
            }
        };
        walk(document.body, 0);
        return lines.join('\n');
    }

    // =====================================================================
    // API
    // =====================================================================
    function update(next) {
        cfg = next;
        paint();
        syncLauncher();
        if (panel) syncers.forEach((f) => f());
        if (pal) renderPalette();
    }

    // Échap ferme la palette puis le panneau, où que soit le focus
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || picking) return;
        if (pal) { e.preventDefault(); e.stopPropagation(); closePalette(); }
        else if (panel && panel.isConnected) { e.preventDefault(); e.stopPropagation(); closeCustomizer(); }
    }, true);

    GLT.ui = {
        update, toast,
        openCustomizer, closeCustomizer, toggleCustomizer,
        openPalette, closePalette, togglePalette,
        startPicker
    };

    // =====================================================================
    // Styles (isolés dans le Shadow DOM)
    // =====================================================================
    var STYLES = `
:host { all: initial; }
* { box-sizing: border-box; }
[hidden] { display: none !important; }
button, input, select, textarea { font: inherit; color: inherit; }
svg { display: block; flex: none; }
kbd { font: 600 10px/1 ui-monospace, Menlo, Consolas, monospace; padding: 2px 5px; border-radius: 4px; border: 1px solid var(--border); border-bottom-width: 2px; color: var(--muted); background: var(--bg2); }
code { font: 11px ui-monospace, Menlo, Consolas, monospace; }
.muted { color: var(--muted); }
.spacer { flex: 1; }
.ui, .panel, .pal, .toast, .launcher, .pick-bar, .pick-tag {
    font: 13px/1.45 Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--text);
    -webkit-font-smoothing: antialiased;
}

/* Boutons */
.btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; padding: 0 12px;
    border: 1px solid var(--border); border-radius: 8px; background: var(--bg2); cursor: pointer; font-weight: 500; white-space: nowrap;
    transition: border-color .12s, background .12s;
}
.btn:hover { border-color: var(--accent); }
.btn.sm { height: 28px; padding: 0 10px; font-size: 12px; border-radius: 7px; }
.btn.wide { width: 100%; }
.btn.wide kbd { margin-left: auto; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
.btn.primary:hover { filter: brightness(1.08); }
.btn.ghost { background: none; border-color: transparent; color: var(--muted); }
.btn.ghost:hover { color: var(--text); }
.btn.danger:hover { border-color: var(--danger); color: var(--danger); }
.btn:focus-visible, .icon:focus-visible, .tab:focus-visible, .theme:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.icon {
    display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; flex: none;
    border: none; border-radius: 8px; background: none; color: var(--muted); cursor: pointer;
}
.icon:hover { background: color-mix(in srgb, var(--text) 8%, transparent); color: var(--text); }

/* Interrupteur */
.switch { position: relative; width: 34px; height: 20px; flex: none; cursor: pointer; }
.switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.slider { position: absolute; inset: 0; border-radius: 999px; background: var(--border); transition: background .15s; }
.slider::before { content: ""; position: absolute; width: 14px; height: 14px; left: 3px; top: 3px; border-radius: 50%; background: #fff; transition: transform .15s; box-shadow: 0 1px 2px rgba(0,0,0,.3); }
.switch input:checked + .slider { background: var(--accent); }
.switch input:checked + .slider::before { transform: translateX(14px); }
.switch input:focus-visible + .slider { outline: 2px solid var(--accent); outline-offset: 2px; }

/* Bouton flottant */
.launcher {
    position: fixed; right: 18px; bottom: 18px; width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    background: var(--bg); color: var(--accent); border: 1px solid var(--border);
    box-shadow: 0 6px 20px rgba(0,0,0,.25); opacity: .55; transition: opacity .15s, transform .15s;
}
.launcher:hover { opacity: 1; transform: scale(1.06); }
.launcher.hidden { opacity: 0; pointer-events: none; }

/* Panneau */
.panel {
    position: fixed; top: 12px; right: 12px; bottom: 12px; width: 392px; max-width: calc(100vw - 24px);
    display: flex; flex-direction: column; overflow: hidden;
    background: var(--bg); border: 1px solid var(--border); border-radius: 16px;
    box-shadow: 0 24px 64px rgba(0,0,0,.35), 0 2px 6px rgba(0,0,0,.15);
    transform: translateX(24px); opacity: 0; transition: transform .18s cubic-bezier(.2,.8,.2,1), opacity .18s;
}
.panel.open { transform: none; opacity: 1; }
.panel.ghost { opacity: 0; pointer-events: none; }
.panel-head { display: flex; align-items: center; gap: 8px; padding: 12px 10px 10px 16px; }
.panel-head strong { font-size: 14.5px; }
.panel-logo { width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent); }
.tabs { display: flex; gap: 0; padding: 0 8px; justify-content: space-between; border-bottom: 1px solid var(--border); overflow-x: auto; scrollbar-width: none; flex: none; }
.tab { display: flex; align-items: center; gap: 5px; padding: 8px 8px 9px; border: none; background: none; color: var(--muted); cursor: pointer; font-size: 12px; font-weight: 600; border-bottom: 2px solid transparent; white-space: nowrap; }
.tab:hover { color: var(--text); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.panes { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 16px 20px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
.pane { display: flex; flex-direction: column; gap: 10px; }
.pane h4 { margin: 10px 0 0; font-size: 10.5px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); font-weight: 700; }
.panel-foot { flex: none; padding: 8px 16px; border-top: 1px solid var(--border); font-size: 11px; color: var(--muted); }
.hint { margin: 0; font-size: 12px; color: var(--muted); line-height: 1.5; }
.hint code { color: var(--text); }
.empty { margin: 0; padding: 12px; border: 1px dashed var(--border); border-radius: 10px; color: var(--muted); font-size: 12px; text-align: center; }
.inline { display: flex; align-items: center; gap: 6px; }

/* Champs */
.field { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 12px; font-weight: 600; }
.field-label small { display: block; font-weight: 400; color: var(--muted); font-size: 11px; }
input[type="text"], select, textarea {
    width: 100%; height: 32px; padding: 0 10px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--bg2); outline: none; transition: border-color .12s, box-shadow .12s;
}
.inline select { width: auto; height: 28px; font-size: 12px; }
textarea { height: auto; padding: 8px 10px; resize: vertical; font: 11.5px/1.5 ui-monospace, Menlo, Consolas, monospace; }
input[type="text"]:focus, select:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }
.range { display: flex; align-items: center; gap: 10px; }
.range input { flex: 1; accent-color: var(--accent); }
.range-val { font: 12px ui-monospace, Menlo, monospace; color: var(--muted); width: 42px; text-align: right; }

.row { display: flex; align-items: center; gap: 12px; padding: 8px 0; cursor: pointer; }
.group .row + .row { border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent); }
.row-text { flex: 1; min-width: 0; font-size: 12.5px; }
.row-text small { display: block; color: var(--muted); font-size: 11px; margin-top: 1px; }
.row.master { padding: 10px 12px; border-radius: 10px; background: color-mix(in srgb, var(--accent) 10%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); }
.row.master .row-text > span { font-weight: 600; }
.ui-body { display: flex; flex-direction: column; gap: 10px; transition: opacity .15s; }
.ui-body.disabled { opacity: .4; pointer-events: none; }
.group { display: flex; flex-direction: column; }

/* Thèmes */
.themes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 8px; }
.theme { display: flex; flex-direction: column; gap: 5px; padding: 0; border: none; background: none; cursor: pointer; text-align: left; }
.pv { position: relative; height: 56px; border-radius: 9px; overflow: hidden; border: 1px solid rgba(128,128,128,.25); transition: transform .12s, box-shadow .12s; }
.theme:hover .pv { transform: translateY(-1px); }
.theme.selected .pv { box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent); }
.pv-bar { position: absolute; left: 0; right: 0; top: 0; height: 10px; }
.pv-card { position: absolute; left: 6px; right: 6px; top: 15px; bottom: 6px; border-radius: 4px; padding: 5px 6px; display: flex; flex-direction: column; gap: 4px; }
.pv-card i { display: block; height: 3px; border-radius: 2px; }
.pv-btn { position: absolute; left: 12px; bottom: 11px; width: 20px; height: 7px; border-radius: 3px; }
.pv-dots { position: absolute; right: 10px; bottom: 11px; display: flex; gap: 3px; }
.pv-dots b { width: 6px; height: 6px; border-radius: 50%; }
.theme-name { font-size: 11.5px; font-weight: 500; padding-left: 2px; }
.theme-name small { color: var(--muted); font-size: 10.5px; }
.custom { display: flex; flex-direction: column; gap: 8px; padding: 10px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg2); }
.colors { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 10px; }
.color { display: flex; align-items: center; gap: 8px; padding: 3px 4px; border-radius: 6px; font-size: 12px; cursor: pointer; }
.color:hover { background: color-mix(in srgb, var(--text) 6%, transparent); }
input[type="color"] { width: 22px; height: 22px; padding: 0; border: 1px solid var(--border); border-radius: 6px; background: none; cursor: pointer; flex: none; }
input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
input[type="color"]::-webkit-color-swatch { border: none; border-radius: 5px; }

/* Éléments masqués, favoris */
.hidden-list, .fav-list { display: flex; flex-direction: column; gap: 6px; }
.hidden-item, .fav { display: flex; align-items: center; gap: 8px; padding: 7px 6px 7px 10px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg2); }
.hidden-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; font-size: 12.5px; }
.hidden-text span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hidden-text code { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.badge { font-size: 10.5px; padding: 2px 7px; border-radius: 999px; background: color-mix(in srgb, var(--text) 8%, transparent); color: var(--muted); white-space: nowrap; }
.fav-icon { color: var(--warning); }
.btn-row { display: flex; gap: 6px; flex-wrap: wrap; }

/* Environnement */
.swatches { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.sw { width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; box-shadow: inset 0 0 0 1px rgba(0,0,0,.15); }
.sw.on { box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--text); }
.env-preview { position: relative; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 30px 12px 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg2); overflow: hidden; font-size: 12px; }
.env-preview.dim { opacity: .55; }
.env-line { position: absolute; left: 0; right: 0; top: 0; height: 3px; }
.env-badge { padding: 1px 10px 3px; border-radius: 0 0 8px 8px; color: #fff; font: 700 10.5px/1.4 system-ui, sans-serif; letter-spacing: .08em; position: absolute; top: 0; left: 50%; transform: translateX(-50%); }

/* Palette */
.pal-overlay { position: fixed; inset: 0; background: rgba(8,8,12,.35); display: flex; justify-content: center; align-items: flex-start; padding-top: 12vh; opacity: 0; transition: opacity .12s; }
.pal-overlay.open { opacity: 1; }
.pal {
    width: min(640px, calc(100vw - 32px)); max-height: 70vh; display: flex; flex-direction: column; overflow: hidden;
    background: var(--bg); border: 1px solid var(--border); border-radius: 14px; box-shadow: 0 30px 80px rgba(0,0,0,.45);
    transform: translateY(-6px) scale(.99); transition: transform .12s;
}
.pal-overlay.open .pal { transform: none; }
.pal-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-bottom: 1px solid var(--border); color: var(--muted); }
.pal-input { flex: 1; height: 28px !important; padding: 0 !important; border: none !important; background: none !important; box-shadow: none !important; font-size: 15px; color: var(--text); }
.pal-list { overflow-y: auto; padding: 6px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
.pal-group { padding: 8px 10px 4px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
.pal-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; cursor: pointer; }
.pal-item.active { background: color-mix(in srgb, var(--accent) 14%, transparent); }
.pal-item.active .pal-icon { color: var(--accent); }
.pal-icon { width: 18px; display: flex; justify-content: center; color: var(--muted); }
.pal-icon .dot { width: 10px; height: 10px; border-radius: 50%; display: block; }
.pal-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pal-hint { color: var(--muted); font: 11px ui-monospace, Menlo, monospace; max-width: 40%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pal-tag { font-size: 10.5px; color: var(--muted); padding: 1px 7px; border-radius: 999px; border: 1px solid var(--border); }
.pal-empty { padding: 20px; text-align: center; color: var(--muted); }
.pal-foot { display: flex; gap: 16px; padding: 8px 14px; border-top: 1px solid var(--border); font-size: 11px; color: var(--muted); }
.pal-foot kbd { margin-right: 3px; }

/* Sélecteur d'éléments */
.pick-layer { position: fixed; inset: 0; pointer-events: none; }
.pick-box { position: fixed; display: none; border: 2px solid var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); border-radius: 4px; transition: all .05s; }
.pick-box.chosen { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 16%, transparent); }
.pick-tag { position: fixed; display: none; padding: 2px 8px; border-radius: 6px; background: var(--accent); color: var(--on-accent); font: 600 11px ui-monospace, Menlo, monospace; white-space: nowrap; max-width: 60vw; overflow: hidden; text-overflow: ellipsis; }
.pick-bar {
    position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); pointer-events: auto;
    display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 14px; max-width: calc(100vw - 32px);
    background: var(--bg); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,.4);
}
.pick-help { display: flex; align-items: center; gap: 8px; color: var(--muted); padding-right: 8px; }
.pick-help svg { color: var(--accent); }
.pick-desc { font-weight: 600; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pick-sel { width: 280px !important; height: 28px !important; font: 11.5px ui-monospace, Menlo, monospace !important; }
.pick-count { font-size: 11.5px; color: var(--success); white-space: nowrap; }
.pick-count.warn { color: var(--warning); }

/* Notification */
.toast {
    position: fixed; left: 50%; bottom: 24px; transform: translate(-50%, 10px); opacity: 0; pointer-events: none;
    padding: 9px 14px; border-radius: 10px; background: var(--text); color: var(--bg2); font-weight: 500;
    box-shadow: 0 10px 30px rgba(0,0,0,.3); transition: opacity .15s, transform .15s; white-space: nowrap;
}
.toast.show { opacity: 1; transform: translate(-50%, 0); }
`;

    if (GLT.cfg) update(GLT.cfg);
})();
