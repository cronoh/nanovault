import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable()
export class RepresentativeService {
  storeKey = `mikron-vault-representatives`;

  representatives$ = new BehaviorSubject([]);
  representatives = [];

  loaded = false;

  constructor() {
    this.representatives = this.defaultRepresentatives;
  }

  loadRepresentativeList() {
    if (this.loaded) return this.representatives;

    let list = this.defaultRepresentatives;
    const representativeStore = localStorage.getItem(this.storeKey);
    if (representativeStore) {
      list = JSON.parse(representativeStore);
    }
    this.representatives = list;
    this.representatives$.next(list);
    this.loaded = true;

    return list;
  }

  getRepresentative(id) {
    return this.representatives.find(rep => rep.id == id);
  }

  saveRepresentative(accountID, name, trusted = false, warn = false) {
    const newRepresentative: any = {
      id: accountID,
      name: name,
    };
    if (trusted) newRepresentative.trusted = true;
    if (warn) newRepresentative.warn = true;

    const existingRepresentative = this.representatives.find(r => r.name.toLowerCase() === name.toLowerCase() || r.id.toLowerCase() === accountID.toLowerCase());
    if (existingRepresentative) {
      this.representatives.splice(this.representatives.indexOf(existingRepresentative), 1, newRepresentative);
    } else {
      this.representatives.push(newRepresentative);
    }

    this.saveRepresentatives();
    this.representatives$.next(this.representatives);
  }

  deleteRepresentative(accountID) {
    const existingIndex = this.representatives.findIndex(a => a.id.toLowerCase() === accountID.toLowerCase());
    if (existingIndex === -1) return;

    this.representatives.splice(existingIndex, 1);

    this.saveRepresentatives();
    this.representatives$.next(this.representatives);
  }

  saveRepresentatives(): void {
    localStorage.setItem(this.storeKey, JSON.stringify(this.representatives));
  }

  getSortedRepresentatives() {
    const weightedReps = this.representatives.map(r => {
      if (r.trusted) {
        r.weight = 2;
      } else if (r.warn) {
        r.weight = 0;
      } else {
        r.weight = 1;
      }
      return r;
    });

    return weightedReps.sort((a, b) => b.weight - a.weight);
  }

  // Default representatives list
  defaultRepresentatives = [
    {
      id: 'mik_317ntk3fs3666tuzrdsx755rruhw935apyquan95uc18po55i1s53sew45tb',
      name: 'Mikron Rep 1',
      trusted: true,
    },
    {
      id: 'mik_39wmnmapst5wujyja9ydkkbmeirqz6ytcxg3aoj9ri8bttx4mxiz3pn8rqfc',
      name: 'Mikron Rep 2',
      trusted: true,
    },
  ];

}
