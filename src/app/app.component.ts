import {Component, HostListener, OnInit} from '@angular/core';
import {WalletService} from "./services/wallet.service";
import {AddressBookService} from "./services/address-book.service";
import {AppSettingsService} from "./services/app-settings.service";
import {WebsocketService} from "./services/websocket.service";
import {PriceService} from "./services/price.service";
import {NotificationService} from "./services/notification.service";
import {PowService} from "./services/pow.service";
import {WorkPoolService} from "./services/work-pool.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @HostListener('window:resize', ['$event']) onResize (e) {
    this.windowHeight = e.target.innerHeight;
  };
  wallet = this.walletService.wallet;
  nanoPrice = this.price.price;
  fiatTimeout = 5 * 60 * 1000; // Update fiat prices every 5 minutes
  inactiveSeconds = 0;
  windowHeight = 1000;

  constructor(
    private walletService: WalletService,
    private addressBook: AddressBookService,
    public settings: AppSettingsService,
    private websocket: WebsocketService,
    private notifications: NotificationService,
    private pow: PowService,
    private workPool: WorkPoolService,
    public price: PriceService) { }

  async ngOnInit() {
    this.windowHeight = window.innerHeight;
    this.settings.loadAppSettings();
    this.addressBook.loadAddressBook();
    this.workPool.loadWorkCache();
    await this.walletService.loadStoredWallet();
    this.websocket.connect();

    await this.updateFiatPrices();

    // If the wallet is locked and there is a pending balance, show a warning to unlock the wallet
    if (this.wallet.locked && this.wallet.pending.gt(0)) {
      this.notifications.sendWarning(`New incoming transaction - unlock the wallet to receive it!`, { length: 0, identifier: 'pending-locked' });
    }

    // When the page closes, determine if we should lock the wallet
    window.addEventListener("beforeunload",  (e) => {
      if (this.wallet.locked) return; // Already locked, nothing to worry about
      if (this.settings.settings.lockOnClose == 1) {
        this.walletService.lockWallet();
      }
    });
    window.addEventListener("unload",  (e) => {
      if (this.wallet.locked) return; // Already locked, nothing to worry about
      if (this.settings.settings.lockOnClose == 1) {
        this.walletService.lockWallet();
      }
    });

    // Check how long the wallet has been inactive, and lock it if it's been too long
    setInterval(() => {
      this.inactiveSeconds += 1;
      if (!this.settings.settings.lockInactivityMinutes) return; // Do not lock on inactivity
      if (this.wallet.locked || !this.wallet.password) return;

      // Determine if we have been inactive for longer than our lock setting
      if (this.inactiveSeconds >= this.settings.settings.lockInactivityMinutes * 60) {
        this.walletService.lockWallet();
        this.notifications.sendSuccess(`Wallet locked after ${this.settings.settings.lockInactivityMinutes} minutes of inactivity`);
      }
    }, 1000);
  }

  updateIdleTime() {
    this.inactiveSeconds = 0; // Action has happened, reset the inactivity timer
  }

  async updateFiatPrices() {
    const displayCurrency = this.settings.getAppSetting(`displayCurrency`) || 'USD';
    await this.price.getPrice(displayCurrency);
    this.walletService.reloadFiatBalances();
    setTimeout(() => this.updateFiatPrices(), this.fiatTimeout);
  }
}
