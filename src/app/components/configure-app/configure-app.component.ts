import { Component, OnInit } from '@angular/core';
import {WalletService} from "../../services/wallet.service";
import {NotificationService} from "../../services/notification.service";
import {AppSettingsService} from "../../services/app-settings.service";
import {PriceService} from "../../services/price.service";
import {PowService} from "../../services/pow.service";
import {WorkPoolService} from "../../services/work-pool.service";
import {AddressBookService} from "../../services/address-book.service";
import {ApiService} from "../../services/api.service";
import {LedgerService, LedgerStatus} from "../../services/ledger.service";
import BigNumber from "bignumber.js";
import {WebsocketService} from "../../services/websocket.service";

@Component({
  selector: 'app-configure-app',
  templateUrl: './configure-app.component.html',
  styleUrls: ['./configure-app.component.css']
})
export class ConfigureAppComponent implements OnInit {
  wallet = this.walletService.wallet;

  denominations = [
    { name: 'MIK', value: 'mnano' },
    { name: 'knano (0.001 Mnano)', value: 'knano' },
    { name: 'nano (0.000001 Mnano)', value: 'nano' },
  ];
  selectedDenomination = this.denominations[0].value;

  storageOptions = [
    { name: 'Browser Local Storage', value: 'localStorage' },
    { name: 'None', value: 'none' },
  ];
  selectedStorage = this.storageOptions[0].value;

  currencies = [
    { name: 'None', value: '' },
    { name: 'USD - US Dollar', value: 'USD' },
    { name: 'BTC - Bitcoin', value: 'BTC' },
    { name: 'AUD - Australian Dollar', value: 'AUD' },
    { name: 'BRL - Brazilian Real', value: 'BRL' },
    { name: 'CAD - Canadian Dollar', value: 'CAD' },
    { name: 'CHF - Swiss Franc', value: 'CHF' },
    { name: 'CLP - Chilean Peso', value: 'CLP' },
    { name: 'CNY - Chinese Yuan', value: 'CNY' },
    { name: 'CZK - Czech Koruna', value: 'CZK' },
    { name: 'DKK - Danish Krown', value: 'DKK' },
    { name: 'EUR - Euro', value: 'EUR' },
    { name: 'GBP - British Pound', value: 'GBP' },
    { name: 'HKD - Hong Kong Dollar', value: 'HKD' },
    { name: 'HUF - Hungarian Forint', value: 'HUF' },
    { name: 'IDR - Indonesian Rupiah', value: 'IDR' },
    { name: 'ILS - Israeli New Shekel', value: 'ILS' },
    { name: 'INR - Indian Rupee', value: 'INR' },
    { name: 'JPY - Japanese Yen', value: 'JPY' },
    { name: 'KRW - South Korean Won', value: 'KRW' },
    { name: 'MXN - Mexican Peso', value: 'MXN' },
    { name: 'MYR - Malaysian Ringgit', value: 'MYR' },
    { name: 'NOK - Norwegian Krone', value: 'NOK' },
    { name: 'NZD - New Zealand Dollar', value: 'NZD' },
    { name: 'PHP - Philippine Piso', value: 'PHP' },
    { name: 'PKR - Pakistani Rupee', value: 'PKR' },
    { name: 'PLN - Polish Zloty', value: 'PLN' },
    { name: 'RUB - Russian Ruble', value: 'RUB' },
    { name: 'SEK - Swedish Krona', value: 'SEK' },
    { name: 'SGD - Singapore Dollar', value: 'SGD' },
    { name: 'THB - Thai Baht', value: 'THB' },
    { name: 'TRY - Turkish Lira', value: 'TRY' },
    { name: 'TWD - New Taiwan Dollar', value: 'TWD' },
    { name: 'ZAR - South African Rand', value: 'ZAR' },
  ];
  selectedCurrency = this.currencies[0].value;

  inactivityOptions = [
    { name: 'Never', value: 0 },
    { name: '1 Minute', value: 1 },
    { name: '5 Minutes', value: 5 },
    { name: '15 Minutes', value: 15 },
    { name: '30 Minutes', value: 30 },
    { name: '1 Hour', value: 60 },
    { name: '6 Hours', value: 360 },
  ];
  selectedInactivityMinutes = this.inactivityOptions[4].value;

  powOptions = [
    { name: 'Best Option Available', value: 'best' },
    { name: 'Client Side - WebGL (Chrome/Firefox)', value: 'clientWebGL' },
    { name: 'Client Side - CPU', value: 'clientCPU' },
    { name: 'Server - NanoVault Server', value: 'server' },
  ];
  selectedPoWOption = this.powOptions[0].value;

