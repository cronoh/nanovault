import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";

// for using Instascan library (from instascan.min.js)
declare var Instascan: any;

@Component({
  selector: 'app-qr-scan',
  templateUrl: './qr-scan.component.html',
  styleUrls: ['./qr-scan.component.css']
})
export class QrScanComponent implements OnInit {

  scanner = null;
  activeCameraId = null;
  cameras = [];
  //scans = [];
  contentString = '(scanned content comes here)';
  contentAccount = '';
  contentHttp = '';
  contentVault = '';

  constructor(
    private router: Router
  ) { }

  async ngOnInit() {
    let self = this;
    let videoElem = document.getElementById('instascan');
    this.scanner = new Instascan.Scanner({ video: videoElem, scanPeriod: 5 });
    this.scanner.addListener('scan', function (content, image) {
      self.scanAction(content);
    });

    let cameras1 = await Instascan.Camera.getCameras();
    //console.log('cameras1', cameras1.length);
    if (cameras1.length <= 0) {
      console.error('No cameras found.');
    } else {
      this.cameras = cameras1;
      //console.log('cameras[0].id', this.cameras[0].id);
      this.selectCamera(this.cameras[0]);
    }

    // debug
    //this.scanAction('https://wallet.mikron.io/send?to=mik_1j648kqxntisaxcdcp6ohctrtu6pgrf1j39zirsb6m3iweg6h9otec9kumgj');
  }

  async selectCamera(camera: any) {
    //console.log('selectCamera', camera.id);
    this.activeCameraId = camera.id;
    //console.log('scanner starting');
    await this.scanner.start(camera);
    //console.log("camera started", camera.id);
  }

  scanAction(content: string) {
    console.log('scanAction', content.length, content);
    this.contentString = content;
    this.contentAccount = '';
    this.contentHttp = '';
    this.contentVault = '';
    //this.scans.unshift({ date: +(Date.now()), content: content });
    if (content.startsWith('http')) {
      this.contentHttp = content;
      // TODO check prefix ...
      this.contentVault = content;
      const sendToIdx = content.indexOf('send');
      console.log(content, sendToIdx);
      if (sendToIdx > 0) {
        const toIdx = content.indexOf('to');
        console.log(toIdx);
        if (toIdx > 0) {
          const toAddr = content.substring(toIdx+3);
          console.log(toAddr);
          this.router.navigate(['send'], {queryParams: {to: toAddr}});
        }
      }
    } else {
      // check for account
    }
  }
}
