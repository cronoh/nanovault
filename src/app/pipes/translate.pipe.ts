import { Pipe, PipeTransform } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Pipe({
  name: 't',
  pure: false
})
export class TranslateTPipe extends TranslatePipe implements PipeTransform {

  // Translate, shorthand for translate
  transform(value: any, args?: any): any {
    return super.transform(value, args);
  }
}
