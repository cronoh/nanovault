import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, ActivatedRouteSnapshot} from "@angular/router";
import {NotificationService} from "../../services/notification.service";
import * as CryptoJS from "crypto-js";
import * as blake from "blakejs";
import {WalletService, WalletType, warpPromise} from "../../services/wallet.service";

@Component({
  selector: 'app-import-wallet',
  templateUrl: './import-wallet.component.html',
  styleUrls: ['./import-wallet.component.css']
})
export class ImportWalletComponent implements OnInit {
  activePanel = 'error';

  walletPassword = '';
  walletSalt = '';
  validImportData = false;
  importData: any = null;
  isWarpWallet = false;
  warpInProgress = false;
  warpProgress = {
    total: 0,
    scrypt: 0,
    pbkdf2: 0
  };

  constructor(private route: ActivatedRoute, private notifications: NotificationService, private wallet: WalletService) { }

  ngOnInit() {
    const importData = this.route.snapshot.fragment;
    if (!importData || !importData.length) return this.importDataError(`No import data found.  Check your link and try again.`);

    const decodedData = atob(importData);

    try {
      const importBlob = JSON.parse(decodedData);
      if (!importBlob || importBlob.type === undefined) return this.importDataError(`Bad import data.  Check your link and try again.`);
      this.validImportData = true;
      this.importData = importBlob;
      this.isWarpWallet = importBlob.type === WalletType.Warp;
      this.activePanel = 'import';
    } catch (err) {
      return this.importDataError(`Unable to decode import data.  Check your link and try again.`);
    }
  }

  importDataError(message) {
    this.activePanel = 'error';
    return this.notifications.sendError(message);
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

  async decryptWallet() {
    // Attempt to decrypt the seed value using the password
    try {
      let decryptedSeed: string;
      switch (this.importData.type) {
        case WalletType.Normal:
          const decryptedBytes = CryptoJS.AES.decrypt(this.importData.seed, this.walletPassword);
          decryptedSeed = decryptedBytes.toString(CryptoJS.enc.Utf8);
          break;
        case WalletType.Warp:
          this.warpInProgress = true;
          const params = {
            passphrase: this.walletPassword.trim(),
            salt: this.walletSalt.trim(),
            progress_hook: this.updateWarpProgress.bind(this)
          };
          const warpRes = await warpPromise(params);
          decryptedSeed = warpRes.seed;
          this.warpInProgress = false;
          break;
      }
      if (!decryptedSeed || decryptedSeed.length !== 64) {
        this.walletPassword = '';
        return this.notifications.sendError(`Invalid password, please try again.`);
      }
      const newSeedChecksum = this.wallet.calculateSeedChecksum(decryptedSeed);
      if (newSeedChecksum !== this.importData.cs) {
        this.walletPassword = '';
        this.walletSalt = '';
        return this.notifications.sendError(`Invalid password, please try again (decrypted seed checksum did not match)`)
      }

      await this.wallet.loadImportedWallet(decryptedSeed, this.walletPassword, this.importData.accountsIndex || 0);
      this.activePanel = 'imported';

    } catch (err) {
      this.walletPassword = '';
      return this.notifications.sendError(`Invalid password, please try again`);
    }
  }

}
