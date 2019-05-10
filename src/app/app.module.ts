import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import {HttpClientModule, HttpClient} from "@angular/common/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {WelcomeComponent} from "./welcome/welcome.component";
import {AppRoutingModule} from "./app-routing.module";
import {UtilService} from "./services/util.service";
import {WalletService} from "./services/wallet.service";
import {ConfigureWalletComponent} from "./components/configure-wallet/configure-wallet.component";
import {NotificationService} from "./services/notification.service";
import {NotificationsComponent} from "./components/notifications/notifications.component";
import {RaiPipe} from "./pipes/rai.pipe";
import {AccountsComponent} from "./components/accounts/accounts.component";
import {ApiService} from "./services/api.service";
import {AddressBookService} from "./services/address-book.service";
import {SendComponent} from "./components/send/send.component";
import {SqueezePipe} from "./pipes/squeeze.pipe";
import {ModalService} from "./services/modal.service";
import {AddressBookComponent} from "./components/address-book/address-book.component";
import {ClipboardModule} from "ngx-clipboard";
import {ReceiveComponent} from "./components/receive/receive.component";
import {WalletWidgetComponent} from "./components/wallet-widget/wallet-widget.component";
import {ManageWalletComponent} from "./components/manage-wallet/manage-wallet.component";
import {WorkPoolService} from "./services/work-pool.service";
import {ConfigureAppComponent} from "./components/configure-app/configure-app.component";
import {AppSettingsService} from "./services/app-settings.service";
import {WebsocketService} from "./services/websocket.service";
import {BlockService} from "./services/block.service";
import { AccountDetailsComponent } from './components/account-details/account-details.component';
import { TransactionDetailsComponent } from './components/transaction-details/transaction-details.component';
import {PriceService} from "./services/price.service";
import { FiatPipe } from './pipes/fiat.pipe';
import { ImportWalletComponent } from './components/import-wallet/import-wallet.component';
import { MikronAccountIdComponent } from './components/helpers/mikron-account-id/mikron-account-id.component';
import {PowService} from "./services/pow.service";
import { ImportAddressBookComponent } from './components/import-address-book/import-address-book.component';
import { CurrencySymbolPipe } from './pipes/currency-symbol.pipe';
import { RepresentativesComponent } from './components/representatives/representatives.component';
import {RepresentativeService} from "./services/representative.service";
import {ManageRepresentativesComponent} from "./components/manage-representatives/manage-representatives.component";
import {NodeService} from "./services/node.service";
import {LedgerService} from "./services/ledger.service";
import {DesktopService} from "./services/desktop.service";
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateTPipe } from './pipes/translate.pipe';
import { LanguageService } from './services/language.service';
import { QrScanComponent } from './components/qr-scan/qr-scan.component'

export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, '/assets/translations/', '-lang.json');
}

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    ConfigureWalletComponent,
    NotificationsComponent,
    RaiPipe,
    SqueezePipe,
    AccountsComponent,
    SendComponent,
    AddressBookComponent,
    ReceiveComponent,
    WalletWidgetComponent,
    ManageWalletComponent,
    ConfigureAppComponent,
    AccountDetailsComponent,
    TransactionDetailsComponent,
    FiatPipe,
    ImportWalletComponent,
    MikronAccountIdComponent,
    ImportAddressBookComponent,
    CurrencySymbolPipe,
    RepresentativesComponent,
    ManageRepresentativesComponent,
    TranslateTPipe,
    QrScanComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    ClipboardModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    UtilService,
    WalletService,
    NotificationService,
    ApiService,
    AddressBookService,
    ModalService,
    WorkPoolService,
    AppSettingsService,
    WebsocketService,
    BlockService,
    PriceService,
    PowService,
    RepresentativeService,
    NodeService,
    LedgerService,
    DesktopService,
    LanguageService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
