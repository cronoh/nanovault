import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-mikron-account-id',
  templateUrl: './mikron-account-id.component.html',
  styleUrls: ['./mikron-account-id.component.css']
})
export class MikronAccountIdComponent implements OnInit {

  @Input('accountID') accountID: string;

  firstCharacters = '';
  lastCharacters = '';

  constructor() { }

  ngOnInit() {
    const accountID = this.accountID;
    const openingChars = 9;
    const closingChars = 5;
    this.firstCharacters = accountID.split('').slice(0, openingChars).join('');
    this.lastCharacters = accountID.split('').slice(-closingChars).join('');
    // return `<span style="color: #f00;">${firstChars}</span>.....${lastChars}`;
  }

}
