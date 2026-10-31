import { DEFAULT_MANIFEST, EXTENSION_ID, EXTENSION_VERSION, RESOURCE_VERSION, readSettings, validateManifestURL } from './config.0.1.7.d4851284c4ba8f63.js';
let cleanup;
// Replaced by the build; the displayed extension version can stay unchanged.
const BUILD_ID = 'd4dce7e119618413';
function context() {
    const host = window.SillyTavern?.getContext?.();
    if (!host?.extensionSettings || typeof host.saveSettingsDebounced !== 'function')
        throw Error('MDPro3 需要 SillyTavern 1.18.0 或更新版本的设置接口。');
    return host;
}
function element(tag, text = '') {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
}
/** Called by the host's manifest hook. No game, network or model request at activation. */
export function onActivate() {
    if (cleanup)
        return;
    const host = context();
    const container = document.querySelector('#extensions_settings2') ?? document.querySelector('#extensions_settings');
    if (!container)
        throw Error('未找到酒馆扩展设置区域；请在页面加载完成后重试。');
    const lifetime = new AbortController();
    const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: lifetime.signal });
    const panel = element('section');
    panel.id = 'mdpro3-duel-settings';
    const details = element('details');
    details.open = true;
    details.append(element('summary', `MDPro3 决斗 · ${EXTENSION_VERSION}`));
    const body = element('div');
    body.className = 'mdpro3-duel-settings-body';
    const launch = element('button', '打开决斗');
    launch.type = 'button';
    launch.className = 'menu_button';
    const label = element('label', '资源清单地址');
    label.htmlFor = 'mdpro3-duel-manifest';
    const input = element('input');
    input.id = label.htmlFor;
    input.type = 'url';
    input.spellcheck = false;
    input.value = readSettings(host.extensionSettings[EXTENSION_ID]).manifestURL;
    const save = element('button', '保存地址'), reset = element('button', '恢复默认地址');
    save.type = reset.type = 'button';
    const status = element('p', '打开时加载游戏；收起会保留本局，结束并关闭会释放游戏。');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const row = element('div');
    row.className = 'mdpro3-duel-settings-actions';
    row.append(save, reset);
    body.append(element('small', '作者：千叶の堕天圣'), launch, label, input, row, element('small', `资源版本：${RESOURCE_VERSION}。地址变更在结束并重新打开后生效。`), status);
    details.append(body);
    panel.append(details);
    container.append(panel);
    let dialog, frame;
    let gameLifetime;
    let lastFocus = null;
    const minimize = () => {
        if (!dialog)
            return;
        dialog.close();
        launch.textContent = '继续决斗';
        status.textContent = '决斗已收起，本局和音频继续运行。';
        lastFocus?.focus();
    };
    const end = () => {
        gameLifetime?.abort();
        gameLifetime = undefined;
        if (frame) {
            try {
                frame.contentWindow?.__MDPRO3_DISPOSE_GAME__?.();
            }
            catch (error) {
                console.warn('[MDPro3-ST] Game cleanup failed; removing its browsing context', error);
            }
            frame.remove();
            frame = undefined;
        }
        dialog?.close();
        dialog?.remove();
        dialog = undefined;
        launch.textContent = '打开决斗';
        status.textContent = '本局已结束并关闭。重新打开将创建新的游戏。';
        lastFocus?.focus();
    };
    const saveAddress = (value) => {
        try {
            const manifestURL = validateManifestURL(value), current = context();
            current.extensionSettings[EXTENSION_ID] = { ...readSettings(current.extensionSettings[EXTENSION_ID]), manifestURL };
            current.saveSettingsDebounced();
            input.value = manifestURL;
            status.textContent = frame ? '地址已保存；结束并重新打开后生效，本局继续使用原地址。' : '地址已保存。';
        }
        catch (error) {
            status.textContent = error instanceof Error ? error.message : String(error);
        }
    };
    listen(save, 'click', () => saveAddress(input.value));
    listen(reset, 'click', () => saveAddress(DEFAULT_MANIFEST));
    listen(launch, 'click', () => {
        try {
            if (!window.isSecureContext || !window.crypto?.subtle || typeof Worker === 'undefined' || typeof WebAssembly === 'undefined')
                throw Error('游戏需要 HTTPS 或 localhost 安全环境，以及 WebAssembly、Worker 和 SHA-256 支持。');
            if (typeof HTMLDialogElement === 'undefined' || typeof HTMLDialogElement.prototype.showModal !== 'function')
                throw Error('当前浏览器缺少对话框支持，请升级浏览器后重试。');
            lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : launch;
            if (!dialog) {
                const manifestURL = readSettings(context().extensionSettings[EXTENSION_ID]).manifestURL;
                if (location.protocol === 'https:' && new URL(manifestURL).protocol === 'http:')
                    throw Error('HTTPS 酒馆无法加载 HTTP 资源，请使用 HTTPS 资源清单。');
                dialog = element('dialog');
                dialog.id = 'mdpro3-duel-window';
                dialog.setAttribute('aria-label', 'MDPro3 决斗');
                const header = element('header'), hide = element('button', '收起'), stop = element('button', '结束并关闭');
                hide.type = stop.type = 'button';
                stop.title = '释放游戏、音频和对局 Worker；本局不保留';
                header.append(element('strong', 'MDPro3 决斗'), hide, stop);
                frame = element('iframe');
                frame.title = 'MDPro3 游戏';
                frame.allow = 'autoplay; fullscreen';
                frame.allowFullscreen = true;
                const url = new URL('./game/index.html', import.meta.url);
                url.search = new URLSearchParams({ duel: '1', engine: 'browser', manifestURL, extensionVersion: EXTENSION_VERSION, build: BUILD_ID }).toString();
                frame.src = url.href;
                dialog.append(header, frame);
                document.body.append(dialog);
                gameLifetime = new AbortController();
                hide.addEventListener('click', minimize, { signal: gameLifetime.signal });
                stop.addEventListener('click', end, { signal: gameLifetime.signal });
                dialog.addEventListener('cancel', event => { event.preventDefault(); minimize(); }, { signal: gameLifetime.signal });
            }
            dialog.showModal();
            launch.textContent = '继续决斗';
            status.textContent = '游戏已打开。首次使用会按需下载并校验资源。';
        }
        catch (error) {
            status.textContent = error instanceof Error ? error.message : String(error);
        }
    });
    listen(window, 'message', event => {
        const message = event;
        if (frame && message.origin === location.origin && message.source === frame.contentWindow && message.data?.type === 'mdpro3-duel:minimize')
            minimize();
    });
    cleanup = () => { lifetime.abort(); end(); panel.remove(); cleanup = undefined; };
    listen(window, 'pagehide', () => cleanup?.());
    console.info('[MDPro3-ST] Extension activated', EXTENSION_VERSION);
}
export function onEnable() { onActivate(); }
export function onDisable() { cleanup?.(); }
export function onDelete() { cleanup?.(); }
export function onClean() { cleanup?.(); }
export function onUpdate() { cleanup?.(); }
