import { Injectable } from '@angular/core';
import {NotificationService} from "./notification.service";

@Injectable()
export class NodeService {

  node = {
    status: null, // null - loading, false - offline, true - online
  };

  constructor(private notifications: NotificationService) { }

  setOffline() {
    if (this.node.status === false) return; // Already offline
    this.node.status = false;

<<<<<<< HEAD
    this.notifications.sendError(`Unable to connect to the Banano node, your balances may be inaccurate!`, { identifier: 'node-offline', length: 0 });
=======
    this.notifications.sendError(`Unable to connect to the Nano node, your balances may be inaccurate!`, { identifier: 'node-offline', length: 0 });
>>>>>>> 338597e99ae8ca659e49a2ed96fa7c6f1e4baf38
  }

  setOnline() {
    if (this.node.status) return; // Already online

    this.node.status = true;
    this.notifications.removeNotification('node-offline');
  }

}
