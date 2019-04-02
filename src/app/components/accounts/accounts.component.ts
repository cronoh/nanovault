import { Component, OnInit } from '@angular/core';
import {WalletService} from "../../services/wallet.service";
import {NotificationService} from "../../services/notification.service";
import {ModalService} from "../../services/modal.service";
import {AppSettingsService} from "../../services/app-settings.service";
import {LedgerService, LedgerStatus} from "../../services/ledger.service";
import {LanguageService} from "../../services/language.service";

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
    private ledger: LedgerService,
    private language: LanguageService
  ) { }

  async ngOnInit() {
  }

  async createAccount() {
    if (this.walletService.isLocked()) {
      return this.notificationService.sendErrorKey('wallet-widget.warning-wallet-locked');
    }
    if (!this.walletService.isConfigured()) return this.notificationService.sendErrorKey('confwallc.error-wallet-not-configured');
    if (this.walletService.wallet.accounts.length >= 20) return this.notificationService.sendWarningKey('accsc.warning-too-many-accounts');
    // Advanced view, manual account index?
    let accountIndex = null;
    if (this.viewAdvanced && this.newAccountIndex != null) {
      let index = parseInt(this.newAccountIndex);
      if (index < 0) return this.notificationService.sendWarningKey('accsc.warning-invalid-index');
      const existingAccount = this.walletService.wallet.accounts.find(a => a.index == index);
      if (existingAccount) {
        return this.notificationService.sendWarningKey('accsc.warning-index-already-loaded');
      }
      accountIndex = index;
    }
    try {
      const newAccount = await this.walletService.addWalletAccount(accountIndex);
      this.notificationService.sendSuccessTranslated(this.language.getTran('accsc.success-created-acc') + ` -- ${newAccount.id}`);
      this.newAccountIndex = null;
    } catch (err) {
      this.notificationService.sendErrorTranslated(this.language.getTran('accsc.error-could-not-add') + ` -- ${err.message}`);
    }
  }

  sortAccounts() {
    if (this.walletService.isLocked()) {
      return this.notificationService.sendErrorKey('wallet-widget.warning-wallet-locked');
    }
    if (!this.walletService.isConfigured()) return this.notificationService.sendErrorKey('confwallc.error-wallet-not-configured');
    if (this.walletService.wallet.accounts.length <= 1) return this.notificationService.sendWarningKey('accsc.warning-need-min-two-accs');
    this.walletService.wallet.accounts = this.walletService.wallet.accounts.sort((a, b) => a.index - b.index);
    // this.accounts = this.walletService.wallet.accounts;
    this.walletService.saveWalletExport(); // Save new sorted accounts list
    this.notificationService.sendSuccessKey('accsc.success-sorted');
  }

  copied() {
    this.notificationService.sendSuccessKey('copy-success');
  }

  async deleteAccount(account) {
    if (this.walletService.walletIsLocked()) {
      return this.notificationService.sendWarningKey('wallet-widget.warning-wallet-locked');
    }
    try {
      await this.walletService.removeWalletAccount(account.id);
      this.notificationService.sendSuccessTranslated(this.language.getTran('accsc.success-acc-removed') + ` -- ${account.id}`);
    } catch (err) {
      this.notificationService.sendErrorTranslated(this.language.getTran('accsc.error-could-not-delete-acc') + ` -- ${err.message}`);
    }
  }

  async showLedgerAddress(account) {
    if (this.ledger.ledger.status !== LedgerStatus.READY) {
      return this.notificationService.sendWarningKey('ledger-service.warning-unable-to-connect');
    }
    this.notificationService.sendInfoKey('accsc.ledger-confirming-account', { identifier: 'ledger-account', length: 0 });
    try {
      await this.ledger.getLedgerAccount(account.index, true);
      this.notificationService.sendSuccessKey('accsc.ledger-account-confirmed');
    } catch (err) {
      this.notificationService.sendErrorKey('accsc.ledger-error-account-denied');
    }
    this.notificationService.removeNotification('ledger-account');
  }

}
