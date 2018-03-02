import { Component, OnInit } from '@angular/core';
import {WalletService} from "../../services/wallet.service";
import {NotificationService} from "../../services/notification.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-configure-wallet',
  templateUrl: './configure-wallet.component.html',
  styleUrls: ['./configure-wallet.component.css']
})
export class ConfigureWalletComponent implements OnInit {
  wallet = this.walletService.wallet;
  activePanel = 0;
  showMoreWarp = false;

  newWalletSeed = '';
  importSeedModel = '';
  walletPasswordModel = '';
  walletPasswordConfirmModel = '';
  warpPassword = '';
  warpSalt = '';
  warpInProgress = false;
  warpProgress = {
    total: 0,
    scrypt: 0,
    pbkdf2: 0
  };

  constructor(private router: ActivatedRoute, private walletService: WalletService, private notifications: NotificationService, private route: Router) { }

  toggleShowMoreWarp() {
    this.showMoreWarp = !this.showMoreWarp;
  }

  async ngOnInit() {
    // Allow a seed import via URL.  (Insecure, not recommended)
    const importSeed = this.router.snapshot.fragment;
    if (importSeed && importSeed.length > 1) {
      if (importSeed.length !== 64) return this.notifications.sendError(`Import seed is invalid, double check it!`);

      this.walletService.createWalletFromSeed(importSeed);
      this.activePanel = 4;
      this.notifications.sendSuccess(`Successfully imported wallet seed!`);
    }

    const toggleImport = this.router.snapshot.queryParams.import;
    const toggleWarp = this.router.snapshot.queryParams.warp;
    if (toggleImport) {
      this.activePanel = 1;
    }
    if (toggleWarp) {
      this.activePanel = 2;
    }
  }

  async importExistingWallet() {
    const existingSeed = this.importSeedModel.trim();
    if (existingSeed.length !== 64) return this.notifications.sendError(`Seed is invalid, double check it!`);

    this.walletService.createWalletFromSeed(existingSeed);
    this.activePanel = 4;

    this.notifications.sendSuccess(`Successfully imported existing wallet!`);
  }

  async importWarpWallet() {
    this.notifications.sendInfo(`Starting WarpWallet import...`)
    this.warpInProgress = true;
    this.newWalletSeed = await this.walletService.createWalletFromWarp(this.warpPassword.trim(), this.warpSalt.trim(), this.updateWarpProgress.bind(this));
    this.activePanel = 5;

    this.notifications.sendSuccess(`Successfully imported WarpWallet!`);
  }

  updateWarpProgress(progress: {what: string, i: number, total: number}) {
    switch (progress.what) {
      case 'scrypt':
        this.warpProgress.scrypt = progress.i / progress.total;
        break;
      case 'pbkdf2':
        this.warpProgress.pbkdf2 = progress.i / progress.total;
        break;
    }
    this.warpProgress.total = this.warpProgress.scrypt * 80 + this.warpProgress.pbkdf2 * 20;
  }

  async createNewWallet() {
    const newSeed = this.walletService.createNewWallet();
    this.newWalletSeed = newSeed;

    this.activePanel = 3;
    this.notifications.sendSuccess(`Successfully created new wallet! Make sure to write down your seed!`);
  }

  confirmNewSeed() {
    this.newWalletSeed = '';

    this.activePanel = 4;
  }

  confirmWarpSeed() {
    this.newWalletSeed = '';
    this.walletService.saveWalletExport();
    this.warpPassword = '';
    this.warpSalt = '';
    this.warpInProgress = false;
    this.warpProgress = null;

    this.activePanel = 6;
  }

  saveWalletPassword() {
    if (this.walletPasswordConfirmModel !== this.walletPasswordModel) {
      return this.notifications.sendError(`Password confirmation does not match, try again!`);
    }
    if (this.walletPasswordModel.length < 1) {
      return this.notifications.sendWarning(`Password cannot be empty!`);
    }
    const newPassword = this.walletPasswordModel;
    this.walletService.wallet.password = newPassword;

    this.walletService.saveWalletExport();

    this.walletPasswordModel = '';
    this.walletPasswordConfirmModel = '';

    this.activePanel = 6;
    this.notifications.sendSuccess(`Successfully set wallet password!`);
  }

  setPanel(panel) {
    this.activePanel = panel;
  }

  copied() {
    this.notifications.sendSuccess(`Wallet seed copied to clipboard!`);
  }

  importFromFile(files) {
    if (!files.length) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target['result'];
      try {
        const importData = JSON.parse(fileData);
        if (!importData.seed || !importData.accountsIndex) {
          return this.notifications.sendError(`Bad import data `)
        }

        const walletEncrypted = btoa(JSON.stringify(importData));
        this.route.navigate(['import-wallet'], { fragment: walletEncrypted });
      } catch (err) {
        this.notifications.sendError(`Unable to parse import data, make sure you selected the right file!`);
      }
    };

    reader.readAsText(file);
  }





}
