/* Graylog Theme — couche « interface » : classes d'activation, repérage des zones de Graylog,
 * niveau des lignes, mode focus, éléments masqués, badge d'environnement, récents, raccourcis. */
(() => {
    'use strict';
    if (window.__gltSkin) return;
    window.__gltSkin = true;
    const GLT = window.GLT || (window.GLT = {});

    let cfg = null;
    let focus = false;
    try { focus = sessionStorage.getItem('glt-focus') === '1'; } catch (e) { /* stockage indisponible */ }

    const html = () => document.documentElement;
    const on = () => !!(cfg && cfg.enabled && cfg.skin);
    const feat = (k) => on() && gltFeature(cfg, k);
    const norm = (s) => String(s || '').trim().toLowerCase();

    // =====================================================================
    // Classes sur <html>
    // =====================================================================
    function applyClasses() {
        const h = html();
        if (!h) return;
        const theme = gltResolveTheme(cfg);
        h.classList.toggle('glt-skin', on());
        h.classList.toggle('glt-dark', on() && theme.mode !== 'light');
        GLT_FEATURES.forEach(([k]) => h.classList.toggle(`glt-f-${k}`, feat(k)));
        h.classList.toggle('glt-focus', on() && focus);
        if (on()) h.style.setProperty('--glt-radius', `${Number(cfg.radius) >= 0 ? Number(cfg.radius) : 10}px`);
        else h.style.removeProperty('--glt-radius');
        applyHidden();
        applyEnv();
        scheduleScan();
    }

    function styleEl(id) {
        let n = document.getElementById(id);
        if (!n) {
            n = document.createElement('style');
            n.id = id;
            (document.head || document.documentElement).appendChild(n);
        }
        return n;
    }

    function applyHidden() {
        const list = on() ? (cfg.hidden || []) : [];
        const css = list.map((h) => {
            try { document.querySelector(h.selector); } catch (e) { return ''; } // sélecteur invalide
            return `html.glt-skin ${h.selector} { display: none !important; }`;
        }).join('\n');
        if (!css) { const n = document.getElementById('glt-hidden'); if (n) n.remove(); return; }
        styleEl('glt-hidden').textContent = css;
    }

    // =====================================================================
    // Repérage des zones (Graylog ne fournit pas de classes stables)
    // =====================================================================
    function visible(el) {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    }

    function markRoles() {
        const vw = window.innerWidth, vh = window.innerHeight;
        // En mode focus, ces zones sont masquées exprès : on garde le repérage tel quel
        const keep = focus && on();
        let nav = document.querySelector('[data-glt-role="nav"]');
        if (!nav || !nav.isConnected || (!keep && !visible(nav))) {
            if (nav) nav.removeAttribute('data-glt-role');
            nav = null;
            for (const c of document.querySelectorAll('.navbar, nav, header, [class*="Navigation"], [class*="Navbar"]')) {
                if (c.closest('[data-glt-ui]')) continue;
                const r = c.getBoundingClientRect();
                if (r.top <= 2 && r.width >= vw * 0.6 && r.height >= 30 && r.height <= 130) { nav = c; break; }
            }
            if (nav) nav.setAttribute('data-glt-role', 'nav');
        }
        let side = document.querySelector('[data-glt-role="sidebar"]');
        if (!side || !side.isConnected || (!keep && !visible(side))) {
            if (side) side.removeAttribute('data-glt-role');
            side = null;
            for (const c of document.querySelectorAll('[class*="Sidebar"], aside')) {
                if (c.closest('[data-glt-ui]')) continue;
                const r = c.getBoundingClientRect();
                if (r.left <= 2 && r.width > 20 && r.width <= 140 && r.height >= vh * 0.5) { side = c; break; }
            }
            if (side) side.setAttribute('data-glt-role', 'sidebar');
        }
        if (nav && !document.querySelector('[data-glt-role="throughput"]')) {
            // Compteur « 9,263 in / 9,273 out » : le plus petit élément qui contient les deux
            let best = null;
            for (const el of nav.querySelectorAll('*')) {
                const t = el.textContent || '';
                if (t.length > 80 || !/\d[\d\s.,]*\s*in(?![a-z])/i.test(t) || !/\d[\d\s.,]*\s*out(?![a-z])/i.test(t)) continue;
                best = el;
            }
            if (best) best.setAttribute('data-glt-role', 'throughput');
        }
    }

    // Avant de masquer la navigation / la barre latérale, on repère les marges qui leur laissaient la place
    function markOffsets() {
        document.querySelectorAll('[data-glt-role^="offset"]').forEach((n) => n.removeAttribute('data-glt-role'));
        const nav = document.querySelector('[data-glt-role="nav"]');
        const side = document.querySelector('[data-glt-role="sidebar"]');
        const scan = (px, prop, role) => {
            if (!px) return;
            const walk = (el, depth) => {
                if (!el || depth > 5 || el.hasAttribute('data-glt-role')) return;
                const cs = getComputedStyle(el);
                const vals = prop === 'top' ? [cs.paddingTop, cs.marginTop] : [cs.paddingLeft, cs.marginLeft];
                if (vals.some((v) => Math.abs(parseFloat(v) - px) <= 6)) { el.setAttribute('data-glt-role', role); return; }
                for (const c of el.children) walk(c, depth + 1);
            };
            walk(document.body, 0);
        };
        if (nav && /fixed|sticky/.test(getComputedStyle(nav).position)) scan(nav.getBoundingClientRect().height, 'top', 'offset-top');
        if (side && /fixed|absolute/.test(getComputedStyle(side).position)) scan(side.getBoundingClientRect().width, 'left', 'offset-left');
    }

    // =====================================================================
    // Niveau des lignes du tableau de messages
    // =====================================================================
    function levelKind(v) {
        const s = norm(v);
        if (!s) return '';
        if (/^\d$/.test(s)) { const n = Number(s); return n <= 3 ? 'error' : n === 4 ? 'warn' : n <= 6 ? 'info' : 'debug'; }
        if (/err|fatal|crit|alert|emerg|severe/.test(s)) return 'error';
        if (/warn/.test(s)) return 'warn';
        if (/debug|trace/.test(s)) return 'debug';
        if (/info|notice/.test(s)) return 'info';
        return '';
    }

    function markLevels() {
        const field = norm(cfg.levelField || 'level');
        document.querySelectorAll('table[class*="MessageTable"]').forEach((table) => {
            const ths = [...table.querySelectorAll(':scope > thead th')];
            const idx = ths.findIndex((th) => norm(th.textContent) === field);
            table.querySelectorAll(':scope > tbody').forEach((tb) => {
                const row = tb.rows[0];
                if (!row) return;
                let v = idx >= 0 && row.cells[idx] ? row.cells[idx].textContent : '';
                if (!levelKind(v)) {
                    // Niveau dans le JSON du message (attribut title ou texte de la cellule)
                    const titled = row.querySelector('[title*="level"]');
                    const txt = (titled && titled.getAttribute('title')) || row.textContent;
                    const m = /"level"\s*:\s*"?([A-Za-z0-9]+)/.exec(txt || '');
                    v = m ? m[1] : '';
                }
                const k = levelKind(v);
                if (k) { if (tb.dataset.gltLevel !== k) tb.dataset.gltLevel = k; }
                else if (tb.dataset.gltLevel) delete tb.dataset.gltLevel;
            });
        });
    }

    let scanTimer = null;
    function scheduleScan() {
        clearTimeout(scanTimer);
        scanTimer = setTimeout(() => {
            if (!on() || !document.body) return;
            markRoles();
            if (feat('level')) markLevels();
        }, 200);
    }

    // =====================================================================
    // Mode focus
    // =====================================================================
    function setFocus(v) {
        focus = !!v;
        try { sessionStorage.setItem('glt-focus', focus ? '1' : '0'); } catch (e) { /* noop */ }
        if (focus) { markRoles(); markOffsets(); }
        applyClasses();
        if (GLT.ui) GLT.ui.toast(focus ? 'Mode focus — Alt+Maj+F pour revenir' : 'Mode focus désactivé');
    }

    // =====================================================================
    // Badge d'environnement : bandeau, titre de l'onglet, favicon
    // =====================================================================
    let envTitleObs = null, favOrig = null, favKey = '';

    function envCfg() {
        const e = cfg && cfg.envs && cfg.envs[location.hostname];
        return on() && e && e.label ? e : null;
    }

    function applyEnv() {
        const env = envCfg();
        let bar = document.getElementById('glt-env');
        if (env && env.ribbon !== false && document.body) {
            if (!bar) {
                bar = document.createElement('div');
                bar.id = 'glt-env';
                bar.setAttribute('data-glt-ui', '');
                bar.innerHTML = '<div class="glt-env-line"></div><div class="glt-env-badge"></div>';
                document.documentElement.appendChild(bar);
            }
            const c = env.color || '#ef4444';
            bar.style.cssText = 'position:fixed;inset:0 0 auto 0;z-index:2147483000;pointer-events:none;';
            bar.firstChild.style.cssText = `height:3px;background:${c};`;
            const badge = bar.lastChild;
            badge.textContent = env.label;
            badge.style.cssText = `position:absolute;top:0;left:50%;transform:translateX(-50%);padding:1px 12px 3px;border-radius:0 0 8px 8px;background:${c};color:#fff;font:700 10.5px/1.4 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 2px 8px rgba(0,0,0,.25);`;
        } else if (bar) bar.remove();

        applyTitle(env && env.title !== false ? env.label : '');
        applyFavicon(env && env.favicon !== false ? (env.color || '#ef4444') : '');
    }

    function applyTitle(label) {
        const prefix = label ? `[${label}] ` : '';
        const fix = () => {
            const t = document.title.replace(/^\[[^\]]{1,24}\] /, '');
            const want = prefix + t;
            if (document.title !== want) document.title = want;
        };
        if (envTitleObs) { envTitleObs.disconnect(); envTitleObs = null; }
        if (!document.head) return;
        fix();
        if (!prefix) return;
        envTitleObs = new MutationObserver(fix);
        envTitleObs.observe(document.head, { childList: true, subtree: true, characterData: true });
    }

    function applyFavicon(color) {
        if (favKey === color) return;
        favKey = color;
        let link = document.querySelector('link[rel~="icon"]');
        if (!color) {
            if (link && favOrig !== null) link.href = favOrig;
            return;
        }
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            (document.head || document.documentElement).appendChild(link);
        }
        if (favOrig === null) favOrig = link.href || '';
        const img = new Image();
        const draw = (withImg) => {
            const c = document.createElement('canvas');
            c.width = c.height = 32;
            const g = c.getContext('2d');
            if (withImg) g.drawImage(img, 0, 0, 32, 32);
            else { g.fillStyle = '#444'; g.beginPath(); g.arc(16, 16, 14, 0, Math.PI * 2); g.fill(); }
            g.fillStyle = color;
            g.strokeStyle = '#fff';
            g.lineWidth = 3;
            g.beginPath(); g.arc(24, 24, 7, 0, Math.PI * 2); g.fill(); g.stroke();
            try { link.href = c.toDataURL('image/png'); } catch (e) { /* image d'un autre domaine */ }
        };
        img.onload = () => draw(true);
        img.onerror = () => draw(false);
        if (favOrig) img.src = favOrig; else draw(false);
    }

    // =====================================================================
    // Pages récentes (pour la palette)
    // =====================================================================
    let lastPath = '';
    function trackRecent() {
        const path = location.pathname + location.search;
        if (path === lastPath || !cfg) return;
        lastPath = path;
        setTimeout(() => {
            const title = document.title.replace(/^\[[^\]]{1,24}\] /, '').replace(/\s*[-|–]\s*Graylog\s*$/i, '').trim() || location.pathname;
            chrome.storage.local.get({ recents: {} }, ({ recents }) => {
                const host = location.hostname;
                const list = (recents[host] || []).filter((r) => r.path !== location.pathname);
                list.unshift({ path: location.pathname, url: path, title, at: Date.now() });
                recents[host] = list.slice(0, 15);
                chrome.storage.local.set({ recents });
            });
        }, 1200);
    }

    // =====================================================================
    // Raccourcis & messages
    // =====================================================================
    document.addEventListener('keydown', (e) => {
        if (!cfg || !cfg.enabled || !GLT.ui) return;
        const k = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && k === 'k') {
            e.preventDefault(); e.stopPropagation();
            GLT.ui.togglePalette();
        } else if (e.altKey && e.shiftKey && (k === 'c' || e.code === 'KeyC')) {
            e.preventDefault(); e.stopPropagation();
            GLT.ui.toggleCustomizer();
        } else if (e.altKey && e.shiftKey && (k === 'f' || e.code === 'KeyF')) {
            e.preventDefault(); e.stopPropagation();
            if (cfg.skin) setFocus(!focus);
        }
    }, true);

    chrome.runtime.onMessage.addListener((msg, sender, reply) => {
        if (!msg || !GLT.ui) return;
        if (msg.type === 'glt:customizer') GLT.ui.openCustomizer(msg.tab);
        else if (msg.type === 'glt:palette') GLT.ui.openPalette();
        else if (msg.type === 'glt:picker') GLT.ui.startPicker();
        reply && reply({ ok: true });
    });

    // =====================================================================
    // Démarrage
    // =====================================================================
    function load(next) {
        cfg = next;
        GLT.cfg = cfg;
        applyClasses();
        if (GLT.ui) GLT.ui.update(cfg);
    }

    GLT.skin = {
        setFocus, get focus() { return focus; },
        set: (patch) => chrome.storage.local.set(patch),
        levelKind
    };

    const mo = new MutationObserver((muts) => {
        if (!on()) return;
        for (const m of muts) {
            if (m.target.closest && m.target.closest('[data-glt-ui]')) continue;
            scheduleScan();
            return;
        }
    });

    const start = () => {
        chrome.storage.local.get(GLT_DEFAULTS, load);
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area !== 'local') return;
            if (Object.keys(changes).every((k) => k === 'recents' || k === 'sites')) return;
            chrome.storage.local.get(GLT_DEFAULTS, load);
        });
        const boot = () => {
            mo.observe(document.body, { childList: true, subtree: true });
            applyClasses();
            if (focus) { markRoles(); markOffsets(); }
            trackRecent();
            setInterval(trackRecent, 1000);
            window.addEventListener('resize', () => {
                if (focus) return;
                document.querySelectorAll('[data-glt-role="nav"],[data-glt-role="sidebar"]').forEach((n) => n.removeAttribute('data-glt-role'));
                scheduleScan();
            });
        };
        if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
    };

    if (document.documentElement) start();
    else new MutationObserver((m, o) => { if (document.documentElement) { o.disconnect(); start(); } }).observe(document, { childList: true });
})();
