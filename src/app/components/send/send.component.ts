import { Component, OnInit } from '@angular/core';
import BigNumber from "bignumber.js";
import {AddressBookService} from "../../services/address-book.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {WalletService} from "../../services/wallet.service";
import {NotificationService} from "../../services/notification.service";
import {ApiService} from "../../services/api.service";
import {UtilService} from "../../services/util.service";

import * as blake from 'blakejs';
import {WorkPoolService} from "../../services/work-pool.service";
import {AppSettingsService} from "../../services/app-settings.service";
import {ActivatedRoute, ActivatedRouteSnapshot} from "@angular/router";
import {PriceService} from "../../services/price.service";
import {NanoBlockService} from "../../services/nano-block.service";

const nacl = window['nacl'];

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.css']
})
export class SendComponent implements OnInit {
  unitMikron = 10000000000;
  unitKMikron = 10000000000000;

  activePanel = 'send';

  accounts = this.walletService.wallet.accounts;
  addressBookResults$ = new BehaviorSubject([]);
  showAddressBook = false;
  addressBookMatch = '';

  // Denominations for send
  denominations = [
    { name: 'Mikron', shortName: 'MIK', value: 'den-mik' },
    { name: 'Kilo Mikron', shortName: 'KMIK', value: 'den-kmik' },
    { name: 'Ant (raw)', shortName: 'Ant', value: 'den-ant' },
  ];
  selectedDenomination = this.denominations[0];

  amount = null;
  amountFiat: number|null = null;
  antAmount: BigNumber = new BigNumber(0);
  fromAccount: any = {};
  fromAccountID: any = '';
  fromAddressBook = '';
  toAccount: any = false;
  toAccountID: string = '';
  toAddressBook = '';
  toAccountStatus = null;
  confirmingTransaction: boolean = false;

  constructor(
    private router: ActivatedRoute,
    private walletService: WalletService,
    private addressBookService: AddressBookService,
    private notificationService: NotificationService,
    private nodeApi: ApiService,
    private nanoBlock: NanoBlockService,
    public price: PriceService,
    private workPool: WorkPoolService,
    public settings: AppSettingsService,
    private util: UtilService) { }

  async ngOnInit() {
    const params = this.router.snapshot.queryParams;
    if (params && params.amount) {
      this.amount = params.amount;
    }
    if (params && params.to) {
      this.toAccountID = params.to;
      this.validateDestination();
    }

    this.addressBookService.loadAddressBook();
    // Look for the first account that has a balance
    const accountIDWithBalance = this.accounts.reduce((previous, current) => {
      if (previous) return previous;
      if (current.balance.gt(0)) return current.id;
      return null;
    }, null);

    if (accountIDWithBalance) {
      this.fromAccountID = accountIDWithBalance;
    } else {
      this.fromAccountID = this.accounts.length ? this.accounts[0].id : '';
    }
  }

  // Invoked when the amount has changed, recompute ant and fiat
  updatedAmount () {
    this.antAmount = this.getAmountValueAsAnt();
    this.syncFiatPrice();
  }

  // Invoked when send denomination is changed, recomputes based on ant
  updatedDenom() {
    const newAmount = this.getAmountValueFromAnt(this.antAmount || new BigNumber(0));
    this.amount = newAmount;
  }

  // An update to the Nano amount, sync the fiat value
  syncFiatPrice() {
    if (this.antAmount.lte(0)) {
      this.amountFiat = 0;
      return;
    }

    // This is getting hacky, but if their currency is bitcoin, use 6 decimals, if it is not, use 2
    const precision = this.settings.settings.displayCurrency === 'BTC' ? 1000000 : 100;

    // Determine fiat value of the amount
    const fiatAmount = this.util.unit.antToMikron(this.antAmount).times(this.price.price.lastPrice).times(precision).floor().div(precision).toNumber();
    this.amountFiat = fiatAmount;
  }

  // An update to the fiat amount, sync the nano value based on currently selected denomination
  syncNanoPrice() {
    const fiatAmount = this.amountFiat || 0;
    this.antAmount = this.util.unit.mikronToAnt(new BigNumber(fiatAmount).div(this.price.price.lastPrice).toNumber());
    const newAmount = this.getAmountValueFromAnt(this.antAmount);
    this.amount = newAmount;
  }

  searchAddressBook() {
    this.showAddressBook = true;
    const search = this.toAccountID || '';
    const addressBook = this.addressBookService.addressBook;

    const matches = addressBook
      .filter(a => a.name.toLowerCase().indexOf(search.toLowerCase()) !== -1)
      .slice(0, 5);

    this.addressBookResults$.next(matches);
  }

  selectBookEntry(account) {
    this.showAddressBook = false;
    this.toAccountID = account;
    this.searchAddressBook();
    this.validateDestination();
  }

