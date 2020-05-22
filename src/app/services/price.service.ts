import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

@Injectable()
export class PriceService {
  apiUrl = `https://api.coinstats.app/public/v1/`;

  price = {
    lastPrice: 1,
    lastPriceBTC: 0.001,
  };
  lastPrice$ = new BehaviorSubject(1);

  constructor(private http: HttpClient) { }

  async getPrice(currency = 'USD') {
    if (!currency) return; // No currency defined, do not refetch
    const convertString = currency !== 'USD' && currency !== 'BTC' ? `?currency=${currency}` : ``;
    const response: any = await this.http.get(`${this.apiUrl}coins/nano${convertString}`).toPromise();
    if (!response || !response.length) {
      return this.price.lastPrice;
    }

    const quote = response[0];
    const currencyPrice = quote.price;
    const btcPrice = quote.priceBtc;

    this.price.lastPrice = currencyPrice;
    this.price.lastPriceBTC = btcPrice;

    this.lastPrice$.next(currencyPrice);

    return this.price.lastPrice;
  }

}