  serverOptions = [
    {
      name: 'Mikron Default',
      value: 'server-mikron',
      isCustom: false,
      serverAPI: 'https://wallet.mikron.io/api/node-api',
      serverNode: '',
      serverWS: 'wss://ws.nanovault.io/',
    },
    {
      name: 'MikronLiveTest1',
      value: 'server-test1',
      isCustom: false,
      serverAPI: 'http://server3.mikron.io:9950/api/node-api',
      serverNode: '',
      serverWS: 'ws://server3.mikron.io:3333/',
    },
    {
      name: 'Custom',
      value: 'server-custom',
      isCustom: true,
      serverAPI: 'https://wallet.mikron.io/api/node-api',
      serverNode: 'http://localhost:7043',
      serverWS: 'wss://ws.nanovault.io/',
    },
  ];
  selectedServer = this.serverOptions[0].value;

  serverAPI = null;
  serverNode = null;
  serverWS = null;

  showServerConfigs = () => this.selectedServer === 'server-custom';

  constructor(
    private walletService: WalletService,
    private notifications: NotificationService,
    private appSettings: AppSettingsService,
    private addressBook: AddressBookService,
    private pow: PowService,
    private api: ApiService,
    private ledgerService: LedgerService,
    private websocket: WebsocketService,
    private workPool: WorkPoolService,
    private price: PriceService) { }

  async ngOnInit() {
    this.loadFromSettings();
  }

  loadFromSettings() {
    const settings = this.appSettings.settings;

    const matchingCurrency = this.currencies.find(d => d.value === settings.displayCurrency);
    this.selectedCurrency = matchingCurrency.value || this.currencies[0].value;

    const matchingDenomination = this.denominations.find(d => d.value == settings.displayDenomination);
    this.selectedDenomination = matchingDenomination.value || this.denominations[0].value;

    const matchingStorage = this.storageOptions.find(d => d.value == settings.walletStore);
    this.selectedStorage = matchingStorage.value || this.storageOptions[0].value;

    const matchingInactivityMinutes = this.inactivityOptions.find(d => d.value == settings.lockInactivityMinutes);
    this.selectedInactivityMinutes = matchingInactivityMinutes ? matchingInactivityMinutes.value : this.inactivityOptions[4].value;

    const matchingPowOption = this.powOptions.find(d => d.value === settings.powSource);
    this.selectedPoWOption = matchingPowOption ? matchingPowOption.value : this.powOptions[0].value;

    this.selectedServer = settings.serverName;
    this.loadServerSettingFromSettings();
  }

  loadServerSettingFromSettings() {
    const matchingServerOptionAny = this.serverOptions.find(d => d.value === this.selectedServer);
    const matchingServerOption = matchingServerOptionAny ? matchingServerOptionAny : this.serverOptions[0];
    this.selectedServer = matchingServerOption.value;
    if (!matchingServerOption.isCustom) {
      this.serverAPI = matchingServerOption.serverAPI;
      this.serverNode = matchingServerOption.serverNode;
      this.serverWS = matchingServerOption.serverWS;
    } else {
      this.serverAPI = this.appSettings.settings.serverAPI;
      this.serverNode = this.appSettings.settings.serverNode;
      this.serverWS = this.appSettings.settings.serverWS;
    }
  }
  
  async selectedServerChanged() {
    const matchingServerOptionAny = this.serverOptions.find(d => d.value === this.selectedServer);
    const matchingServerOption = matchingServerOptionAny ? matchingServerOptionAny : this.serverOptions[0];
    this.selectedServer = matchingServerOption.value;
    if (!matchingServerOption.isCustom) {
      this.serverAPI = matchingServerOption.serverAPI;
      this.serverNode = matchingServerOption.serverNode;
      this.serverWS = matchingServerOption.serverWS;
    } else {
      // custom, leave it
    }
  }

  async updateDisplaySettings() {
    let newCurrency = this.selectedCurrency;
    if (newCurrency !== '') {
      // Currency not supported currently
      newCurrency = '';
      this.notifications.sendWarning('Fiat currency conversion is not supported currently!');
    }
    const reloadFiat = this.appSettings.settings.displayCurrency !== newCurrency;
    this.appSettings.setAppSetting('displayDenomination', this.selectedDenomination);
    this.notifications.sendSuccess(`App display settings successfully updated!`);

    if (reloadFiat) {
      // Reload prices with our currency, then call to reload fiat balances.
      await this.price.getPrice(newCurrency);
      this.appSettings.setAppSetting('displayCurrency', newCurrency);
      this.walletService.reloadFiatBalances();
    }

  }

