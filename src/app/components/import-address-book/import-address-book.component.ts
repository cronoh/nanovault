import { Component, OnInit } from '@angular/core';
import {NotificationService} from "../../services/notification.service";
import {ActivatedRoute} from "@angular/router";
import {AddressBookService} from "../../services/address-book.service";

@Component({
  selector: 'app-import-address-book',
  templateUrl: './import-address-book.component.html',
  styleUrls: ['./import-address-book.component.css']
})
export class ImportAddressBookComponent implements OnInit {
  activePanel = 'error';

  validImportData = false;
  importData: any = null;

  conflictingEntries = 0;
  newEntries = 0;
  existingEntries = 0;

  constructor(private route: ActivatedRoute, private notifications: NotificationService, private addressBook: AddressBookService) { }

  ngOnInit() {
    const importData = this.route.snapshot.fragment;
    if (!importData || !importData.length) return this.importDataError('impaddrc.error-no-data');

    const decodedData = atob(importData);

    try {
      const importBlob = JSON.parse(decodedData);
      if (!importBlob || !importBlob.length) return this.importDataError('impaddrc.error-bad-data');
      this.validImportData = true;
      this.importData = importBlob;
      this.activePanel = 'import';

      // Now, find conflicting accounts
      for (let entry of importBlob) {
        if (!entry.account || !entry.name) continue; // Data missing?
        entry.originalName = this.addressBook.getAccountName(entry.account);
        if (!entry.originalName) {
          this.newEntries++;
        } else if (entry.originalName === entry.name) {
          this.existingEntries++;
        } else {
          this.conflictingEntries++;
        }
      }

    } catch (err) {
      return this.importDataError('impaddrc.error-unable-to-decode');
    }
  }

  async confirmImport() {
    // Go through our address book and see which ones need to be saved
    let importedCount = 0;
    for (let entry of this.importData) {
      if (!entry.originalName) {
        await this.addressBook.saveAddress(entry.account, entry.name);
        importedCount++;
      } else if (entry.originalName && entry.originalName !== entry.name) {
        await this.addressBook.saveAddress(entry.account, entry.name);
        importedCount++;
      }
    }

    this.notifications.sendSuccessTranslated('impaddrc.success-imported' + ` (${importedCount})`);
    this.activePanel = 'imported';
  }

  importDataError(messageKey) {
    this.activePanel = 'error';
    return this.notifications.sendErrorKey(messageKey);
  }

}
