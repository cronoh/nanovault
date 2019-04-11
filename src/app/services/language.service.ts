import { Injectable, OnInit } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { AppSettingsService } from "../services/app-settings.service";
import { NotificationService } from "../services/notification.service";
import * as Rx from 'rxjs';

// Handle language selection
@Injectable()
export class LanguageService implements OnInit {
  // List of selected languages
  availLanguages = ['en', 'hu'];
  defaultLang = 'en';
  queryParamLang = null;
  selectedLang = null;

  constructor(
    private router: ActivatedRoute,
    private translate: TranslateService,
    private appSettings: AppSettingsService,
    private notifications: NotificationService
  ) { }

  async ngOnInit() {
    console.log('ngOnInit');
  }

  init() {
    this.translate.addLangs(this.availLanguages);
    this.translate.setDefaultLang(this.defaultLang);
    const params = this.router.snapshot.queryParams;
    //console.log('params ' + params);
    if (params && params.lang) {
      this.setQueryParamLang(params.lang);
    }

    this.setup();
  }

  private pendingLangChange : Rx.Observable<any>;

  private changeLangInternOne(newLang: string, oldLang: string, source: string) {
    this.pendingLangChange = this.translate.use(newLang);
    this.pendingLangChange.subscribe(
      next => {}, error => {},
      () => {
        // completion
        this.pendingLangChange = undefined;
        console.log('Language changed, from "' + oldLang + '" to "' + newLang + '" based on ' + source);
        if (oldLang) {
          // This is not transalated on purpose (as translation may still change)
          this.notifications.sendSuccess(`Language changed: '${this.selectedLang}'  (from ${source})`);
        }
      }
    );
  }

  private changeLangIntern(newLang: string, oldLang: string, source: string) {
    if (typeof this.pendingLangChange === "undefined") {
      // no pending change
      this.changeLangInternOne(newLang, oldLang, source);
    }
    else
    {
      // in progress
      //console.log('in progress', this.pendingLangChange);
      this.pendingLangChange.subscribe(next => {}, error => {}, () => {
        // do next on completion
        this.changeLangInternOne(newLang, oldLang, source);
      });
    }
  }

  setQueryParamLang(queryParamLang) {
    if (queryParamLang && queryParamLang !== this.queryParamLang) {
      console.log('queryParamLang ' + queryParamLang);
      this.queryParamLang = queryParamLang;
    }
  }

  // Select and apply a language
  setup() {
    const browserLang = this.translate.getBrowserLang();
    const newLang = this.chooseLang(this.queryParamLang, this.appSettings.settings.language, browserLang);
    if (newLang.lang !== this.selectedLang) {
      const oldLang = this.selectedLang;
      this.selectedLang = newLang.lang;  // set in advance
      this.changeLangIntern(newLang.lang, oldLang, newLang.source);
    }
  }

  getSelectedLang() : string { return this.selectedLang; }

  // Choose the language to use
  chooseLang(queryParamLang : string, settingLang : string, browserLang : string) {
    let source : string = 'default';
    let lang : string = this.defaultLang;
    if (queryParamLang && this.isValid(queryParamLang)) {
      source = 'query param';
      lang = queryParamLang;
    } else if (settingLang && this.isValid(settingLang)) {
      source = 'setting';
      lang = settingLang;
    } else if (browserLang && this.isValid(browserLang)) {
      source = 'browser setting';
      lang = browserLang;
    }
    //console.log("Language service: selected language '" + lang + "', based on", source);
    return { lang, source };
  }

  // Check if a language is supported (valid option)
  isValid(lang : string) {
    return (this.availLanguages.indexOf(lang) != -1);
  }
}
