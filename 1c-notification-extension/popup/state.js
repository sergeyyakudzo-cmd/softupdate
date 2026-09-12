const $id = (id) => document.getElementById(id);
const $input = (id) => $id(id);

const elements = {
    statusText: $id('statusText'),
    countText: $id('countText'),
    groupCountText: $id('groupCountText'),
    lastNotification: $id('lastNotification'),

    toggleMonitor: $id('toggleMonitor'),
    refreshCount: $id('refreshCount'),

    toggleMax: $input('toggleMax'),
    configureMax: $id('configureMax'),
    maxStatus: $id('maxStatus'),
    maxUserId: $input('maxUserId'),

    toggleAutoRestart: $input('toggleAutoRestart'),
    autoRestartInterval: $input('autoRestartInterval'),
    autoRestartStatus: $id('autoRestartStatus'),

    toggleAutoTake: $input('toggleAutoTake'),
    autoTakeTimeout: $input('autoTakeTimeout'),
    currentAutoTakeTimeout: $id('currentAutoTakeTimeout'),
    autoTakeStatus: $id('autoTakeStatus'),

    toggleNightAutoEnable: $input('toggleNightAutoEnable'),
    nightAutoEnableStatus: $id('nightAutoEnableStatus'),
    nextNightEnableTime: $id('nextNightEnableTime'),

    toggleSound: $input('toggleSound'),
    dashboardToggleSound: $id('dashboardToggleSound'),
    toggleGroupMonitor: $input('toggleGroupMonitor'),
    soundStatus: $id('soundStatus'),
    groupMonitorStatus: $id('groupMonitorStatus'),
    classificationSoundToggle: $id('classificationSoundToggle'),
    groupSoundToggle: $id('groupSoundToggle'),

    soundVolumeSlider: $input('soundVolumeSlider'),
    groupVolumeSlider: $input('groupVolumeSlider'),
    soundVolumeValue: $id('soundVolumeValue'),
    groupVolumeValue: $id('groupVolumeValue'),

    testSound: $id('testSound'),
    testGroupSound: $id('testGroupSound'),

    checkInterval: $input('checkInterval'),
    notificationCooldown: $input('notificationCooldown'),
    applyIntervals: $id('applyIntervals'),

    showSettings: $id('showSettings'),

    soundSettingsModal: $id('soundSettingsModal'),
    typeSoundModal: $input('typeSoundModal'),
    typeVoiceModal: $input('typeVoiceModal'),
    voiceStatusModal: $id('voiceStatusModal'),
    voiceVolumeSliderModal: $input('voiceVolumeSliderModal'),
    voiceVolumeValueModal: $id('voiceVolumeValueModal'),
    voiceVolumeSection: $id('voiceVolumeSection'),
    soundSelectionSection: $id('soundSelectionSection'),
    classificationSoundsModal: $id('classificationSoundsModal'),
    groupSoundsModal: $id('groupSoundsModal'),
    saveSettings: $id('saveSettings'),
    closeSettings: $id('closeSettings'),

    ignoreModal: $id('ignoreModal'),
    ignoreNumberInput: $input('ignoreNumberInput'),
    addIgnoreNumberBtn: $id('addIgnoreNumber'),
    ignoredNumbersList: $id('ignoredNumbersList'),
    clearIgnoredNumbersBtn: $id('clearIgnoredNumbers'),
    saveIgnoreSettingsBtn: $id('saveIgnoreSettings'),
    closeIgnoreModalBtn: $id('ignoreModalClose'),
    ignoreSettingsBtn: $id('ignoreSettings'),
    notificationThreshold: $input('notificationThreshold'),

    exportSettingsBtn: $id('exportSettings'),
    importSettingsBtn: $id('importSettings'),
    importFileInput: $input('importFileInput'),

    statTotalToday: $id('statTotalToday'),
    statClassification: $id('statClassification'),
    statGroup: $id('statGroup'),
    statPeak: $id('statPeak'),
    statPeakTime: $id('statPeakTime'),

        emptyRefresh: $id('emptyRefresh'),

    downloadLogsBtn: $id('downloadLogs'),
    clearLogsBtn: $id('clearLogs'),
    logsInfo: $id('logsInfo'),

    checkUpdate: $id('checkUpdate'),
    applyUpdate: $id('applyUpdate'),
    updateStatus: $id('updateStatus'),
    extensionFolder: $input('extensionFolder'),

    openReport: $id('openReport'),
    statsSendStatus: $id('statsSendStatus'),
};

const state = {
    isSoundEnabled: true,
    isGroupMonitoringEnabled: false,
    classSoundEnabled: true,
    groupSoundEnabled: true,
    isMonitoring: false,
    notificationType: 'sound',
    currentTab: null,
    soundType: 'modern',
    groupSoundType: 'group_chime',
    soundVolume: 80,
    groupVolume: 70,
    voiceVolume: 100,
    voiceAvailable: true,
    soundOptions: [],
    groupSoundOptions: [],
    soundInfo: null,
    soundDisableTimer: null,
    checkInterval: 10000,
    notificationCooldown: 10000,
    lastUpdate: null,

    sessionStart: Date.now(),
    sessionTotalRequests: 0,
    _lastSessionTotal: 0,
    lastCheckTime: null,

    lastCheckTimestamp: null,
    checkIntervalMs: 10000,
    _monitoringStarted: false,

    notificationThreshold: 1,
    lastNotifiedCount: { classification: 0, group: 0 },

    knownApplicationNumbers: { classification: [], group: [] },

    hourlyClassification: [],
    hourlyGroup: [],

    chartPeriod: 'day',

    todayStats: {
        date: new Date().toDateString(),
        totalRequests: 0,
        classificationCount: 0,
        groupCount: 0,
        peakCount: 0,
        peakTime: null,
        checks: 0,
        counts: []
    },

    sectionOpenCounts: {},
    popupOpenCount: 0,

    autoRestartEnabled: false,
    autoRestartInterval: 30000,
    autoRestartTimer: null,
    autoRestartCheckCount: 0,

    autoTakeEnabled: false,
    autoTakeTimeout: 240000,

    nightAutoEnableEnabled: false,
    nextNightEnableTimer: null,

    maxEnabled: false,
    maxConfigured: false,
    maxSettings: { enabled: false, userId: '' },

    modalState: {
        notificationType: 'sound',
        soundType: 'modern',
        groupSoundType: 'group_chime',
        voiceVolume: 100
    },
};

const intervalIds = new Set();
const previousCounts = { classification: 0, group: 0 };
let logoClickCount = 0;

const logo = document.querySelector('.app-logo');
if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
        logoClickCount++;
        if (logoClickCount >= 5) {
            const secretDiv = document.getElementById('secretAutoTake');
            if (secretDiv && secretDiv.style.display !== 'block') {
                secretDiv.style.display = 'block';
                logger.log('🔧 Secret auto-take settings revealed');
            }
            logoClickCount = 0;
        }
    });
}

function createSafeInterval(fn, ms) {
    const id = setInterval(fn, ms);
    intervalIds.add(id);
    return id;
}

function clearSafeInterval(id) {
    if (id) {
        clearInterval(id);
        intervalIds.delete(id);
    }
}

export { elements, state, intervalIds, previousCounts, createSafeInterval, clearSafeInterval };
