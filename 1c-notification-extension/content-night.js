logger.logModuleLoad('content-night.js');

const nightAutoEnable = {
    timer: null,
    enabled: false,
    
    async init() {
        const data = await storage.get(['nightAutoEnableEnabled']);
        this.enabled = data.nightAutoEnableEnabled || false;
        
        if (this.enabled) {
            this.start();
        }
    },
    
    isNightTime() {
        return appUtils.isNightTime();
    },
    
    async enableSoundForPeriod() {
        if (!this.isNightTime()) {
            return false;
        }
        
        try {
            await soundManager.enable();
            logger.log('🌙 Ночное авто-включение: звук включен');
            return true;
        } catch (error) {
            logger.error('🌙 Ошибка ночного авто-включения:', error);
        }
        
        return false;
    },
    
    async start() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        if (this.isNightTime() && !state.soundEnabled) {
            await this.enableSoundForPeriod();
        }
        
        this.timer = setInterval(async () => {
            if (this.isNightTime() && !state.soundEnabled) {
                await this.enableSoundForPeriod();
            }
        }, 300000);
        
        logger.log('🌙 Ночное авто-включение звука запущено');
    },
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            logger.log('🌙 Ночное авто-включение звука остановлено');
        }
    },
    
    async setEnabled(enabled) {
        this.enabled = enabled;
        
        await storage.set({ nightAutoEnableEnabled: enabled });
        
        if (enabled) {
            this.start();
        } else {
            this.stop();
        }
        
        return { success: true };
    },
    
    getStatus() {
        const isNight = this.isNightTime();
        return {
            enabled: this.enabled,
            isNightTime: isNight,
            nextCheck: this.timer ? 'активен' : 'не активен'
        };
    }
};

function loadMaxModule() {
    try {
        if (window.maxModule) {
            window.maxModule.init().then(() => {
                logger.log('🔧 MAX module initialized');
            }).catch(err => {
                logger.error('🔧 MAX module init error:', err);
            });
        } else {
            logger.warn('🔧 MAX module not found');
        }
    } catch (error) {
        logger.error('🔧 Error loading MAX module:', error);
    }
}
