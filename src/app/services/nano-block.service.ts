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

const STATE_BLOCK_PREAMBLE = '0000000000000000000000000000000000000000000000000000000000000006';

@Injectable()
export class NanoBlockService {
  preconfiguredRepresentatives = [
    'xrb_3rw4un6ys57hrb39sy1qx8qy5wukst1iiponztrz9qiz6qqa55kxzx4491or', // NanoVault / cronoh
    'xrb_1ninja7rh37ehfp9utkor5ixmxyg8kme8fnzc4zty145ibch8kf5jwpnzr3r', // My Nano Ninja / BitDesert
    'xrb_1fnx59bqpx11s1yn7i5hba3ot5no4ypy971zbkp5wtium3yyafpwhhwkq8fc', // NiF
    'xrb_1i9ugg14c5sph67z4st9xk8xatz59xntofqpbagaihctg6ngog1f45mwoa54', // nanode21 / standreas
    'xrb_3rpixaxmgdws7nk7sx6owp8d8becj9ei5nef6qiwokgycsy9ufytjwgj6eg9', // repnode.org / sev
    'xrb_3uaydiszyup5zwdt93dahp7mri1cwa5ncg9t4657yyn3o4i1pe8sfjbimbas', // nano.voting / Bimbas
    'xrb_1f56swb9qtpy3yoxiscq9799nerek153w43yjc9atoaeg3e91cc9zfr89ehj', // dbachm123
    'xrb_33ad5app7jeo6jfe9ure6zsj8yg7knt6c1zrr5yg79ktfzk5ouhmpn6p5d7p', // warai
    'xrb_1x7biz69cem95oo7gxkrw6kzhfywq4x5dupw4z1bdzkb74dk9kpxwzjbdhhs', // NanoCrawler / meltingice
    'xrb_1iuz18n4g4wfp9gf7p1s8qkygxw7wx9qfjq6a9aq68uyrdnningdcjontgar', // NanoLinks.info / Joohansson
    'xrb_1e6e41up4x5e4jke6wy4k6nnuagagspfx4tjafghub6cw46ueimqt657nx4a', // nanoodle / arranHarty
    'xrb_1center16ci77qw5w69ww8sy4i4bfmgfhr81ydzpurm91cauj11jn6y3uc5y', // The Nano Center / Dotcom
    'xrb_34prihdxwz3u4ps8qjnn14p7ujyewkoxkwyxm3u665it8rg5rdqw84qrypzk', // nano-faucet.org / Srayman
    'xrb_3chartsi6ja8ay1qq9xg3xegqnbg1qx76nouw6jedyb8wx3r4wu94rxap7hg', // Nano Charts / frakilk
    'xrb_3o7uzba8b9e1wqu5ziwpruteyrs3scyqr761x7ke6w1xctohxfh5du75qgaj', // Nano TipBot / bbedward
    'xrb_17wmwpg65neuh8u84f99e6nxcf48znusb437efwaafta7rtpy4n9h6io79xj', // nanotipbot.com / mitche50
    'xrb_1kd4h9nqaxengni43xy9775gcag8ptw8ddjifnm77qes1efuoqikoqy5sjq3', // NanoQuake / jayycox
  ];

  constructor(
    private api: ApiService,
    private util: UtilService,
    private workPool: WorkPoolService,
    private notifications: NotificationService,
    private ledgerService: LedgerService,
    public settings: AppSettingsService) { }

  async generateChange(walletAccount, representativeAccount, ledger = false) {
    const toAcct = await this.api.accountInfo(walletAccount.id);
    if (!toAcct) throw new Error(`Account must have an open block first`);

    let blockData;
    const balance = new BigNumber(toAcct.balance);
    const balanceDecimal = balance.toString(10);
    let balancePadded = balance.toString(16);
    while (balancePadded.length < 32) balancePadded = '0' + balancePadded; // Left pad with 0's
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
      signature = this.signChangeBlock(walletAccount, toAcct, representativeAccount, balancePadded, link);
    }

    if (!this.workPool.workExists(toAcct.frontier)) {
      this.notifications.sendInfo(`Generating Proof of Work...`);
    }

    blockData = {
      type: 'state',
      account: walletAccount.id,
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

    const remaining = new BigNumber(fromAccount.balance).minus(rawAmount);
    const remainingDecimal = remaining.toString(10);
    let remainingPadded = remaining.toString(16);
    while (remainingPadded.length < 32) remainingPadded = '0' + remainingPadded; // Left pad with 0's

    let blockData;
    const representative = fromAccount.representative || (this.settings.settings.defaultRepresentative || this.getRandomRepresentative());

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
      signature = this.signSendBlock(walletAccount, fromAccount, representative, remainingPadded, toAccountID);
    }

    if (!this.workPool.workExists(fromAccount.frontier)) {
      this.notifications.sendInfo(`Generating Proof of Work...`);
    }

    blockData = {
      type: 'state',
      account: walletAccount.id,
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
    const toAcct = await this.api.accountInfo(walletAccount.id);
    let blockData: any = {};
    let workBlock = null;

    const openEquiv = !toAcct || !toAcct.frontier;

    const previousBlock = toAcct.frontier || "0000000000000000000000000000000000000000000000000000000000000000";
    const representative = toAcct.representative || (this.settings.settings.defaultRepresentative || this.getRandomRepresentative());

    const srcBlockInfo = await this.api.blocksInfo([sourceBlock]);
    const srcAmount = new BigNumber(srcBlockInfo.blocks[sourceBlock].amount);
    const newBalance = openEquiv ? srcAmount : new BigNumber(toAcct.balance).plus(srcAmount);
    const newBalanceDecimal = newBalance.toString(10);
    let newBalancePadded = newBalance.toString(16);
    while (newBalancePadded.length < 32) newBalancePadded = '0' + newBalancePadded; // Left pad with 0's

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
      signature = this.signOpenBlock(walletAccount, previousBlock, sourceBlock, newBalancePadded, representative);
    }

    workBlock = openEquiv ? this.util.account.getAccountPublicKey(walletAccount.id) : previousBlock;
    blockData = {
      type: 'state',
      account: walletAccount.id,
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

  signOpenBlock(walletAccount, previousBlock, sourceBlock, newBalancePadded, representative) {
    const context = blake.blake2bInit(32, null);
    blake.blake2bUpdate(context, this.util.hex.toUint8(STATE_BLOCK_PREAMBLE));
    blake.blake2bUpdate(context, this.util.hex.toUint8(this.util.account.getAccountPublicKey(walletAccount.id)));
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

  signSendBlock(walletAccount, fromAccount, representative, remainingPadded, toAccountID) {
    const context = blake.blake2bInit(32, null);
    blake.blake2bUpdate(context, this.util.hex.toUint8(STATE_BLOCK_PREAMBLE));
    blake.blake2bUpdate(context, this.util.hex.toUint8(this.util.account.getAccountPublicKey(walletAccount.id)));
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

  signChangeBlock(walletAccount, toAcct, representativeAccount, balancePadded, link) {
    let context = blake.blake2bInit(32, null);
    blake.blake2bUpdate(context, this.util.hex.toUint8(STATE_BLOCK_PREAMBLE));
    blake.blake2bUpdate(context, this.util.hex.toUint8(this.util.account.getAccountPublicKey(walletAccount.id)));
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
  
  getRandomRepresentative() {
    return this.preconfiguredRepresentatives[Math.floor(Math.random()*this.preconfiguredRepresentatives.length)];
  }

}
