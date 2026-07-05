// ============ Window Augmentations ============

interface Window {
  // From config.js
  readonly CONFIG: {
    CHECK_INTERVAL: number;
    NOTIFICATION_SOUND: string;
    MAX?: {
      ENABLED: boolean;
      BOT_TOKEN?: string;
      API_URL?: string;
    };
  };

  // From logger.js
  readonly logger: {
    logModuleLoad(name: string): void;
    log(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    info(...args: unknown[]): void;
    getAll(): Promise<string[]>;
    download(): Promise<boolean>;
    clear(): Promise<void>;
  };

  // From shared/constants.js
  readonly SHARED_CONSTANTS: typeof import('./shared/constants');

  // From utils.js
  readonly utils: {
    getNumberWord(num: number): string;
    getCaseWord(num: number, forms: [string, string, string]): string;
    debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T;
    throttle<T extends (...args: unknown[]) => void>(fn: T, ms: number): T;
  };

  // From utils.js
  readonly storageUtils: {
    get(keys: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>;
    set(data: Record<string, unknown>): Promise<void>;
    remove(keys: string | string[]): Promise<void>;
  };

  // From max.js
  readonly maxModule?: {
    init(): Promise<void>;
    saveSettings(settings: Record<string, unknown>): Promise<{ success: boolean; error?: string }>;
    getSettings(): {
      enabled: boolean;
      userId: string;
      isConfigured: boolean;
      [key: string]: unknown;
    };
    sendClassificationAlert(count: number, numbers: string[]): Promise<{ success: boolean }>;
    sendGroupAlert(count: number): Promise<{ success: boolean }>;
    sendMessage(text: string): Promise<{ success: boolean }>;
  };

  // From update-generator.js
  generateUpdateBat(extFolder: string, githubBase: string): string | null;
}

// ============ Shared Constants Types ============

interface AppConfig {
  DEFAULT_CHECK_INTERVAL: number;
  DEFAULT_COOLDOWN: number;
  NIGHT_TIME_START: number;
  NIGHT_TIME_END: number;
  MAX_NIGHT_DISABLE_MINUTES: number;
  HD_PATTERN: string;
}

interface SoundPlayer {
  name: string;
  description: string;
  play: (context: AudioContext, volume?: number) => void;
}

interface SoundLibrary {
  [key: string]: SoundPlayer;
}

interface MonitoringState {
  isMonitoring: boolean;
  isGroupMonitoring: boolean;
  lastCount: number;
  lastGroupCount: number;
  soundEnabled: boolean;
  notificationType: 'sound' | 'voice';
  soundType: string;
  groupSoundType: string;
  voiceVolume: number;
  soundVolume: number;
  groupVolume: number;
  checkInterval: number;
  notificationCooldown: number;
  lastNotificationTime: number;
  autoRestartEnabled: boolean;
  autoRestartInterval: number;
  maxEnabled: boolean;
  ignoredNumbers: string[];
  autoTakeEnabled: boolean;
  autoTakeTimeout: number;
  autoTakeProcessing: boolean;
  trackedTickets: Record<string, number>;
  takenTickets: Record<string, boolean>;
}

interface ApplicationCounts {
  count: number;
  groupCount: number;
  uniqueCount: number;
  classificationNumbers: string[];
  groupNumbers: string[];
  onlyClassification: string[];
  onlyGroup: string[];
  commonNumbers: string[];
  allNumbers: string[];
  numberToRow: Record<string, Element>;
}

interface SoundInfo {
  enabled: boolean;
  isNightTime: boolean;
  maxDisableMinutes: number;
  timeLeft: number | null;
  disableEndTime: Date | null;
  canDisableIndefinitely: boolean;
  notificationType: string;
  soundType: string;
  groupSoundType: string;
  voiceAvailable: boolean;
  soundOptions: { id: string; name: string; description: string }[];
  groupSoundOptions: { id: string; name: string; description: string }[];
}

// ============ Shift / Stats Types ============

interface ShiftData {
  date: string;
  startTime: string;
  classificationTotal: number;
  groupTotal: number;
  classificationOnly: number;
  groupOnly: number;
  commonTotal: number;
  monthlyClassification: number;
  monthlyGroup: number;
  [key: string]: unknown;
}

interface DailyStats {
  totalRequests: number;
  classificationCount: number;
  groupCount: number;
  peakCount: number;
  peakTime: string;
}

interface MonthlyStats {
  classificationOnly: number;
  groupOnly: number;
  commonTotal: number;
  dates: Record<string, {
    classification: number;
    group: number;
  }>;
  [key: string]: unknown;
}
