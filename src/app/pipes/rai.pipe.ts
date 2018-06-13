import { Pipe, PipeTransform } from '@angular/core';
import {AppSettingsService} from "../services/app-settings.service";

@Pipe({
  name: 'rai'
})
export class RaiPipe implements PipeTransform {
  precision = 2;

  banano = 100000000000000000000000000000;
  banoshi = 1000000000000000000000000000;
  raw = 1;

  transform(value: any, args?: any): any {
    const opts = args.split(',');
    let denomination = opts[0] || 'banano';
    const hideText = opts[1] || false;

    switch (denomination.toLowerCase()) {
      default:

      case 'banano':
        const hasRawValue = (value / this.banoshi) % 1;
        if (hasRawValue) {
          const newVal = value / this.banano < 0.01 ? 0 : value / this.banano; // New more precise toFixed function, but bugs on huge raw numbers
          return `${this.toFixed(newVal, this.precision)}${!hideText ? ' BANANO': ''}`;
        } else {
          return `${(value / this.banano).toFixed(2)}${!hideText ? ' BANANO': ''}`;
        }
      case 'banoshi': return `${(value / this.banoshi).toFixed(0)}${!hideText ? ' banoshi': ''}`;

      case 'raw': return `${value}${!hideText ? ' raw': ''}`;
      case 'dynamic':
        const rai = (value / this.raw);
        if (rai >= 1000000) {
          return `${(value / this.banano).toFixed(this.precision)}${!hideText ? ' mRai': ''}`;
        } else if (rai >= 1000) {
          return `${(value / this.banoshi).toFixed(this.precision)}${!hideText ? ' kRai': ''}`;
        } else if (rai >= 0.00001) {
          return `${(value / this.raw).toFixed(this.precision)}${!hideText ? ' Rai': ''}`;
        } else if (rai === 0) {
          return `${value}${!hideText ? ' mRai': ''}`;
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
