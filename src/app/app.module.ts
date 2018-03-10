import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import {HttpClientModule} from "@angular/common/http";
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
import {NanoBlockService} from "./services/nano-block.service";
import { AccountDetailsComponent } from './components/account-details/account-details.component';
import { TransactionDetailsComponent } from './components/transaction-details/transaction-details.component';
import {PriceService} from "./services/price.service";
import { FiatPipe } from './pipes/fiat.pipe';
import { ImportWalletComponent } from './components/import-wallet/import-wallet.component';
import { NanoAccountIdComponent } from './components/helpers/nano-account-id/nano-account-id.component';
import {PowService} from "./services/pow.service";


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
    NanoAccountIdComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    ClipboardModule
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
    NanoBlockService,
    PriceService,
    PowService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
