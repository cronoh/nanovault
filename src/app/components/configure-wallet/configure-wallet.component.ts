import { Component, OnInit } from '@angular/core';
import {WalletService} from "../../services/wallet.service";
import {NotificationService} from "../../services/notification.service";
import {ActivatedRoute, Router} from "@angular/router";
import * as bip from 'bip39';
import {LedgerService, LedgerStatus} from "../../services/ledger.service";

@Component({
  selector: 'app-configure-wallet',
  templateUrl: './configure-wallet.component.html',
  styleUrls: ['./configure-wallet.component.css']
})
export class ConfigureWalletComponent implements OnInit {
  wallet = this.walletService.wallet;
  activePanel = 0;

  newWalletSeed = '';
  newWalletMnemonic = '';
  importSeedModel = '';
  importSeedMnemonicModel = '';
  walletPasswordModel = '';
  walletPasswordConfirmModel = '';

  selectedImportOption = 'seed';
  importOptions = [
    { name: 'Mikron Seed', value: 'seed' },
    { name: 'Mikron Mnemonic Phrase', value: 'mnemonic' },
    { name: 'MikronWebWallet Wallet File', value: 'file' },
    // Ledger support removed, see https://github.com/mikroncoin/mikron-vault-web/issues/4
    //{ name: 'Ledger Nano S', value: 'ledger' },
  ];

  ledgerStatus = LedgerStatus;
  ledger = this.ledgerService.ledger;

  constructor(
    private router: ActivatedRoute,
    public walletService: WalletService,
    private notifications: NotificationService,
    private route: Router,
    private ledgerService: LedgerService
  ) { }

  async ngOnInit() {
    const toggleImport = this.router.snapshot.queryParams.import;
    if (toggleImport) {
      this.activePanel = 1;
    }

    this.ledgerService.loadLedger(true);
    this.ledgerService.ledgerStatus$.subscribe(newStatus => {
      // this.updateLedgerStatus();
    })
  }

  async importExistingWallet() {
    let importSeed = '';
    if (this.selectedImportOption === 'seed') {
      const existingSeed = this.importSeedModel.trim();
      if (existingSeed.length !== 64) return this.notifications.sendErrorKey('confwallc.error-seed-invalid');
      importSeed = existingSeed;
    } else if (this.selectedImportOption === 'mnemonic') {
      const mnemonic = this.importSeedMnemonicModel.toLowerCase().trim();
      const words = mnemonic.split(' ');
      if (words.length < 12) return this.notifications.sendErrorKey('confwallc.error-mnemonic-short');

      // Try and decode the mnemonic
      try {
        const newSeed = bip.mnemonicToEntropy(mnemonic);
        if (!newSeed || newSeed.length !== 64) return this.notifications.sendErrorKey('confwallc.error-mnemonic-invalid');
        importSeed = newSeed.toUpperCase(); // Force uppercase, for consistency
      } catch (err) {
        return this.notifications.sendErrorKey('confwallc.error-mnemonic-decode');
      }
    } else {
      return this.notifications.sendErrorKey('confwallc.error-invalid-import-option');
    }

    this.notifications.sendInfoKey('confwallc.info-importing', { identifier: 'importing-loading' });
    await this.walletService.createWalletFromSeed(importSeed);

    this.notifications.removeNotification('importing-loading');

    this.activePanel = 4;
    this.notifications.sendSuccessKey('confwallc.success-imported');
  }

  async importLedgerWallet(refreshOnly = false) {
    // what is our ledger status? show a warning?
    this.notifications.sendInfoKey('wallet-widget.info-checking-ledger', { identifier: 'ledger-status', length: 0 });
    await this.ledgerService.loadLedger(true);
    this.notifications.removeNotification('ledger-status');

    console.log(`Importing ledger device.....`);
    if (this.ledger.status === LedgerStatus.NOT_CONNECTED) {
      return this.notifications.sendWarningKey('ledger-service.warning-unable-to-connect');
    }

    if (this.ledger.status === LedgerStatus.LOCKED) {
      return this.notifications.sendWarningKey('ledger-service.warning-locked');
    }

    if (refreshOnly) {
      return;
    }

    console.log(`Import: creating ledger wallet`);
    const newWallet = await this.walletService.createLedgerWallet();

    // We skip the password panel
    this.activePanel = 5;
    this.notifications.sendSuccessKey('ledger-service.success');

  }

  async createNewWallet() {
    const newSeed = this.walletService.createNewWallet();
    this.newWalletSeed = newSeed;
    this.newWalletMnemonic = bip.entropyToMnemonic(newSeed);

    this.activePanel = 3;
    this.notifications.sendSuccessKey('confwallc.success-wallet-created');
  }

  confirmNewSeed() {
    this.newWalletSeed = '';

    this.activePanel = 4;
  }

  saveWalletPassword() {
    if (this.walletPasswordConfirmModel !== this.walletPasswordModel) {
      return this.notifications.sendErrorKey('confwallc.error-pwd-mismatch');
    }
    if (this.walletPasswordModel.length < 1) {
      return this.notifications.sendWarningKey('confwallc.warning-pwd-empty');
    }
    const newPassword = this.walletPasswordModel;
    this.walletService.wallet.password = newPassword;

    this.walletService.saveWalletExport();

    this.walletPasswordModel = '';
    this.walletPasswordConfirmModel = '';

    this.activePanel = 5;
    this.notifications.sendSuccessKey('confwallc.success-pwd-set');
  }

  setPanel(panel) {
    this.activePanel = panel;
  }

  copied() {
    this.notifications.sendSuccessKey('copy-success');
  }

  importFromFile(files) {
    if (!files.length) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target['result'];
      try {
        const importData = JSON.parse(fileData);
        if (!importData.seed || !importData.hasOwnProperty('accountsIndex')) {
          return this.notifications.sendErrorKey('confwallc.error-bad-import-data')
        }

        const walletEncrypted = btoa(JSON.stringify(importData));
        this.route.navigate(['import-wallet'], { fragment: walletEncrypted });
      } catch (err) {
        this.notifications.sendErrorKey('confwallc.error-import-parse');
      }
    };

    reader.readAsText(file);
  }

}
