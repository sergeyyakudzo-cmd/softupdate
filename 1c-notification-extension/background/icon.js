let iconUpdateScheduled = false;
let lastIconUpdateTime = 0;
const ICON_UPDATE_COOLDOWN = 2000;

let monitoringState = { isActive: false, classificationCount: 0, groupCount: 0 };

function updateMonitoringState(state) {
    if (state) {
        monitoringState.isActive = state.isMonitoring || false;
        monitoringState.classificationCount = state.count || 0;
        monitoringState.groupCount = state.groupCount || 0;
    }
}

function debouncedUpdateIcon() {
    const now = Date.now();
    if (now - lastIconUpdateTime < ICON_UPDATE_COOLDOWN) {
        if (!iconUpdateScheduled) {
            iconUpdateScheduled = true;
            setTimeout(() => {
                iconUpdateScheduled = false;
                lastIconUpdateTime = Date.now();
                updateExtensionIcon();
            }, ICON_UPDATE_COOLDOWN);
        }
        return;
    }
    lastIconUpdateTime = now;
    updateExtensionIcon();
}

function updateExtensionIcon() {
    const totalCount = monitoringState.classificationCount;
    logger.log('🔧 Background: Updating icon - Active:', monitoringState.isActive, 'Classification count:', totalCount);

    let badgeText;
    let badgeColor;

    if (!monitoringState.isActive) {
        badgeText = '●';
        badgeColor = [128, 128, 128, 255];
    } else if (totalCount > 0) {
        badgeText = totalCount > 99 ? '99+' : totalCount.toString();
        badgeColor = [249, 115, 22, 255];
    } else {
        badgeText = '●';
        badgeColor = [34, 197, 94, 255];
    }

    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });

    let title = '1C Монитор заявок';
    if (!monitoringState.isActive) title += ' - ВЫКЛ';
    else if (totalCount > 0) title += ` - ${totalCount} на классификации`;
    else title += ' - Активен';

    chrome.action.setTitle({ title });
}

export { debouncedUpdateIcon, updateExtensionIcon, updateMonitoringState };
