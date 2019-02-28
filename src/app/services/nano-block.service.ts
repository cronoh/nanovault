import { Injectable } from '@angular/core';
import {ApiService} from "./api.service";
import {UtilService} from "./util.service";
import * as blake from 'blakejs';
import {WorkPoolService} from "./work-pool.service";
import BigNumber from "bignumber.js";
import {NotificationService} from "./notification.service";
import {AppSettingsService} from "./app-settings.service";
import {WalletService} from "./wallet.service";
import {LedgerService} from "./ledger.service";
const nacl = window['nacl'];

const STATE_BLOCK_PREAMBLE = '0000000000000000000000000000000000000000000000000000000000000006';  // state block type
const EPOCH_0 = 1535760000; // Epoch 0, origin for block times, Sept 1 2018

@Injectable()
export class NanoBlockService {
  representativeAccount = 'mik_317ntk3fs3666tuzrdsx755rruhw935apyquan95uc18po55i1s53sew45tb'; // Default Mikron Representative

  constructor(
    private api: ApiService,
    private util: UtilService,
    private workPool: WorkPoolService,
    private notifications: NotificationService,
    private ledgerService: LedgerService,
    public settings: AppSettingsService) { }

  // Return the current time as a creation time for a new block (as decimal int)
  getCreationTimeNow() {
    const nowMs = new Date().getTime();
    return Math.floor(nowMs/1000 - EPOCH_0);
  }

  async generateChange(walletAccount, representativeAccount, ledger = false) {
    const toAcct = await this.api.accountInfo(walletAccount.id);
    if (!toAcct) throw new Error(`Account must have an open block first`);

    const creationTimeDec = this.getCreationTimeNow();
    let creationTimeHex = this.padStringLeft(creationTimeDec.toString(16), 8, '0');
    let blockData;
    const balance = new BigNumber(toAcct.balance);
    const balanceDecimal = balance.toString(10);
    let balancePadded = this.padStringLeft(balance.toString(16), 16, '0');
    let link = '0000000000000000000000000000000000000000000000000000000000000000';

    let signature = null;
    if (ledger) {
      const ledgerBlock = {
        previousBlock: toAcct.frontier,
        representative: representativeAccount,
        balance: balanceDecimal,
      };
      try {
        this.sendLedgerNotification();
        await this.ledgerService.updateCache(walletAccount.index, toAcct.frontier);
        const sig = await this.ledgerService.signBlock(walletAccount.index, ledgerBlock);
        this.clearLedgerNotification();
        signature = sig.signature;
      } catch (err) {
        this.clearLedgerNotification();
        this.sendLedgerDeniedNotification();
        return;
      }
    } else {
      signature = this.signChangeBlock(walletAccount, creationTimeHex, toAcct, representativeAccount, balancePadded, link);
    }

    if (!this.workPool.workExists(toAcct.frontier)) {
      this.notifications.sendInfo(`Generating Proof of Work...`);
    }

    blockData = {
      type: 'state',
      account: walletAccount.id,
      creation_time: creationTimeDec,
      previous: toAcct.frontier,
      representative: representativeAccount,
      balance: balanceDecimal,
      link: link,
      signature: signature,
      work: await this.workPool.getWork(toAcct.frontier),
    };

    const processResponse = await this.api.process(blockData);
    if (processResponse && processResponse.hash) {
      walletAccount.frontier = processResponse.hash;
      this.workPool.addWorkToCache(processResponse.hash); // Add new hash into the work pool
      this.workPool.removeFromCache(toAcct.frontier);
      return processResponse.hash;
    } else {
      return null;
    }
  }

