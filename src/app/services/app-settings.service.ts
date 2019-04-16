import { Injectable } from '@angular/core';
import set = Reflect.set;

export type WalletStore = 'localStorage'|'none';
export type PoWSource = 'server'|'clientCPU'|'clientWebGL'|'best';

interface AppSettings {
  displayDenomination: string;
  // displayPrefix: string | null;
  walletStore: string;
  displayCurrency: string;
  defaultRepresentative: string | null;
  lockOnClose: number;
  lockInactivityMinutes: number;
  powSource: PoWSource;
  serverName: string;
  serverAPI: string | null;
  serverNode: string | null;
  serverWS: string | null;
  minimumReceive: string | null;
}

@Injectable()
export class AppSettingsService {
  storeKey = `nanovault-appsettings`;

  // Default settings
  defaultSettings: AppSettings = {
    displayDenomination: 'mnano',
    // displayPrefix: 'xrb',
    walletStore: 'localStorage',
    displayCurrency: 'USD',
    defaultRepresentative: null,
    lockOnClose: 1,
    lockInactivityMinutes: 30,
    powSource: 'best',
    serverName: 'nanovault',
    serverAPI: 'https://nanovault.io/api/node-api',
    serverNode: null,
    serverWS: null,
    minimumReceive: null,
  };

  // a deep copy clone of the default settings
  cloneDefaultSettings() : AppSettings {
    return JSON.parse(JSON.stringify(this.defaultSettings));
  }
  settings: AppSettings = this.cloneDefaultSettings(); // deep copy

  constructor() { }

  loadAppSettings() {
    let settings: AppSettings = this.settings;
    const settingsStore = localStorage.getItem(this.storeKey);
    if (settingsStore) {
      settings = JSON.parse(settingsStore);
    }
    this.settings = Object.assign(this.settings, settings);

    return this.settings;
  }

  saveAppSettings() {
    localStorage.setItem(this.storeKey, JSON.stringify(this.settings));
  }

  getAppSetting(key) {
    return this.settings[key] || null;
  }

  setAppSetting(key, value) {
    this.settings[key] = value;
    this.saveAppSettings();
  }

  setAppSettings(settingsObject) {
    for (let key in settingsObject) {
      if (!settingsObject.hasOwnProperty(key)) continue;
      this.settings[key] = settingsObject[key];
    }

    this.saveAppSettings();
  }

  clearAppSettings() {
    localStorage.removeItem(this.storeKey);
    this.settings = this.cloneDefaultSettings(); // deep copy
  }

}
