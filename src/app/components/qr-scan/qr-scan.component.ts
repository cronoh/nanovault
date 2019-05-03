import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";

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
  scans = [];
  content = '(scanned content comes here)';

  constructor(
    private router: Router
  ) { }

  async ngOnInit() {
    let self = this;
    let videoElem = document.getElementById('instascan');
    this.scanner = new Instascan.Scanner({ video: videoElem, scanPeriod: 5 });
    this.scanner.addListener('scan', function (content, image) {
      console.log('SCAN', content);
      self.content = content;
      self.scans.unshift({ date: +(Date.now()), content: content });
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
  }

  async selectCamera(camera: any) {
    //console.log('selectCamera', camera.id);
    this.activeCameraId = camera.id;
    //console.log('scanner starting');
    await this.scanner.start(camera);
    //console.log("camera started", camera.id);
  }
}
