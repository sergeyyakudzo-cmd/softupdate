let cdpAttachedTabId = null;
let cdpAttachPromise = null;

function cdpAttach(tabId) {
    if (cdpAttachPromise) return cdpAttachPromise;
    function doAttach(tid) {
        return new Promise((res, rej) => {
            chrome.debugger.attach({ tabId: tid }, '1.3', () => {
                if (chrome.runtime.lastError) return rej(new Error(chrome.runtime.lastError.message));
                cdpAttachedTabId = tid;
                res();
            });
        });
    }
    cdpAttachPromise = new Promise((resolve, reject) => {
        if (cdpAttachedTabId === tabId) return resolve();
        if (cdpAttachedTabId !== null) {
            cdpDetach().then(() => doAttach(tabId)).then(resolve).catch(reject);
        } else {
            doAttach(tabId).then(resolve).catch(reject);
        }
    }).finally(() => { cdpAttachPromise = null; });
    return cdpAttachPromise;
}

function cdpDetach() {
    if (cdpAttachedTabId === null) return Promise.resolve();
    const tabId = cdpAttachedTabId;
    return new Promise((resolve) => {
        chrome.debugger.detach({ tabId }, () => {
            cdpAttachedTabId = null;
            resolve();
        });
    });
}

function cdpSendCommand(method, params) {
    if (cdpAttachedTabId === null) return Promise.reject(new Error('CDP not attached to any tab'));
    const tabId = cdpAttachedTabId;
    return new Promise((resolve, reject) => {
        chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
            if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
            resolve(result);
        });
    });
}

function cdpMouseClick(x, y, button) {
    const btn = button === 2 ? 'right' : 'left';
    return cdpSendCommand('Input.dispatchMouseEvent', {
        type: 'mousePressed', x, y, button: btn, clickCount: 1
    }).then(() => cdpSendCommand('Input.dispatchMouseEvent', {
        type: 'mouseReleased', x, y, button: btn, clickCount: 1
    }));
}

function cdpKey(key) {
    return cdpSendCommand('Input.dispatchKeyEvent', { type: 'keyDown', key })
        .then(() => cdpSendCommand('Input.dispatchKeyEvent', { type: 'keyUp', key }));
}

function getAttachedTabId() { return cdpAttachedTabId; }
function setAttachedTabId(v) { cdpAttachedTabId = v; }

export { cdpAttach, cdpDetach, cdpMouseClick, cdpKey, getAttachedTabId, setAttachedTabId };
