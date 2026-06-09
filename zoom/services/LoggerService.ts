import { SettingsService } from "./SettingsService";

export class LoggerService {
  constructor(private settings: SettingsService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type inference limitation
  log(method: string, ...args: any[]) {
    if (!this.settings.debug) {
      return;
    }

    console.info(`[XMind-Zoom][${method}]`, ...args);
  }

  bind(namespace: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type inference limitation
    return (...args: any[]) => this.log(namespace, ...args);
  }
} 