import XMindPlugin from "../../main";

export interface ObsidianZoomPluginSettings {
  debug: boolean;
  zoomOnClick: boolean;
}

export interface Storage {
  loadData(): Promise<any>;
  saveData(settings: any): Promise<void>;
}

type K = keyof ObsidianZoomPluginSettings;
type V<T extends K> = ObsidianZoomPluginSettings[T];
type Callback<T extends K> = (cb: V<T>) => void;

export class SettingsService implements ObsidianZoomPluginSettings {
  private handlers: Map<K, Set<Callback<K>>>;
  private plugin: XMindPlugin;

  constructor(plugin: Storage) {
    this.plugin = plugin as XMindPlugin;
    this.handlers = new Map();
  }

  get debug() {
    return this.plugin.settings.debugMode;
  }
  set debug(value: boolean) {
    this.set("debug", value);
  }

  get zoomOnClick() {
    return this.plugin.settings.zoomOnClick;
  }
  set zoomOnClick(value: boolean) {
    this.set("zoomOnClick", value);
  }

  onChange<T extends K>(key: T, cb: Callback<T>) {
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
    }

    this.handlers.get(key).add(cb);
  }

  removeCallback<T extends K>(key: T, cb: Callback<T>): void {
    const handlers = this.handlers.get(key);

    if (handlers) {
      handlers.delete(cb);
    }
  }

  async load() {
    // 不需要从文件加载，直接使用 XMind 插件的设置
  }

  async save() {
    await this.plugin.saveSettings();
  }

  private set<T extends K>(key: T, value: V<K>): void {
    if (key === "debug") {
      this.plugin.settings.debugMode = value as boolean;
    } else if (key === "zoomOnClick") {
      this.plugin.settings.zoomOnClick = value as boolean;
    }
    
    const callbacks = this.handlers.get(key);

    if (!callbacks) {
      return;
    }

    for (const cb of callbacks.values()) {
      cb(value);
    }
  }
} 