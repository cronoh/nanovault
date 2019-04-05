import { Component, OnInit } from '@angular/core';
import {WalletService} from "../../services/wallet.service";
import {NotificationService} from "../../services/notification.service";
import * as QRCode from 'qrcode';
import {AddressBookService} from "../../services/address-book.service";
import {Router} from "@angular/router";
import * as bip from 'bip39';
import { LanguageService } from "../../services/language.service";

@Component({
  selector: 'app-manage-wallet',
  templateUrl: './manage-wallet.component.html',
  styleUrls: ['./manage-wallet.component.css']
})
export class ManageWalletComponent implements OnInit {

  wallet = this.walletService.wallet;

  newPassword = '';
  confirmPassword = '';

  showQRExport = false;
  QRExportUrl = '';
  QRExportImg = '';
  addressBookShowQRExport = false;
  addressBookQRExportUrl = '';
  addressBookQRExportImg = '';

  constructor(
    public walletService: WalletService,
    private addressBookService: AddressBookService,
    public notifications: NotificationService,
    private router: Router,
    private language: LanguageService
  ) { }

  async ngOnInit() {
    this.wallet = this.walletService.wallet;
  }

  async changePassword() {
    if (this.newPassword !== this.confirmPassword) return this.notifications.sendErrorKey('manwalc.error-password-mismatch');
    if (this.newPassword.length < 1) return this.notifications.sendErrorKey('manwalc.error-password-empty');
    if (this.walletService.walletIsLocked()) return this.notifications.sendWarningKey('wallet-widget.warning-wallet-locked');

    this.walletService.wallet.password = this.newPassword;
    this.walletService.saveWalletExport();

    this.newPassword = '';
    this.confirmPassword = '';
    this.notifications.sendSuccessKey('manwalc.success-pwd-chaged');
  }

  async exportWallet() {
    if (this.walletService.walletIsLocked()) return this.notifications.sendWarningKey('wallet-widget.warning-wallet-locked');

    const exportUrl = this.walletService.generateExportUrl();
    this.QRExportUrl = exportUrl;
    this.QRExportImg = await QRCode.toDataURL(exportUrl);
    this.showQRExport = true;
  }

  copied() {
    this.notifications.sendSuccessKey(`copy-success`);
  }

  seedMnemonic() {
    return bip.entropyToMnemonic(this.wallet.seed);
  }

  async exportAddressBook() {
    const exportData = this.addressBookService.addressBook;
    if (exportData.length >= 25) {
      return this.notifications.sendErrorKey('manwalc.error-too-many-entries');
    }
    const base64Data = btoa(JSON.stringify(exportData));
    const exportUrl = `https://wallet.mikron.io/import-address-book#${base64Data}`;  // TODO

    this.addressBookQRExportUrl = exportUrl;
    this.addressBookQRExportImg = await QRCode.toDataURL(exportUrl);
    this.addressBookShowQRExport = true;
  }

  exportAddressBookToFile() {
    if (this.walletService.walletIsLocked()) return this.notifications.sendWarningKey('wallet-widget.warning-wallet-locked');
    const fileName = `MikronWebWallet-AddressBook.json`;

    const exportData = this.addressBookService.addressBook;
    this.triggerFileDownload(fileName, exportData);

    this.notifications.sendSuccessKey('manwalc.success-addr-export-downloaded');
  }

  triggerFileDownload(fileName, exportData) {
    const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });

    // Check for iOS, which is weird with saving files
    const iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, fileName);
    } else {
      const elem = window.document.createElement('a');
      const objUrl = window.URL.createObjectURL(blob);
      if (iOS) {
        elem.href = `data:attachment/file,${JSON.stringify(exportData)}`;
      } else {
        elem.href = objUrl;
      }
      elem.download = fileName;
      document.body.appendChild(elem);
      elem.click();
      setTimeout(function(){
        document.body.removeChild(elem);
        window.URL.revokeObjectURL(objUrl);
      }, 200);
    }
  }

  exportToFile() {
    if (this.walletService.walletIsLocked()) return this.notifications.sendWarningKey('wallet-widget.warning-wallet-locked');

    const fileName = `MikronWebWallet-Wallet.json`;
    const exportData = this.walletService.generateExportData();
    this.triggerFileDownload(fileName, exportData);

    this.notifications.sendSuccessKey('manwalc.success-walet-export-downloaded');
  }

  importFromFile(files) {
    if (!files.length) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target['result'];
      try {
        const importData = JSON.parse(fileData);
        if (!importData.length || !importData[0].account) {
          return this.notifications.sendErrorKey('manwalc.error-import-data-bad')
        }

        const walletEncrypted = btoa(JSON.stringify(importData));
        this.router.navigate(['import-address-book'], { fragment: walletEncrypted });
      } catch (err) {
        this.notifications.sendErrorKey('manwalc.error-import-data-parse');
      }
    };

    reader.readAsText(file);
  }

  notifyCopySuccess() {
    this.notifications.sendSuccessKey('copy-success');
  }

}