  async updateWalletSettings() {
    const newStorage = this.selectedStorage;
    let newPoW = this.selectedPoWOption;

    const resaveWallet = this.appSettings.settings.walletStore !== newStorage;

    if (this.appSettings.settings.powSource !== newPoW) {
      if (newPoW === 'clientWebGL' && !this.pow.hasWebGLSupport()) {
        this.notifications.sendWarning(`WebGL support not available, set PoW to Best`);
        newPoW = 'best';
      }
      if (newPoW === 'clientCPU' && !this.pow.hasWorkerSupport()) {
        this.notifications.sendWarning(`CPU Worker support not available, set PoW to Best`);
        newPoW = 'best';
      }
    }

    const newSettings = {
      walletStore: newStorage,
      lockInactivityMinutes: new Number(this.selectedInactivityMinutes),
      powSource: newPoW,
    };

    this.appSettings.setAppSettings(newSettings);
    this.notifications.sendSuccess(`App wallet settings successfully updated!`);

    if (resaveWallet) {
      this.walletService.saveWalletExport(); // If swapping the storage engine, resave the wallet
    }
  }

  async updateServerSettings() {
    let matchingServerOption = this.serverOptions.find(d => d.value === this.selectedServer);
    matchingServerOption = matchingServerOption ? matchingServerOption : this.serverOptions[0];
    if (!matchingServerOption.isCustom) {
      const newSettings = {
        serverName: matchingServerOption.value,
        serverAPI: matchingServerOption.serverAPI,
        serverNode: matchingServerOption.serverNode,
        serverWS: matchingServerOption.serverWS,
      };
      this.appSettings.setAppSettings(newSettings);
    } else {
      // custom setting
      const newSettings = {
        serverName: matchingServerOption.value,
        serverAPI: null,
        serverNode: null,
        serverWS: null,
      };

      // Custom... do some basic validation
      if (this.serverAPI != null && this.serverAPI.trim().length > 1) {
        if (this.serverAPI.startsWith('https://') || this.serverAPI.startsWith('http://')) {
          newSettings.serverAPI = this.serverAPI;
        } else {
          return this.notifications.sendWarning(`Custom API Server has an invalid address.  Make sure to use the full address ie: https://wallet.mikron.io/api/node-api`);
        }
      }

      if (this.serverNode != null && this.serverNode.trim().length > 1) {
        if (this.serverNode.startsWith('https://') || this.serverNode.startsWith('http://')) {
          newSettings.serverNode = this.serverNode;
        } else {
          return this.notifications.sendWarning(`Custom Node Server has an invalid address.  Make sure to use the full address ie: http://127.0.0.1:7076`);
        }
      }

      if (this.serverWS != null && this.serverWS.trim().length > 1) {
        if (this.serverWS.startsWith('wss://') || this.serverWS.startsWith('ws://')) {
          newSettings.serverWS = this.serverWS;
        } else {
          return this.notifications.sendWarning(`Custom Update Server has an invalid address.  Make sure to use the full address ie: wss://ws.nanovault.io/`);
        }
      }

      this.appSettings.setAppSettings(newSettings);
    }

    this.notifications.sendSuccess(`Server settings successfully updated, refreshing balances`);

    // Reload some things to show new statuses?
    await this.walletService.reloadBalances();
    this.websocket.forceReconnect();

  }

  serverAPIStatus = 0;
  serverNodeStatus = 0;
  serverWSStatus = 0;
  validateServerAPI() {
    if (this.serverAPI != null) {
      if (this.serverAPI.startsWith('https://') || this.serverAPI.startsWith('http://')) {
        this.serverAPIStatus = 1;
      } else {
        this.serverAPIStatus = -1;
      }
    } else {
      this.serverAPIStatus = 0;
    }
  }

  async clearWorkCache() {
    const UIkit = window['UIkit'];
    try {
      await UIkit.modal.confirm('<p style="text-align: center;">You are about to delete all locally cached Proof of Work values<br><br><b>Are you sure?</b></p>');
      this.workPool.clearCache();
      this.notifications.sendSuccess(`Successfully cleared the work cache!`);
    } catch (err) {}
  }

  async clearWalletData() {
    const UIkit = window['UIkit'];
    try {
      await UIkit.modal.confirm('<p style="text-align: center;">You are about to delete all of your wallet data stored in NanoVault!<br><b>Make sure you have your seed backed up!!</b><br><br><b>Are you sure?</b></p>');
      this.walletService.resetWallet();
      this.walletService.removeWalletData();

      this.notifications.sendSuccess(`Successfully deleted all wallet data!`);
    } catch (err) {}
  }

  async clearAllData() {
    const UIkit = window['UIkit'];
    try {
      await UIkit.modal.confirm('<p style="text-align: center;">You are about to delete ALL of your data stored in NanoVault.<br>This includes all of your wallet data, your address book, and your application settings!<br><br><b>Make sure you have your seed backed up!!</b><br><br><b>Are you sure?</b></p>');
      this.walletService.resetWallet();
      this.walletService.removeWalletData();

      this.workPool.deleteCache();
      this.addressBook.clearAddressBook();
      this.appSettings.clearAppSettings();

      this.loadFromSettings();

      this.notifications.sendSuccess(`Successfully deleted ALL locally stored data!`);
    } catch (err) {}
  }
}
