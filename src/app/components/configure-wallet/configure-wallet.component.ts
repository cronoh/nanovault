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
      if (existingSeed.length !== 64) return this.notifications.sendErrNotifTodo(`Seed is invalid, double check it!`);
      importSeed = existingSeed;
    } else if (this.selectedImportOption === 'mnemonic') {
      const mnemonic = this.importSeedMnemonicModel.toLowerCase().trim();
      const words = mnemonic.split(' ');
      if (words.length < 12) return this.notifications.sendErrNotifTodo(`Mnemonic is too short, double check it!`);

      // Try and decode the mnemonic
      try {
        const newSeed = bip.mnemonicToEntropy(mnemonic);
        if (!newSeed || newSeed.length !== 64) return this.notifications.sendErrNotifTodo(`Mnemonic is invalid, double check it!`);
        importSeed = newSeed.toUpperCase(); // Force uppercase, for consistency
      } catch (err) {
        return this.notifications.sendErrNotifTodo(`Unable to decode mnemonic, double check it!`);
      }
    } else {
      return this.notifications.sendErrNotifTodo(`Invalid import option`);
    }

    this.notifications.sendInfNotifTodo(`Importing existing accounts...`, { identifier: 'importing-loading' });
    await this.walletService.createWalletFromSeed(importSeed);

    this.notifications.removeNotification('importing-loading');

    this.activePanel = 4;
    this.notifications.sendSuccesNotifTodo(`Successfully imported wallet!`);
  }

  async importLedgerWallet(refreshOnly = false) {
    // what is our ledger status? show a warning?
    this.notifications.sendInfNotifTodo(`Checking for Ledger device...`, { identifier: 'ledger-status', length: 0 });
    await this.ledgerService.loadLedger(true);
    this.notifications.removeNotification('ledger-status');

    console.log(`Importing ledger device.....`);
    if (this.ledger.status === LedgerStatus.NOT_CONNECTED) {
      return this.notifications.sendWarninNotifTodo(`No ledger device detected, make sure it is connected and you are using Chrome/Opera`);
    }

    if (this.ledger.status === LedgerStatus.LOCKED) {
      return this.notifications.sendWarninNotifTodo(`Unlock your ledger device and open the Nano app to continue`);
    }

    if (refreshOnly) {
      return;
    }

    console.log(`Import: creating ledger wallet`);
    const newWallet = await this.walletService.createLedgerWallet();

    // We skip the password panel
    this.activePanel = 5;
    this.notifications.sendSuccesNotifTodo(`Successfully loaded ledger device!`);

  }

  async createNewWallet() {
    const newSeed = this.walletService.createNewWallet();
    this.newWalletSeed = newSeed;
    this.newWalletMnemonic = bip.entropyToMnemonic(newSeed);

    this.activePanel = 3;
    this.notifications.sendSuccesNotifTodo(`Successfully created new wallet! Make sure to write down your seed!`);
  }

  confirmNewSeed() {
    this.newWalletSeed = '';

    this.activePanel = 4;
  }

  saveWalletPassword() {
    if (this.walletPasswordConfirmModel !== this.walletPasswordModel) {
      return this.notifications.sendErrNotifTodo(`Password confirmation does not match, try again!`);
    }
    if (this.walletPasswordModel.length < 1) {
      return this.notifications.sendWarninNotifTodo(`Password cannot be empty!`);
    }
    const newPassword = this.walletPasswordModel;
    this.walletService.wallet.password = newPassword;

    this.walletService.saveWalletExport();

    this.walletPasswordModel = '';
    this.walletPasswordConfirmModel = '';

    this.activePanel = 5;
    this.notifications.sendSuccesNotifTodo(`Successfully set wallet password!`);
  }

  setPanel(panel) {
    this.activePanel = panel;
  }

  copied() {
    this.notifications.sendSuccesNotifTodo(`Wallet seed copied to clipboard!`);
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
          return this.notifications.sendErrNotifTodo(`Bad import data `)
        }

        const walletEncrypted = btoa(JSON.stringify(importData));
        this.route.navigate(['import-wallet'], { fragment: walletEncrypted });
      } catch (err) {
        this.notifications.sendErrNotifTodo(`Unable to parse import data, make sure you selected the right file!`);
      }
    };

    reader.readAsText(file);
  }

}
