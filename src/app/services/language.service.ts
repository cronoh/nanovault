import { Injectable, OnInit } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { AppSettingsService } from "../services/app-settings.service";

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
    private appSettings: AppSettingsService
  ) { }

  async ngOnInit() {
    console.log('ngOnInit');
  }

  init() {
    this.translate.addLangs(this.availLanguages);
    this.translate.setDefaultLang(this.defaultLang);
    const params = this.router.snapshot.queryParams;
    console.log('params ' + params);
    if (params && params.lang) {
        console.log('params.lang ' + params.lang);
        this.queryParamLang = params.lang;
    }

    this.setup(this.queryParamLang);
  }

  // Select and apply a language
  setup(queryParamLang) {
    const browserLang = this.translate.getBrowserLang();
    const newLang = this.chooseLang(queryParamLang, this.appSettings.settings.language, browserLang);
    if (newLang !== this.selectedLang) {
      this.translate.use(newLang);
      this.selectedLang = newLang;
    }
  }

  getSelectedLang() : string { return this.selectedLang; }

  // Choose the language to use
  chooseLang(queryParamLang : string, settingLang : string, browserLang : string) : string {
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
    return lang;
  }

  // Check if a language is supported (valid option)
  isValid(lang : string) {
    return (this.availLanguages.indexOf(lang) != -1);
  }
}
