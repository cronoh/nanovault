import { Pipe, PipeTransform } from '@angular/core';
import {AppSettingsService} from "../services/app-settings.service";

@Pipe({
  name: 'rai'
})
export class RaiPipe implements PipeTransform {
  precision = 6;

  unitMikron = 10000000000;
  unitKMikron = 10000000000000;

  transform(value: any, args?: any): any {
    const opts = args.split(',');
    let denomination = opts[0] || 'den-mik';
    const hideText = opts[1] || false;

    switch (denomination.toLowerCase()) {
      default:
      case 'den-mik': // default floating point, with variable number of digits
        const mik = value / this.unitMikron;
        const fracStrLen = ((value % this.unitMikron) / this.unitMikron).toString().length;
        let fracDigits = fracStrLen - 2;
        fracDigits = Math.max(0, Math.min(10, fracDigits));
        return `${mik.toFixed(fracDigits)}${!hideText ? ' MIK': ''}`;
      case 'den-mik-short': // fixed-point format with 2 digits
        return `${(value / this.unitMikron).toFixed(2)}${!hideText ? ' MIK': ''}`;
      case 'den-mik-long': // fixed-point format with 10 digits
        return `${(value / this.unitMikron).toFixed(10)}${!hideText ? ' MIK': ''}`;
      case 'den-kmik':
        const kmik = value / this.unitKMikron;
        return `${kmik.toString()}${!hideText ? ' KMIK': ''}`;
      case 'den-ant': return `${value.toString()}${!hideText ? ' Ant': ''}`;
    }
  }

  toFixed(num, fixed) {
    if (isNaN(num)) return 0;
    var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
  }

}
