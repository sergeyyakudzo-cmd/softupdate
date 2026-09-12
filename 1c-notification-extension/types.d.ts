declare function importScripts(...paths: string[]): void;

// ============ Global declarations for cross-file variables ============



declare var logger: {
  logModuleLoad(name: string): void;
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  info(...args: unknown[]): void;
  getAll(): Promise<string[]>;
  download(): Promise<boolean>;
  clear(): Promise<void>;
  setLevel(level: number): void;
  getLevel(): number;
  LEVEL: { DEBUG: number; INFO: number; WARN: number; ERROR: number };
};

// (declared in config.js: const CONFIG)
// (declared in shared/constants.js: const SHARED_CONSTANTS)

declare var utils: {
  getNumberWord(num: number): string;
  getCaseWord(num: number, forms: [string, string, string]): string;
  formatTime(date?: Date): string;
};

declare var storageUtils: {
  get(keys: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>;
  set(data: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
};

declare var maxModule: {
  init(): Promise<void>;
  saveSettings(settings: Record<string, unknown>): Promise<{ success: boolean; error?: string }>;
  getSettings(): {
    enabled: boolean;
    userId: string;
    isConfigured: boolean;
    botToken: string;
    messageTemplate: string;
    groupMessageTemplate: string;
    sendImmediately: boolean;
    pendingNotifications: number;
    botInfo: { name: string; username: string } | null;
    [key: string]: unknown;
  };
  sendClassificationAlert(count: number, numbers: string[]): Promise<{ success: boolean; queued?: boolean; reason?: string }>;
  sendGroupAlert(count: number, numbers?: string[]): Promise<{ success: boolean; queued?: boolean; reason?: string }>;
  sendMessage(text: string, options?: Record<string, unknown>): Promise<{ success: boolean; error?: string; userId?: string }>;
};

declare function generateUpdateBat(extFolder: string, githubBase: string): string | null;

// Sanitized config exposed to window (without BOT_TOKEN)
interface WindowConfig {
  MAX: Record<string, never>;
  UPDATE: { GITHUB_BASE: string; EXTENSION_FOLDER: string };
}

// ============ Content script globals ============
// (declared in content-state.js, content-monitor.js, etc. with const/let)
// TypeScript picks them up from checkJs; no declare needed here.
// Interfaces below are for reference/documentation in other .d.ts consumers.

interface MonitorInterface {
  shiftTrackingIntervalId: number | null;
  start(): void;
  stop(): void;
  restart(): void;
  checkApplications(): void;
  startShiftTracking(): void;
  sendShiftUpdate(counts: ApplicationCounts): void;
  notifyClassification(count: number): void;
  notifyGroup(count: number): void;
  trackAndAutoTake(counts: ApplicationCounts): Promise<void>;
  autoTakeTicket(num: string): Promise<void>;
  clickContextMenuItem(num: string): Promise<void>;
  sendStateUpdate(counts?: ApplicationCounts | null): void;
  countRealApplications(): ApplicationCounts;
}

// (declared in content-audio.js: const audio)
// (declared in content-sound.js: const soundManager)
// (declared in content-voice.js: const voice)
// (declared in content-night.js: const nightAutoEnable, function loadMaxModule)
// (declared in content.js: const messageHandler, function init, function debugApplicationNumbers)

// ============ Window Augmentations ============

interface Window {
  CONFIG: WindowConfig;
  logger: typeof logger;
  SHARED_CONSTANTS: typeof SHARED_CONSTANTS;
  utils: typeof utils;
  storageUtils: typeof storageUtils;
  maxModule: typeof maxModule;
  generateUpdateBat: typeof generateUpdateBat;
  __soundTimers: number[];
  __st: (fn: (...args: unknown[]) => unknown, delay: number) => number;
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
  lastClassificationNotificationTime: number;
  lastGroupNotificationTime: number;
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
  totalUnique: number;
  classificationTotal: number;
  groupTotal: number;
  seenOnClassification: string[];
  seenInGroup: string[];
  hourlyClassification: number[];
  hourlyGroup: number[];
  currentClassificationCount: number;
  currentGroupCount: number;
  peakClassification: number;
  peakClassificationTime: string | null;
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
