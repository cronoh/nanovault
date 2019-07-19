import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

@Injectable()
export class PriceService {
  apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=banano&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false&vs_currencies=btc,usd`;

  price = {
    lastPrice: 0.00,
    lastPriceBTC: 0.00000000,
  };
  lastPrice$ = new BehaviorSubject(1);

  constructor(private http: HttpClient) { }

  async getPrice(currency = 'USD') {

    if (!currency) return; // No currency defined, do not refetch

    const convertString = currency !== 'USD' && currency !== 'BTC' ? `,${currency}` : ``;

    const response: any = await this.http.get(`${this.apiUrl}${convertString}`).toPromise();

    // if (!Response || !Response.length) {
    //   return this.price.lastPrice;
    // }

    const quote = response;

    const currencyPrice = quote.banano[currency.toLowerCase()];
    const usdPrice = quote.banano.usd;
    const btcPrice = quote.banano.btc;


    this.price.lastPrice = currencyPrice;
    this.price.lastPriceBTC = btcPrice;

    this.lastPrice$.next(currencyPrice);

    return this.price.lastPrice;
  }

}
