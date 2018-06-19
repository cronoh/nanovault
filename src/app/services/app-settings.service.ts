import { Injectable } from '@angular/core';
import set = Reflect.set;

export type WalletStore = 'localStorage'|'none';
export type PoWSource = 'server'|'clientCPU'|'clientWebGL'|'best';

interface AppSettings {
  displayDenomination: string;
  walletStore: string;
  displayCurrency: string;
  lockOnClose: number;
  lockInactivityMinutes: number;
  powSource: PoWSource;
  useStateBlocks: boolean;
}

@Injectable()
export class AppSettingsService {
  storeKey = `bananovault-appsettings`;

  settings: AppSettings = {
    displayDenomination: 'banano',
    walletStore: 'localStorage',
    displayCurrency: '',
    lockOnClose: 0,
    lockInactivityMinutes: 120,
    powSource: 'best',
    useStateBlocks: true,
  };

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
    this.settings = {
      displayDenomination: 'banano',
      walletStore: 'localStorage',
      displayCurrency: '',
      lockOnClose: 0,
      lockInactivityMinutes: 120,
      powSource: 'best',
      useStateBlocks: true,
    };
  }

}