  async validateDestination() {
    // The timeout is used to solve a bug where the results get hidden too fast and the click is never registered
    setTimeout(() => this.showAddressBook = false, 400);

    // Remove spaces from the account id
    this.toAccountID = this.toAccountID.replace(/ /g, '');

    this.addressBookMatch = this.addressBookService.getAccountName(this.toAccountID);

    // const accountInfo = await this.walletService.walletApi.accountInfo(this.toAccountID);
    const accountInfo = await this.nodeApi.accountInfo(this.toAccountID);
    if (accountInfo.error) {
      if (accountInfo.error == 'Account not found') {
        this.toAccountStatus = 1;
      } else {
        this.toAccountStatus = 0;
      }
    }
    if (accountInfo && accountInfo.frontier) {
      this.toAccountStatus = 2;
    }
  }

  async sendTransaction() {
    const isValid = await this.nodeApi.validateAccountNumber(this.toAccountID);
    if (!isValid || isValid.valid == '0') return this.notificationService.sendWarning(`To account address is not valid`);
    if (!this.fromAccountID || !this.toAccountID) return this.notificationService.sendWarning(`From and to account are required`);

    const from = await this.nodeApi.accountInfo(this.fromAccountID);
    const to = await this.nodeApi.accountInfo(this.toAccountID);
    if (!from) return this.notificationService.sendError(`From account not found`);
    if (this.fromAccountID == this.toAccountID) return this.notificationService.sendWarning(`From and to account cannot be the same`);

    from.balanceBN = new BigNumber(from.balance || 0);
    to.balanceBN = new BigNumber(to.balance || 0);

    this.fromAccount = from;
    this.toAccount = to;

    this.antAmount = this.getAmountValueAsAnt();
    const mikronAmount = this.antAmount.div(this.unitMikron);

    if (this.amount < 0 || this.antAmount.lessThan(0)) return this.notificationService.sendWarning(`Amount is invalid`);
    if (mikronAmount.lessThan(0.0001)) return this.notificationService.sendWarning(`Send amount is too low.`);
    if (from.balanceBN.minus(this.antAmount).lessThan(0)) return this.notificationService.sendError(`From account does not have enough XRB`);

    // Determine fiat value of the amount
    this.amountFiat = this.util.unit.antToMikron(this.antAmount).times(this.price.price.lastPrice).toNumber();

    // Start precopmuting the work...
    this.fromAddressBook = this.addressBookService.getAccountName(this.fromAccountID);
    this.toAddressBook = this.addressBookService.getAccountName(this.toAccountID);
    this.workPool.addWorkToCache(this.fromAccount.frontier);

    this.activePanel = 'confirm';
  }

  async confirmTransaction() {
    const walletAccount = this.walletService.wallet.accounts.find(a => a.id == this.fromAccountID);
    if (!walletAccount) throw new Error(`Unable to find sending account in wallet`);
    if (this.walletService.walletIsLocked()) return this.notificationService.sendWarning(`Wallet must be unlocked`);

    this.confirmingTransaction = true;

    try {
      const newHash = await this.nanoBlock.generateSend(walletAccount, this.toAccountID, this.antAmount, this.walletService.isLedgerWallet());
      if (newHash) {
        this.notificationService.sendSuccess(`Successfully sent ${this.amount} ${this.selectedDenomination.shortName}!`);
        this.activePanel = 'send';
        this.amount = null;
        this.amountFiat = null;
        this.resetAmount();
        this.toAccountID = '';
        this.toAccountStatus = null;
        this.fromAddressBook = '';
        this.toAddressBook = '';
        this.addressBookMatch = '';
      } else {
        if (!this.walletService.isLedgerWallet()) {
          this.notificationService.sendError(`There was an error sending your transaction, please try again.`)
        }
      }
    } catch (err) {
      this.notificationService.sendError(`There was an error sending your transaction: ${err.message}`)
    }


    this.confirmingTransaction = false;

    await this.walletService.reloadBalances();
  }

  setMaxAmount() {
    const walletAccount = this.walletService.wallet.accounts.find(a => a.id === this.fromAccountID);
    if (!walletAccount) return;

    const antVal = new BigNumber(walletAccount.balance);
    const maxAmount = this.getAmountValueFromAnt(antVal);
    this.amount = maxAmount;
    this.updatedAmount();
  }

  resetAmount() {
    this.amount = 0;
    this.antAmount = new BigNumber(0);
  }

  getAmountValueAsAnt() : BigNumber {
    const amount : number = this.amount || 0;
    switch (this.selectedDenomination.value) {
      default:
      case 'den-mik': return this.util.unit.mikronToAnt(amount);
      case 'den-ant': return new BigNumber(amount);
      case 'den-kmik': return this.util.unit.kmikronToAnt(amount);
    }
  }

  getAmountValueFromAnt(value : BigNumber) : number {
    switch (this.selectedDenomination.value) {
      default:
      case 'den-mik': return this.util.unit.antToMikron(value).toNumber();
      case 'den-ant': return value.toNumber();
      case 'den-kmik': return this.util.unit.antToKMikron(value.toNumber()).toNumber();
    }
  }

}
