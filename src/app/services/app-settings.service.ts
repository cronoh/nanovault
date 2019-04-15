import { Injectable } from '@angular/core';
import * as url from 'url';

export type WalletStore = 'localStorage'|'none';
export type PoWSource = 'server'|'clientCPU'|'clientWebGL'|'best';

interface AppSettings {
  displayDenomination: string;
  walletStore: string;
  displayCurrency: string;
  lockOnClose: number;
  lockInactivityMinutes: number;
  powSource: PoWSource;
  serverName: string;
  serverAPI: string | null;
  serverNode: string | null;
  serverWS: string | null;
  language: string | null; // UI language, 2-char code; null means that default can prevail (e.g. by browser),
  qrIntegration: number; // 0: none, 1: account only, 2: vault URL
}

@Injectable()
export class AppSettingsService {
  storeKey = `mikron-vault-appsettings`;

  // Default settings
  defaultSettings: AppSettings = {
    displayDenomination: 'den-mik',
    walletStore: 'localStorage',
    displayCurrency: '',
    lockOnClose: 1,
    lockInactivityMinutes: 30,
    powSource: 'best',
    serverName: 'server-mikron',
    serverAPI: 'https://wallet.mikron.io/api/node-api',
    serverNode: null,
    serverWS: 'wss://wallet-wss.mikron.io/',
    language: null,
    qrIntegration: 2
  };

  qrIntegrations = [
    { value: 0, dict_key: 'confappc.display.qrint0' }, // none
    { value: 1, dict_key: 'confappc.display.qrint1' }, // account only
    { value: 2, dict_key: 'confappc.display.qrint2' }  // Vault URL
  ];

  // a deep copy clone of the default settings
  getDefaultSettings() : AppSettings {
    return JSON.parse(JSON.stringify(this.defaultSettings));
  }
  settings: AppSettings = this.getDefaultSettings(); // deep copy

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
    this.settings = this.getDefaultSettings(); // deep copy
  }

  // Get the base URL part of the serverAPI, e.g. https://wallet.mikron.io from https://wallet.mikron.io/api/node-api.
  getServerApiBaseUrl(): string {
    let u = url.parse(this.settings.serverAPI);
    u.pathname = '/';
    return url.format(u);
  }
}
