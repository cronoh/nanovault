import { Pipe, PipeTransform } from '@angular/core';
import {AppSettingsService} from "../services/app-settings.service";

@Pipe({
  name: 'rai'
})
export class RaiPipe implements PipeTransform {
  precision = 6;

  mrai = 10000000000;
  krai = 10000000;
  rai  = 10000;

  transform(value: any, args?: any): any {
    const opts = args.split(',');
    let denomination = opts[0] || 'mrai';
    const hideText = opts[1] || false;

    switch (denomination.toLowerCase()) {
      default:
      case 'xrb': return `${(value / this.mrai).toFixed(6)}${!hideText ? ' MIK': ''}`;
      case 'mnano':
        const hasRawValue = (value / this.rai) % 1;
        if (hasRawValue) {
          const newVal = value / this.mrai < 0.000001 ? 0 : value / this.mrai; // New more precise toFixed function, but bugs on huge raw numbers
          return `${this.toFixed(newVal, this.precision)}${!hideText ? ' MIK': ''}`;
        } else {
          return `${(value / this.mrai).toFixed(6)}${!hideText ? ' MIK': ''}`;
        }
      case 'knano': return `${(value / this.krai).toFixed(3)}${!hideText ? ' knano': ''}`;
      case 'nano': return `${(value / this.rai).toFixed(0)}${!hideText ? ' nano': ''}`;
      case 'raw': return `${value}${!hideText ? ' raw': ''}`;
      case 'dynamic':
        const rai = (value / this.rai);
        if (rai >= 1000000) {
          return `${(value / this.mrai).toFixed(this.precision)}${!hideText ? ' mRai': ''}`;
        } else if (rai >= 1000) {
          return `${(value / this.krai).toFixed(this.precision)}${!hideText ? ' kRai': ''}`;
        } else if (rai >= 0.00001) {
          return `${(value / this.rai).toFixed(this.precision)}${!hideText ? ' Rai': ''}`;
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
