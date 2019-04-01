import { Component, OnInit } from '@angular/core';
import {WalletService} from "../../services/wallet.service";
import {NotificationService} from "../../services/notification.service";
import {LedgerService, LedgerStatus} from "../../services/ledger.service";

@Component({
  selector: 'app-wallet-widget',
  templateUrl: './wallet-widget.component.html',
  styleUrls: ['./wallet-widget.component.css']
})
export class WalletWidgetComponent implements OnInit {
  wallet = this.walletService.wallet;

  ledgerStatus = 'not-connected';

  unlockPassword = '';

  modal: any = null;

  constructor(
    public walletService: WalletService, 
    private notificationService: NotificationService, 
    public ledgerService: LedgerService
  ) { }

  ngOnInit() {
    const UIkit = (window as any).UIkit;
    const modal = UIkit.modal(document.getElementById('unlock-wallet-modal'));
    this.modal = modal;

    this.ledgerService.ledgerStatus$.subscribe((ledgerStatus: any) => {
      this.ledgerStatus = ledgerStatus.status;
    })
  }

  async lockWallet() {
    if (this.wallet.type === 'ledger') {
      return; // No need to lock a ledger wallet, no password saved
    }
    if (!this.wallet.password) {
      return this.notificationService.sendWarninRemove(`You must set a password on your wallet - it is currently blank!`);
    }
    const locked = await this.walletService.lockWallet();
    if (locked) {
      this.notificationService.sendSuccesRemove(`Wallet locked`);
    } else {
      this.notificationService.sendErrRemove(`Unable to lock wallet`);
    }
  }

  async reloadLedger() {
    this.notificationService.sendInfRemove(`Checking Ledger Status...`, { identifier: 'ledger-status', length: 0 })
    try {
      console.log(`Reloading ledger....`);
      const loaded = await this.ledgerService.loadLedger();
      console.log(`Got loaded response: `, loaded);
      this.notificationService.removeNotification('ledger-status');
      if (loaded) {
        this.notificationService.sendSuccesRemove(`Successfully connected to Ledger device`);
      } else if (loaded === false) {
        this.notificationService.sendErrRemove(`Unable to connect to Ledger device`);
      }
    } catch (err) {
      console.log(`Got error when loading ledger! `, err);
      this.notificationService.removeNotification('ledger-status');
      // this.notificationService.sendError(`Unable to load Ledger Device: ${err.message}`);
    }
  }

  async unlockWallet() {
    const unlocked = await this.walletService.unlockWallet(this.unlockPassword);
    this.unlockPassword = '';

    if (unlocked) {
      this.notificationService.sendSuccesRemove(`Wallet unlocked`);
      this.modal.hide();
    } else {
      this.notificationService.sendErrRemove(`Invalid password, please try again!`);
    }

    this.unlockPassword = '';
  }

}