  async generateSend(walletAccount, toAccountID, rawAmount, ledger = false) {
    const fromAccount = await this.api.accountInfo(walletAccount.id);
    if (!fromAccount) throw new Error(`Unable to get account information for ${walletAccount.id}`);

    const creationTimeDec = this.getCreationTimeNow();
    let creationTimeHex = this.padStringLeft(creationTimeDec.toString(16), 8, '0');
    const remaining = new BigNumber(fromAccount.balance).minus(rawAmount);
    const remainingDecimal = remaining.toString(10);
    let remainingPadded = this.padStringLeft(remaining.toString(16), 16, '0');

    let blockData;
    const representative = fromAccount.representative || this.representativeAccount;

    let signature = null;
    if (ledger) {
      const ledgerBlock = {
        previousBlock: fromAccount.frontier,
        representative: representative,
        balance: remainingDecimal,
        recipient: toAccountID,
      };
      try {
        this.sendLedgerNotification();
        await this.ledgerService.updateCache(walletAccount.index, fromAccount.frontier);
        const sig = await this.ledgerService.signBlock(walletAccount.index, ledgerBlock);
        this.clearLedgerNotification();
        signature = sig.signature;
      } catch (err) {
        this.clearLedgerNotification();
        this.sendLedgerDeniedNotification(err);
        return;
      }
    } else {
      signature = this.signSendBlock(walletAccount, creationTimeHex, fromAccount, representative, remainingPadded, toAccountID);
    }

    if (!this.workPool.workExists(fromAccount.frontier)) {
      this.notifications.sendInfo(`Generating Proof of Work...`);
    }

    blockData = {
      type: 'state',
      account: walletAccount.id,
      creation_time: creationTimeDec,
      previous: fromAccount.frontier,
      representative: representative,
      balance: remainingDecimal,
      link: this.util.account.getAccountPublicKey(toAccountID),
      work: await this.workPool.getWork(fromAccount.frontier),
      signature: signature,
    };

    const processResponse = await this.api.process(blockData);
    if (!processResponse || !processResponse.hash) throw new Error(processResponse.error || `Node returned an error`);

    walletAccount.frontier = processResponse.hash;
    this.workPool.addWorkToCache(processResponse.hash); // Add new hash into the work pool
    this.workPool.removeFromCache(fromAccount.frontier);

    return processResponse.hash;
  }

  async generateReceive(walletAccount, sourceBlock, ledger = false) {
    const creationTimeDec = this.getCreationTimeNow();
    let creationTimeHex = this.padStringLeft(creationTimeDec.toString(16), 8, '0');
    const toAcct = await this.api.accountInfo(walletAccount.id);
    let blockData: any = {};
    let workBlock = null;

    const openEquiv = !toAcct || !toAcct.frontier;

    const previousBlock = toAcct.frontier || "0000000000000000000000000000000000000000000000000000000000000000";
    const representative = toAcct.representative || this.representativeAccount;

    const srcBlockInfo = await this.api.blocksInfo([sourceBlock]);
    const srcAmount = new BigNumber(srcBlockInfo.blocks[sourceBlock].amount);
    const newBalance = openEquiv ? srcAmount : new BigNumber(toAcct.balance).plus(srcAmount);
    const newBalanceDecimal = newBalance.toString(10);
    //console.log('generateReceive ' + newBalanceDecimal);
    let newBalancePadded = this.padStringLeft(newBalance.toString(16), 16, '0');

    // We have everything we need, we need to obtain a signature
    let signature = null;
    if (ledger) {
      const ledgerBlock: any = {
        representative: representative,
        balance: newBalanceDecimal,
        sourceBlock: sourceBlock,
      };
      if (!openEquiv) {
        ledgerBlock.previousBlock = toAcct.frontier;
      }
      try {
        this.sendLedgerNotification();
        // On new accounts, we do not need to cache anything
        if (!openEquiv) {
          await this.ledgerService.updateCache(walletAccount.index, toAcct.frontier);
        }
        const sig = await this.ledgerService.signBlock(walletAccount.index, ledgerBlock);
        this.notifications.removeNotification('ledger-sign');
        signature = sig.signature.toUpperCase();
      } catch (err) {
        this.notifications.removeNotification('ledger-sign');
        this.notifications.sendWarning(err.message || `Transaction denied on Ledger device`);
        return;
      }
    } else {
      signature = this.signOpenBlock(walletAccount, creationTimeHex, previousBlock, sourceBlock, newBalancePadded, representative);
    }

    workBlock = openEquiv ? this.util.account.getAccountPublicKey(walletAccount.id) : previousBlock;
    blockData = {
      type: 'state',
      account: walletAccount.id,
      creation_time: creationTimeDec,
      previous: previousBlock,
      representative: representative,
      balance: newBalanceDecimal,
      link: sourceBlock,
      signature: signature,
      work: null
    };

    if (!this.workPool.workExists(workBlock)) {
      this.notifications.sendInfo(`Generating Proof of Work...`);
    }

    blockData.work = await this.workPool.getWork(workBlock);
    const processResponse = await this.api.process(blockData);
    if (processResponse && processResponse.hash) {
      walletAccount.frontier = processResponse.hash;
      this.workPool.addWorkToCache(processResponse.hash); // Add new hash into the work pool
      this.workPool.removeFromCache(workBlock);
      return processResponse.hash;
    } else {
      return null;
    }
  }

