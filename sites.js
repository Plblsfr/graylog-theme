// Gestion des sites supplémentaires (autres instances Graylog) — partagé par le popup et le service worker
var GLT_SCRIPT_ID = 'glt-extra-sites';

// "https://graylog.exemple.com:9000" → motif Chrome (le port n'y figure pas : tous les ports sont couverts)
function gltPattern(origin) {
    const u = new URL(origin);
    return `${u.protocol}//${u.hostname}/*`;
}

async function gltSyncSites(sites) {
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [GLT_SCRIPT_ID] });
    const granted = [];
    for (const o of sites || []) {
        if (await chrome.permissions.contains({ origins: [gltPattern(o)] })) granted.push(gltPattern(o));
    }
    if (!granted.length) {
        if (existing.length) await chrome.scripting.unregisterContentScripts({ ids: [GLT_SCRIPT_ID] });
        return;
    }
    const def = { id: GLT_SCRIPT_ID, matches: granted, js: ['themes.js', 'engine.js'], runAt: 'document_start', persistAcrossSessions: true };
    if (existing.length) await chrome.scripting.updateContentScripts([def]);
    else await chrome.scripting.registerContentScripts([def]);
}
