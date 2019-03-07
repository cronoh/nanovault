import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

@Injectable()
export class PriceService {
  apiUrl = `https://api.coinmarketcap.com/v1/`;
  targetTicker = 'nano';

  price = {
    lastPrice: 1,
    lastPriceBTC: 0.001,
  };
  lastPrice$ = new BehaviorSubject(1);

  constructor(private http: HttpClient) { }

  async getPrice(currency = 'USD') {
    /*
    // Fiat currency conversion not supported currently
    if (!currency) return; // No currency defined, do not refetch
    const convertString = currency !== 'USD' && currency !== 'BTC' ? `?convert=${currency}` : ``;
    const response: any = await this.http.get(`${this.apiUrl}ticker/${this.targetTicker}/${convertString}`).toPromise();
    if (!response || !response.length) {
      return this.price.lastPrice;
    }

    const quote = response[0];
    const currencyPrice = quote[`price_${currency.toLowerCase()}`];
    const btcPrice = quote.price_btc;
    const usdPrice = quote.price_usd;

    this.price.lastPrice = currencyPrice;
    this.price.lastPriceBTC = btcPrice;

    this.lastPrice$.next(currencyPrice);

    return this.price.lastPrice;
    */
  }

}
