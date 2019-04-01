import { Component, OnInit } from '@angular/core';
import {WalletService} from "../../services/wallet.service";
import {NotificationService} from "../../services/notification.service";
import {ModalService} from "../../services/modal.service";
import {AppSettingsService} from "../../services/app-settings.service";
import {LedgerService, LedgerStatus} from "../../services/ledger.service";

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {
  accounts = this.walletService.wallet.accounts;
  isLedgerWallet = this.walletService.isLedgerWallet();
  viewAdvanced = false;
  newAccountIndex = null;

  constructor(
    private walletService: WalletService,
    private notificationService: NotificationService,
    public modal: ModalService,
    public settings: AppSettingsService,
    private ledger: LedgerService) { }

  async ngOnInit() {
  }

  async createAccount() {
    if (this.walletService.isLocked()) {
      return this.notificationService.sendErrRemove(`Wallet is locked.`);
    }
    if (!this.walletService.isConfigured()) return this.notificationService.sendErrRemove(`Wallet is not configured`);
    if (this.walletService.wallet.accounts.length >= 20) return this.notificationService.sendWarninRemove(`You can only track up to 20 accounts at a time.`);
    // Advanced view, manual account index?
    let accountIndex = null;
    if (this.viewAdvanced && this.newAccountIndex != null) {
      let index = parseInt(this.newAccountIndex);
      if (index < 0) return this.notificationService.sendWarninRemove(`Invalid account index - must be positive number`);
      const existingAccount = this.walletService.wallet.accounts.find(a => a.index == index);
      if (existingAccount) {
        return this.notificationService.sendWarninRemove(`The account at this index is already loaded`);
      }
      accountIndex = index;
    }
    try {
      const newAccount = await this.walletService.addWalletAccount(accountIndex);
      this.notificationService.sendSuccesRemove(`Successfully created new account ${newAccount.id}`);
      this.newAccountIndex = null;
    } catch (err) {
      this.notificationService.sendErrRemove(`Unable to add new account: ${err.message}`);
    }
  }

  sortAccounts() {
    if (this.walletService.isLocked()) {
      return this.notificationService.sendErrRemove(`Wallet is locked.`);
    }
    if (!this.walletService.isConfigured()) return this.notificationService.sendErrRemove(`Wallet is not configured`);
    if (this.walletService.wallet.accounts.length <= 1) return this.notificationService.sendWarninRemove(`You need at least 2 accounts to sort them`);
    this.walletService.wallet.accounts = this.walletService.wallet.accounts.sort((a, b) => a.index - b.index);
    // this.accounts = this.walletService.wallet.accounts;
    this.walletService.saveWalletExport(); // Save new sorted accounts list
    this.notificationService.sendSuccesRemove(`Successfully sorted accounts by index!`);
  }

  copied() {
    this.notificationService.sendSuccesRemove(`Successfully copied to clipboard!`);
  }

  async deleteAccount(account) {
    if (this.walletService.walletIsLocked()) {
      return this.notificationService.sendWarninRemove(`Wallet must be unlocked.`);
    }
    try {
      await this.walletService.removeWalletAccount(account.id);
      this.notificationService.sendSuccesRemove(`Successfully removed account ${account.id}`);
    } catch (err) {
      this.notificationService.sendErrRemove(`Unable to delete account: ${err.message}`);
    }
  }

  async showLedgerAddress(account) {
    if (this.ledger.ledger.status !== LedgerStatus.READY) {
      return this.notificationService.sendWarninRemove(`Ledger device must be ready`);
    }
    this.notificationService.sendInfRemove(`Confirming account address on Ledger device...`, { identifier: 'ledger-account', length: 0 });
    try {
      await this.ledger.getLedgerAccount(account.index, true);
      this.notificationService.sendSuccesRemove(`Account address confirmed on Ledger`);
    } catch (err) {
      this.notificationService.sendErrRemove(`Account address denied - if it is wrong do not use the wallet!`);
    }
    this.notificationService.removeNotification('ledger-account');
  }

}
