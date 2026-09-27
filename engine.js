/* Graylog Theme — moteur de remappage des couleurs.
 *
 * Graylog génère son CSS à l'exécution (styled-components, Mantine) avec des noms de classes instables.
 * Plutôt que de cibler des classes, on relit toutes les règles CSS de la page et on remplace chaque couleur :
 *  - gris / neutres  → position sur l'échelle « fond → texte » de Graylog, reportée sur celle du thème ;
 *  - couleurs vives → selon leur teinte : erreur, avertissement, succès, info ou accent du thème ;
 *  - ombres et voiles sombres → gardés noirs.
 * Les valeurs d'origine sont conservées, ce qui permet de changer de thème ou de désactiver à chaud.
 */
(() => {
    'use strict';
    if (window.__gltEngine) return;
    window.__gltEngine = true;

    const COLOR_PROP = /color|background|border|outline|shadow|fill|stroke|caret|column-rule|text-decoration|scrollbar|^--/i;
    const COLOR_RE = /#[0-9a-f]{3,8}\b|rgba?\([^()]*\)|hsla?\([^()]*\)|\b(?:white|black)\b/gi;
    const HAS_COLOR = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b(?:white|black)\b/i;
    const ROOT_SEL = /(^|,)\s*(html|body)\s*(?=,|$)/i;
    const INLINE_SEL = 'svg [style], svg [fill], svg [stroke], [style*="color"], [style*="background"], [style*="border"]';
    const NEUTRAL_CHROMA = 0.12;
    // Composants où un texte blanc est posé sur un fond coloré (boutons, badges, étiquettes…)
    const ON_COLOR_SEL = /btn|button|badge|label|pill|chip|tag\b|primary|danger|success|warning|info\b|Mui|mantine-Button|mantine-Badge/i;

    let cfg = null;
    let pal = null;          // palette compilée du thème
    let src = null;          // { bgL, textL, light } : échelle d'origine de Graylog
    let active = false;
    let cache = new Map();   // valeur CSS d'origine → valeur remappée (par palette)

    const rules = new Set();
    const original = new WeakMap();      // CSSStyleRule → [[propriété, valeur, priorité]]
    let sheetLen = new WeakMap();
    const inlineEls = new Set();
    const inlineOrig = new WeakMap();    // élément → { style, fill, stroke, written }
    const pendingInline = new Set();
    let pollTimer = null, bootTimer = null, frame = 0, polls = 0, scheduled = false;

    // =====================================================================
    // Couleurs
    // =====================================================================
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    function hslToRgb(h, s, l) {
        h = ((h % 360) + 360) % 360 / 360;
        if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const f = (t) => {
            t = (t + 1) % 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        return { r: f(h + 1 / 3) * 255, g: f(h) * 255, b: f(h - 1 / 3) * 255 };
    }

    function rgbToHsl({ r, g, b }) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const l = (max + min) / 2;
        if (max === min) return { h: 0, s: 0, l };
        const d = max - min;
        const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        let h;
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        return { h: h * 60, s, l };
    }

    function parseColor(str) {
        const s = String(str).trim().toLowerCase();
        if (s === 'white') return { r: 255, g: 255, b: 255, a: 1 };
        if (s === 'black') return { r: 0, g: 0, b: 0, a: 1 };
        if (s[0] === '#') {
            let h = s.slice(1);
            if (![3, 4, 6, 8].includes(h.length) || /[^0-9a-f]/.test(h)) return null;
            if (h.length < 5) h = [...h].map((c) => c + c).join('');
            const n = h.match(/../g).map((x) => parseInt(x, 16));
            return { r: n[0], g: n[1], b: n[2], a: n.length === 4 ? n[3] / 255 : 1 };
        }
        const m = /^(rgba?|hsla?)\(([^()]*)\)$/.exec(s);
        if (!m) return null;
        const parts = m[2].split(/[\s,/]+/).filter(Boolean);
        if (parts.length < 3) return null;
        const alpha = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
        if (m[1].startsWith('rgb')) {
            const [r, g, b] = parts.slice(0, 3).map((p) => (p.endsWith('%') ? parseFloat(p) * 2.55 : parseFloat(p)));
            if ([r, g, b, alpha].some(Number.isNaN)) return null;
            return { r, g, b, a: alpha };
        }
        let h = parseFloat(parts[0]);
        if (parts[0].endsWith('turn')) h *= 360;
        else if (parts[0].endsWith('rad')) h = (h * 180) / Math.PI;
        const sat = parseFloat(parts[1]) / 100, lig = parseFloat(parts[2]) / 100;
        if ([h, sat, lig, alpha].some(Number.isNaN)) return null;
        return { ...hslToRgb(h, sat, lig), a: alpha };
    }

    function fmt(c) {
        const r = Math.round(clamp(c.r, 0, 255)), g = Math.round(clamp(c.g, 0, 255)), b = Math.round(clamp(c.b, 0, 255));
        const a = Math.round(clamp(c.a, 0, 1) * 1000) / 1000;
        return a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    // Clarté perceptive L* (0 = noir, 100 = blanc)
    function lstar({ r, g, b }) {
        const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        const y = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y;
    }

    const chroma = ({ r, g, b }) => (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
    const mix = (x, y, t) => ({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t, a: 1 });

    function contrast(x, y) {
        const lum = ({ r, g, b }) => {
            const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
            return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        };
        const a = lum(x), b = lum(y);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }

    // =====================================================================
    // Palette cible
    // =====================================================================
    function compile(theme) {
        const get = (k, fb) => parseColor(theme[k] || '') || parseColor(fb);
        const P = {
            dark: theme.mode !== 'light',
            bg: get('bg', '#111215'), surface: get('surface', '#1a1b20'), border: get('border', '#2d2e36'),
            muted: get('muted', '#9a9ba7'), text: get('text', '#e7e7ec'),
            accent: get('accent', '#a78bfa'), info: get('info', '#67d4e8'), success: get('success', '#6ee79a'),
            warning: get('warning', '#fbbf24'), danger: get('danger', '#f87171'),
            raw: theme
        };
        P.stops = [[0, P.bg], [0.09, P.surface], [0.22, P.border], [0.6, P.muted], [1, P.text]];
        const white = { r: 255, g: 255, b: 255, a: 1 };
        const ink = lstar(P.bg) < lstar(P.text) ? P.bg : P.text;
        P.onColor = [white, ink, { r: 12, g: 12, b: 16, a: 1 }];
        // Texte sur couleur d'accent : foncé si le thème est sombre (accents pastel), blanc sinon
        P.onAccent = P.dark ? ink : white;
        return P;
    }

    function ramp(t) {
        if (t <= 0) return mix(pal.bg, pal.surface, clamp(-t / 0.09, 0, 1));
        const S = pal.stops;
        if (t >= 1) return { ...pal.text };
        for (let i = 0; i < S.length - 1; i++) {
            if (t <= S[i + 1][0]) return mix(S[i][1], S[i + 1][1], (t - S[i][0]) / (S[i + 1][0] - S[i][0]));
        }
        return { ...pal.text };
    }

    function semantic(h) {
        if (h < 15 || h >= 335) return pal.danger;
        if (h < 68) return pal.warning;
        if (h < 165) return pal.success;
        if (h < 195) return pal.info;
        return pal.accent;
    }

    function mapColor(c, ctx) {
        if (c.a === 0) return c;
        const L = lstar(c);

        if (chroma(c) < NEUTRAL_CHROMA) {
            // Ombres : toujours sombres, un peu plus marquées sur fond sombre
            if (ctx === 'shadow') return { r: 0, g: 0, b: 0, a: clamp(c.a * (pal.dark ? 1.6 : 1), 0, 0.85) };
            // Voile / fond de modale : on garde le noir translucide
            if (c.a >= 0.3 && c.a < 0.95 && L < 12) return { r: 0, g: 0, b: 0, a: c.a };
            const t = (L - src.bgL) / (src.textL - src.bgL);
            return { ...ramp(clamp(t, -0.2, 1.2)), a: c.a };
        }

        const sem = semantic(rgbToHsl(c).h);
        // Teinte de fond (alerte, ligne en erreur…) : très claire sur Graylog clair, très sombre sur Graylog sombre
        const isTint = c.a >= 0.35 && (src.light ? L > 86 : L < 24);
        if (isTint) return { ...mix(pal.bg, sem, pal.dark ? 0.2 : 0.13), a: c.a };
        // Couleur pleine : teinte du thème, en gardant l'écart de clarté (survol plus foncé, etc.)
        const s = rgbToHsl(c), t = rgbToHsl(sem);
        const l = clamp(t.l + clamp(s.l - 0.5, -0.25, 0.25) * 0.5, 0.1, 0.94);
        return { ...hslToRgb(t.h, t.s, l), a: c.a };
    }

    function mapValue(value, ctx, neutralOnly) {
        const key = `${ctx}|${neutralOnly ? 1 : 0}|${value}`;
        const hit = cache.get(key);
        if (hit !== undefined) return hit;
        const out = value.split(/(url\([^)]*\))/i).map((part, i) => (i % 2 ? part : part.replace(COLOR_RE, (m) => {
            const c = parseColor(m);
            if (!c) return m;
            if (neutralOnly && chroma(c) >= NEUTRAL_CHROMA) return m;
            return fmt(mapColor(c, ctx));
        }))).join('');
        if (cache.size > 20000) cache.clear();
        cache.set(key, out);
        return out;
    }

    // =====================================================================
    // Détection du thème d'origine de Graylog
    // =====================================================================
    function sourceFrom(bg, fg, forced) {
        const bgL = lstar(bg);
        const light = forced ? forced === 'light' : bgL > 50;
        if ((bgL > 50) !== light) return defaults(light);
        let textL = fg ? lstar(fg) : (light ? 20 : 86);
        if (Math.abs(textL - bgL) < 30) textL = light ? 20 : 86;
        return { bgL, textL, light };
    }

    const defaults = (light) => (light ? { bgL: 98, textL: 20, light: true } : { bgL: 14, textL: 86, light: false });

    function detectSource(sheets) {
        const forced = cfg.sourceMode === 'light' || cfg.sourceMode === 'dark' ? cfg.sourceMode : null;
        let bg = null, fg = null;
        for (const sheet of sheets) {
            let list;
            try { list = sheet.cssRules; } catch (e) { continue; }
            for (const r of list) {
                if (!r.selectorText || !ROOT_SEL.test(r.selectorText)) continue;
                // valeurs d'origine si la règle a déjà été remappée
                const orig = original.get(r);
                const val = (p) => (orig ? (orig.find((e) => e[0] === p) || [])[1] : r.style.getPropertyValue(p)) || '';
                const b = parseColor(val('background-color'));
                const c = parseColor(val('color'));
                if (b && b.a > 0.5) bg = b;
                if (c && c.a > 0.5) fg = c;
            }
        }
        if (bg) return sourceFrom(bg, fg, forced);
        const scheme = document.documentElement.getAttribute('data-mantine-color-scheme');
        if (forced) return defaults(forced === 'light');
        if (scheme === 'light' || scheme === 'dark') return defaults(scheme === 'light');
        return null;
    }

    // Faute de règle html/body : on regarde si les fonds déclarés sont plutôt clairs ou sombres
    function guessSource(sheets) {
        let light = 0, dark = 0;
        for (const sheet of sheets) {
            let list;
            try { list = sheet.cssRules; } catch (e) { continue; }
            for (const r of list) {
                const v = r.style && r.style.getPropertyValue('background-color');
                const c = v && parseColor(v);
                if (!c || c.a < 0.9 || chroma(c) >= NEUTRAL_CHROMA) continue;
                if (lstar(c) > 50) light++; else dark++;
            }
        }
        return defaults(light >= dark);
    }

    // =====================================================================
    // Règles CSS
    // =====================================================================
    function capture(rule) {
        const st = rule.style;
        const list = [];
        for (let i = 0; i < st.length; i++) {
            const p = st[i];
            if (!COLOR_PROP.test(p)) continue;
            const v = st.getPropertyValue(p);
            if (v && HAS_COLOR.test(v)) list.push([p, v, st.getPropertyPriority(p)]);
        }
        return list;
    }

    function applyRule(rule) {
        const list = original.get(rule);
        if (!list || !list.length) return;
        const st = rule.style;
        let bg = null, colorEntry = null;
        for (const [p, v, prio] of list) {
            const nv = mapValue(v, /shadow/i.test(p) ? 'shadow' : 'n', false);
            if (st.getPropertyValue(p) !== nv) st.setProperty(p, nv, prio);
            if (p === 'background-color') bg = nv;
            if (p === 'color') colorEntry = [v, prio];
        }
        if (!colorEntry) return;
        const c0 = parseColor(colorEntry[0]);
        if (!c0 || chroma(c0) >= NEUTRAL_CHROMA) return;
        // Texte neutre posé sur un fond coloré dans la même règle (bouton primaire…) : le plus lisible
        const b = bg && parseColor(bg);
        if (b && b.a > 0.85 && chroma(b) >= NEUTRAL_CHROMA) {
            const best = pal.onColor.reduce((x, y) => (contrast(y, b) > contrast(x, b) ? y : x));
            st.setProperty('color', fmt({ ...best, a: c0.a }), colorEntry[1]);
            return;
        }
        // Texte blanc d'un badge / bouton dont le fond est défini ailleurs
        if (lstar(c0) > 94 && ON_COLOR_SEL.test(rule.selectorText || '') && !/alert/i.test(rule.selectorText || '')) {
            st.setProperty('color', fmt({ ...pal.onAccent, a: c0.a }), colorEntry[1]);
        }
    }

    function restoreRule(rule) {
        const list = original.get(rule);
        if (!list) return;
        for (const [p, v, prio] of list) rule.style.setProperty(p, v, prio);
    }

    function walk(list) {
        for (const r of list) {
            if (r.style && !original.has(r)) {
                const cap = capture(r);
                original.set(r, cap);
                if (cap.length) { rules.add(r); applyRule(r); }
            }
            if (r.cssRules && r.cssRules.length) walk(r.cssRules);
        }
    }

    function ownSheet(sheet) {
        const n = sheet.ownerNode;
        return !!(n && n.id && n.id.startsWith('glt-'));
    }

    function scan(force) {
        if (!active) return;
        const sheets = [...document.styleSheets].filter((s) => !ownSheet(s));
        if (!src) {
            src = detectSource(sheets);
            if (!src) {
                // Graylog injecte son CSS après le chargement : on attend un peu avant de deviner
                if (polls < 8) return;
                src = { ...guessSource(sheets), guessed: true };
            }
        } else if (src.guessed && polls % 5 === 0) {
            const found = detectSource(sheets);
            if (found) {
                const changed = found.light !== src.light || Math.abs(found.bgL - src.bgL) > 3;
                src = found;
                if (changed) { cache = new Map(); reapplyAll(); }
            }
        }
        for (const sheet of sheets) {
            let list;
            try { list = sheet.cssRules; } catch (e) { continue; } // feuille d'un autre domaine
            if (!force && sheetLen.get(sheet) === list.length) continue;
            sheetLen.set(sheet, list.length);
            walk(list);
        }
        if (force) for (const r of rules) if (!r.parentStyleSheet) rules.delete(r);
        endBoot();
    }

    // =====================================================================
    // Styles en ligne (graphiques SVG, éléments stylés en JS) : neutres uniquement
    // =====================================================================
    function processEl(el) {
        if (el.closest('[data-glt-ui]')) return;
        const style = el.getAttribute('style');
        const fill = el.getAttribute('fill');
        const stroke = el.getAttribute('stroke');
        let rec = inlineOrig.get(el);
        if (rec && rec.written && style === rec.written.style && fill === rec.written.fill && stroke === rec.written.stroke) return;
        rec = { style, fill, stroke, written: null };

        if (style && HAS_COLOR.test(style)) {
            const st = el.style;
            for (let i = 0; i < st.length; i++) {
                const p = st[i];
                if (!COLOR_PROP.test(p)) continue;
                const v = st.getPropertyValue(p);
                if (v && HAS_COLOR.test(v)) {
                    const nv = mapValue(v, /shadow/i.test(p) ? 'shadow' : 'n', true);
                    if (nv !== v) st.setProperty(p, nv, st.getPropertyPriority(p));
                }
            }
        }
        if (fill && HAS_COLOR.test(fill)) el.setAttribute('fill', mapValue(fill, 'n', true));
        if (stroke && HAS_COLOR.test(stroke)) el.setAttribute('stroke', mapValue(stroke, 'n', true));
        rec.written = { style: el.getAttribute('style'), fill: el.getAttribute('fill'), stroke: el.getAttribute('stroke') };
        inlineOrig.set(el, rec);
        inlineEls.add(el);
    }

    function restoreEl(el) {
        const rec = inlineOrig.get(el);
        if (!rec) return;
        const set = (name, v) => { if (v === null) el.removeAttribute(name); else el.setAttribute(name, v); };
        set('style', rec.style);
        set('fill', rec.fill);
        set('stroke', rec.stroke);
        inlineOrig.delete(el);
    }

    function flushInline() {
        scheduled = false;
        if (!active || !src) { pendingInline.clear(); return; }
        for (const node of pendingInline) {
            if (!node.isConnected) continue;
            if (node.matches && node.matches(INLINE_SEL)) processEl(node);
            if (node.querySelectorAll) node.querySelectorAll(INLINE_SEL).forEach(processEl);
        }
        pendingInline.clear();
    }

    function queueInline(node) {
        pendingInline.add(node);
        if (!scheduled) { scheduled = true; requestAnimationFrame(flushInline); }
    }

    // =====================================================================
    // Styles propres à l'extension
    // =====================================================================
    function styleEl(id) {
        let n = document.getElementById(id);
        if (!n) {
            n = document.createElement('style');
            n.id = id;
            (document.head || document.documentElement).appendChild(n);
        }
        return n;
    }

    const safe = (s) => String(s || '').replace(/[{};<>]/g, '').trim();

    function baseCss() {
        const t = pal.raw;
        const vars = GLT_COLOR_KEYS.map(([k]) => `--glt-${k}: ${t[k]};`).join(' ');
        let css = `:root { ${vars} --glt-radius: ${Number(cfg.radius) >= 0 ? Number(cfg.radius) : 10}px; color-scheme: ${pal.dark ? 'dark' : 'light'}; }
html { scrollbar-color: ${t.border} transparent; }
::selection { background: ${fmt({ ...pal.accent, a: pal.dark ? 0.35 : 0.22 })}; }
`;
        if (safe(cfg.fontUi)) css += `html body, html body :is(button, input, select, textarea) { font-family: ${safe(cfg.fontUi)}; }\n`;
        if (safe(cfg.fontMono)) css += `code, pre, kbd, samp, tt, .ace_editor, .ace_editor * { font-family: ${safe(cfg.fontMono)} !important; }\n`;
        if (cfg.customCss) css += `\n/* CSS personnalisé */\n${cfg.customCss}\n`;
        return css;
    }

    // Évite l'éclair du thème d'origine pendant le chargement
    function startBoot() {
        const s = styleEl('glt-boot');
        s.textContent = `html, body { background-color: ${pal.raw.bg} !important; }`;
        clearTimeout(bootTimer);
        bootTimer = setTimeout(endBoot, 4000);
    }

    function endBoot() {
        if (!src && active) return;
        const s = document.getElementById('glt-boot');
        if (s) s.remove();
    }

    // =====================================================================
    // Activation
    // =====================================================================
    function enable() {
        pal = compile(gltResolveTheme(cfg));
        cache = new Map();
        styleEl('glt-base').textContent = baseCss();
        if (!active) {
            active = true;
            startBoot();
            sheetLen = new WeakMap();
            polls = 0;
            // Règles déjà connues (réactivation après une pause) : on les remappe depuis leurs valeurs d'origine
            if (src) for (const r of rules) { if (r.parentStyleSheet) applyRule(r); else rules.delete(r); }
            scan(true);
            clearInterval(pollTimer);
            pollTimer = setInterval(() => { polls++; scan(polls % 8 === 0); }, 400);
            if (document.body) queueInline(document.body);
        } else {
            reapplyAll();
        }
    }

    function reapplyAll() {
        for (const r of rules) { if (r.parentStyleSheet) applyRule(r); else rules.delete(r); }
        const els = [...inlineEls];
        inlineEls.clear();
        for (const el of els) {
            if (!el.isConnected) continue;
            restoreEl(el);
            processEl(el);
        }
    }

    function disable() {
        active = false;
        clearInterval(pollTimer);
        for (const r of rules) restoreRule(r);
        for (const el of inlineEls) if (el.isConnected) restoreEl(el);
        inlineEls.clear();
        ['glt-base', 'glt-boot'].forEach((id) => { const n = document.getElementById(id); if (n) n.remove(); });
    }

    let paletteKey = '';

    function applyConfig(next) {
        const prevMode = cfg && cfg.sourceMode;
        cfg = next;
        if (!cfg.enabled) { if (active) disable(); paletteKey = ''; return; }
        // Seuls polices / CSS perso ont changé : pas besoin de repasser sur toutes les règles
        const key = JSON.stringify([cfg.theme, cfg.theme === 'custom' ? cfg.custom : null, cfg.sourceMode]);
        if (active && key === paletteKey) { styleEl('glt-base').textContent = baseCss(); return; }
        paletteKey = key;
        if (prevMode !== undefined && prevMode !== cfg.sourceMode && active) {
            // Changement du thème d'origine : on repart des valeurs initiales
            disable();
            src = null;
        }
        enable();
    }

    // =====================================================================
    // Observation de la page
    // =====================================================================
    const mo = new MutationObserver((muts) => {
        if (!active) return;
        let sheets = false;
        for (const m of muts) {
            if (m.type === 'attributes') { queueInline(m.target); continue; }
            const tag = m.target.nodeName;
            if (tag === 'STYLE') { sheets = true; continue; }
            for (const n of m.addedNodes) {
                if (n.nodeType !== 1) continue;
                if (n.nodeName === 'STYLE' || n.nodeName === 'LINK') { if (!(n.id || '').startsWith('glt-')) sheets = true; }
                else queueInline(n);
            }
        }
        if (sheets) {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => scan(false));
        }
    });

    mo.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'fill', 'stroke'] });
    document.addEventListener('DOMContentLoaded', () => { if (active) { scan(true); queueInline(document.body); } });
    window.addEventListener('load', () => { if (active) scan(true); });

    // Tout au début du chargement, la racine du document peut ne pas encore exister
    function whenRoot(fn) {
        if (document.documentElement) { fn(); return; }
        const wait = new MutationObserver(() => {
            if (!document.documentElement) return;
            wait.disconnect();
            fn();
        });
        wait.observe(document, { childList: true });
    }

    chrome.storage.local.get(GLT_DEFAULTS, (c) => whenRoot(() => applyConfig(c)));
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        if (Object.keys(changes).every((k) => ['sites', 'recents', 'hidden', 'envs', 'favorites', 'features', 'skin', 'levelField', 'searchWindow', 'radius', 'focus'].includes(k))) return;
        chrome.storage.local.get(GLT_DEFAULTS, applyConfig);
    });
})();