  signOpenBlock(walletAccount, creationTime, previousBlock, sourceBlock, newBalancePadded, representative) {
    const context = blake.blake2bInit(32, null);
    blake.blake2bUpdate(context, this.util.hex.toUint8(STATE_BLOCK_PREAMBLE));
    blake.blake2bUpdate(context, this.util.hex.toUint8(this.util.account.getAccountPublicKey(walletAccount.id)));
    blake.blake2bUpdate(context, this.util.hex.toUint8(creationTime));
    blake.blake2bUpdate(context, this.util.hex.toUint8(previousBlock));
    blake.blake2bUpdate(context, this.util.hex.toUint8(this.util.account.getAccountPublicKey(representative)));
    blake.blake2bUpdate(context, this.util.hex.toUint8(newBalancePadded));
    blake.blake2bUpdate(context, this.util.hex.toUint8(sourceBlock));
    const hashBytes = blake.blake2bFinal(context);

    const privKey = walletAccount.keyPair.secretKey;
    const signed = nacl.sign.detached(hashBytes, privKey);
    const signature = this.util.hex.fromUint8(signed);

    return signature;
  }

  signSendBlock(walletAccount, creationTime, fromAccount, representative, remainingPadded, toAccountID) {
    const context = blake.blake2bInit(32, null);
    blake.blake2bUpdate(context, this.util.hex.toUint8(STATE_BLOCK_PREAMBLE));
    blake.blake2bUpdate(context, this.util.hex.toUint8(this.util.account.getAccountPublicKey(walletAccount.id)));
    blake.blake2bUpdate(context, this.util.hex.toUint8(creationTime));
    blake.blake2bUpdate(context, this.util.hex.toUint8(fromAccount.frontier));
    blake.blake2bUpdate(context, this.util.hex.toUint8(this.util.account.getAccountPublicKey(representative)));
    blake.blake2bUpdate(context, this.util.hex.toUint8(remainingPadded));
    blake.blake2bUpdate(context, this.util.hex.toUint8(this.util.account.getAccountPublicKey(toAccountID)));
    const hashBytes = blake.blake2bFinal(context);

    // Sign the hash bytes with the account priv key bytes
    const signed = nacl.sign.detached(hashBytes, walletAccount.keyPair.secretKey);
    const signature = this.util.hex.fromUint8(signed);

    return signature;
  }

  signChangeBlock(walletAccount, creationTime, toAcct, representativeAccount, balancePadded, link) {
    let context = blake.blake2bInit(32, null);
    blake.blake2bUpdate(context, this.util.hex.toUint8(STATE_BLOCK_PREAMBLE));
    blake.blake2bUpdate(context, this.util.hex.toUint8(this.util.account.getAccountPublicKey(walletAccount.id)));
    blake.blake2bUpdate(context, this.util.hex.toUint8(creationTime));
    blake.blake2bUpdate(context, this.util.hex.toUint8(toAcct.frontier));
    blake.blake2bUpdate(context, this.util.hex.toUint8(this.util.account.getAccountPublicKey(representativeAccount)));
    blake.blake2bUpdate(context, this.util.hex.toUint8(balancePadded));
    blake.blake2bUpdate(context, this.util.hex.toUint8(link));
    const hashBytes = blake.blake2bFinal(context);

    const privKey = walletAccount.keyPair.secretKey;
    const signed = nacl.sign.detached(hashBytes, privKey);
    const signature = this.util.hex.fromUint8(signed);

    return signature;
  }

  sendLedgerDeniedNotification(err = null) {
    this.notifications.sendWarning(err && err.message || `Transaction denied on Ledger device`);
  }
  sendLedgerNotification() {
    this.notifications.sendInfo(`Waiting for confirmation on Ledger Device...`, { identifier: 'ledger-sign', length: 0 });
  }
  clearLedgerNotification() {
    this.notifications.removeNotification('ledger-sign');
  }

  // Left-pad string
  padStringLeft(string, len, padChar) {
    let padded = string;
    while (padded.length < len) padded = padChar + padded;
    return padded;
  }
}
