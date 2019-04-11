import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { WalletService } from "../services/wallet.service";
import { LanguageService } from "../services/language.service";

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {

  donationAccount = `xrb_318syypnqcgdouy3p3ekckwmnmmyk5z3dpyq48phzndrmmspyqdqjymoo8hj`;

  wallet = this.walletService.wallet;
  isConfigured = this.walletService.isConfigured;

  constructor(
    private activatedRoute: ActivatedRoute,
    private walletService: WalletService,
    private languageService: LanguageService) { }

  ngOnInit() {
  }
}
