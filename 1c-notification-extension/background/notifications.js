const TARGET_DOMAIN = 'https://2phoenix.alidi.ru/';

function createNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title,
        message,
        priority: 2
    }, (notificationId) => {
        if (chrome.runtime.lastError) {
            logger.error('🔧 Notification error:', chrome.runtime.lastError);
        } else {
            logger.log('🔧 Desktop notification shown:', notificationId);
            setTimeout(() => chrome.notifications.clear(notificationId), 5000);
        }
    });
}

chrome.notifications.onClicked.addListener((notificationId) => {
    logger.log('🔧 Notification clicked:', notificationId);
    chrome.tabs.query({ url: TARGET_DOMAIN + '*' }, (tabs) => {
        if (tabs?.[0]?.id) chrome.tabs.update(tabs[0].id, { active: true });
    });
});

export { createNotification, TARGET_DOMAIN };
