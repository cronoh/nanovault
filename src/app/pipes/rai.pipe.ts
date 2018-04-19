import { Pipe, PipeTransform } from '@angular/core';
import {AppSettingsService} from "../services/app-settings.service";

@Pipe({
  name: 'rai'
})
export class RaiPipe implements PipeTransform {
  precision = 2;

  ban = 100000000000000000000000000000;
  banoshi = 1000000000000000000000000000;
  rai  = 1000000000000000000000000;

  transform(value: any, args?: any): any {
    const opts = args.split(',');
    let denomination = opts[0] || 'ban';
    const hideText = opts[1] || false;

    switch (denomination.toLowerCase()) {
      default:
      case 'ban': return `${(value / this.ban).toFixed(2)}${!hideText ? ' BANANO': ''}`;
      case 'ban':
        const hasRawValue = (value / this.rai) % 1;
        if (hasRawValue) {
          const newVal = value / this.ban < 0.000001 ? 0 : value / this.ban; // New more precise toFixed function, but bugs on huge raw numbers
          return `${this.toFixed(newVal, this.precision)}${!hideText ? ' BANANO': ''}`;
        } else {
          return `${(value / this.ban).toFixed(2)}${!hideText ? ' BANANO': ''}`;
        }
      case 'banoshi': return `${(value / this.banoshi).toFixed(3)}${!hideText ? ' banoshi': ''}`;
      case 'nano': return `${(value / this.rai).toFixed(0)}${!hideText ? ' nano': ''}`;
      case 'raw': return `${value}${!hideText ? ' raw': ''}`;
      case 'dynamic':
        const rai = (value / this.rai);
        if (rai >= 1000000) {
          return `${(value / this.ban).toFixed(this.precision)}${!hideText ? ' BANANO': ''}`;
        } else if (rai >= 1000) {
          return `${(value / this.banoshi).toFixed(this.precision)}${!hideText ? ' banoshi': ''}`;
        } else if (rai >= 0.00001) {
          return `${(value / this.rai).toFixed(this.precision)}${!hideText ? ' Rai': ''}`;
        } else if (rai === 0) {
          return `${value}${!hideText ? ' BANANO': ''}`;
        } else {
          return `${value}${!hideText ? ' raw': ''}`;
        }
    }
  }

  toFixed(num, fixed) {
    if (isNaN(num)) return 0;
    var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
  }

}
