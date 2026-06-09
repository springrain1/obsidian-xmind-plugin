import { SettingsService } from "./SettingsService";

export class LoggerService {
  constructor(private settings: SettingsService) {}  log(method: string, ...args: unknown[]) {
    if (!this.settings.debug) {
      return;
    }

    console.info(`[XMind-Zoom][${method}]`, ...args);
  }

  bind(namespace: string) {    return (...args: unknown[]) => this.log(namespace, ...args);
  }
} 