export const EXTENSION_ID = 'mdpro3-duel';
export const EXTENSION_VERSION = '0.1.13';
export const RESOURCE_VERSION = 'w14-graves-e8ad35a1baf58f7a2ddebf5f';
export const DEFAULT_MANIFEST = `https://assets.cloudxu.de5.net/releases/${RESOURCE_VERSION}/release.json`;
const PREVIOUS_DEFAULT_MANIFEST = 'https://assets.cloudxu.de5.net/releases/w12-85f0c7db432f62264c0c68e9/release.json';
export function validateManifestURL(value) {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash)
        throw Error('请填写不含账号、密码或片段的 HTTP(S) 资源清单地址。');
    return url.href;
}
export function readSettings(value) {
    const saved = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    let manifestURL = DEFAULT_MANIFEST;
    try {
        if (typeof saved.manifestURL === 'string' && saved.manifestURL !== PREVIOUS_DEFAULT_MANIFEST)
            manifestURL = validateManifestURL(saved.manifestURL);
    }
    catch { /* Invalid saved URL falls back to the pinned release. */ }
    return { ...saved, manifestURL };
}
