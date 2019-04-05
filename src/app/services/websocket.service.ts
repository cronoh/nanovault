import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {AppSettingsService} from "./app-settings.service";

@Injectable()
export class WebsocketService {

  queuedCommands = [];

  keepaliveTimeout = 60 * 1000;
  reconnectTimeout = 5 * 1000;

  keepaliveSet = false;

  socket = {
    connected: false,
    ws: null,
  };

  subscribedAccounts = [];

  newTransactions$ = new BehaviorSubject(null);

  constructor(private appSettings: AppSettingsService) { }

  forceReconnect() {
    if (this.socket.connected && this.socket.ws) {
      // Override the onclose event so it doesnt try to reconnect the old instance
      this.socket.ws.onclose = event => {
      };
      this.socket.ws.close();
      delete this.socket.ws;
      this.socket.connected = false;
    }

    setTimeout(() => this.connect(), 250);
  }

  connect() {
    if (this.socket.connected && this.socket.ws) return;
    delete this.socket.ws; // Maybe this will erase old connections

    const wsUrl = this.appSettings.settings.serverWS || 'wss://wallet-wss.mikron.io';
    const ws = new WebSocket(wsUrl);
    this.socket.ws = ws;

    ws.onopen = event => {
      this.socket.connected = true;
      this.queuedCommands.forEach(event => ws.send(JSON.stringify(event)));

      // Resubscribe to accounts?
      if (this.subscribedAccounts.length) {
        this.subscribeAccounts(this.subscribedAccounts);
      }

      if (!this.keepaliveSet) {
        this.keepalive(); // Start keepalives!
      }
    };
    ws.onerror = event => {
      // this.socket.connected = false;
      console.log(`Socket error`, event);
    };
    ws.onclose = event => {
      this.socket.connected = false;
      console.log(`Socket close`, event);

      // Start attempting to recconect
      setTimeout(() => this.attemptReconnect(), this.reconnectTimeout);
    };
    ws.onmessage = event => {
      try {
        const newEvent = JSON.parse(event.data);

        if (newEvent.event === 'newTransaction') {
          this.newTransactions$.next(newEvent.data);
        }
      } catch (err) {
        console.log(`Error parsing message`, err);
      }
    }
  }

  attemptReconnect() {
    this.connect();
    if (this.reconnectTimeout < 30 * 1000) {
      this.reconnectTimeout += 5 * 1000; // Slowly increase the timeout up to 30 seconds
    }
  }

  keepalive() {
    this.keepaliveSet = true;
    if (this.socket.connected) {
      this.socket.ws.send(JSON.stringify({ event: 'keepalive' }));
    }

    setTimeout(() => {
      this.keepalive();
    }, this.keepaliveTimeout);
  }



  subscribeAccounts(accountIDs: string[]) {
    const event = { event: 'subscribe', data: accountIDs };
    accountIDs.forEach(account => {
      if (this.subscribedAccounts.indexOf(account) === -1) {
        this.subscribedAccounts.push(account); // Keep a unique list of subscriptions for reconnecting
      }
    });
    if (!this.socket.connected) {
      this.queuedCommands.push(event);
      if (this.queuedCommands.length >= 3) {
        this.queuedCommands.shift(); // Prune queued commands
      }
      return;
    }
    this.socket.ws.send(JSON.stringify(event));
  }

  unsubscribeAccounts(accountIDs: string[]) {
    const event = { event: 'unsubscribe', data: accountIDs };
    accountIDs.forEach(account => {
      const existingIndex = this.subscribedAccounts.indexOf(account);
      if (existingIndex !== -1) {
        this.subscribedAccounts.splice(existingIndex, 1); // Remove from our internal subscription list
      }
    });
    // If we aren't connected, we don't need to do anything.  On reconnect, it won't subscribe.
    if (this.socket.connected) {
      this.socket.ws.send(JSON.stringify(event));
    }
  }

}
