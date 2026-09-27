importScripts('themes.js', 'sites.js');

// Raccourci clavier : activer / désactiver le thème
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'open-customizer') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) chrome.tabs.sendMessage(tab.id, { type: 'glt:customizer' }).catch(() => {});
        return;
    }
    if (command !== 'toggle-theme') return;
    const { enabled = true } = await chrome.storage.local.get('enabled');
    await chrome.storage.local.set({ enabled: !enabled });
});

// Après installation ou mise à jour : réenregistrer les sites supplémentaires
chrome.runtime.onInstalled.addListener(async () => {
    const { sites = [] } = await chrome.storage.local.get('sites');
    try { await gltSyncSites(sites); } catch (e) { console.warn('Graylog Theme :', e); }
});
