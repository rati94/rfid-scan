import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

// services
import { RegulaService } from '../services/regula.service';
import { DocumentReaderCompletion } from '@regulaforensics/ionic-native-document-reader';
import { Enum } from '@regulaforensics/ionic-native-document-reader/ngx';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  showLoader: boolean = true;
  loading: number = 0;
  rfidFinished: boolean = false;
  constructor(private regula: RegulaService, private alertCtrl: AlertController, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.regula.initDB().subscribe(_dbStatus => {
      console.log('<DEBUG> initDB status: ', _dbStatus);
      if (_dbStatus === 'database prepared') {
        console.log('<!> initRegulaSDK before init');
        this.regula.initSDK().then(_sdkStatus => {
          this.showLoader = false;
          console.log('<DEBUG> initSDK status', _sdkStatus);
          this.cd.detectChanges();
        }, _sdkError => {
          console.error('<DEBUG> initSDK status', _sdkError);
        });
      } else {
        this.loading = _dbStatus / 100;
      }
      this.cd.detectChanges();
    });
  }

  /**
   * Starts scanning
   * Always start regular scan whether OCR OR RFID scan btn was pressed, in case of RFID, after documents first page is scanned, stop regular Scan and start RFID scan
   * @param {boolean} isRFID Set to true to start RFID scan
   */
  startScan(isRFID: boolean = false) {
    this.rfidFinished = false;
    this.regula.startRegularScan().subscribe(_scanResult => {
      console.log('<DEBUG> scanResult', {
        isRFID: isRFID,
        scanResult: _scanResult
      });
      this._handleScanResult(DocumentReaderCompletion.fromJson(JSON.parse(_scanResult)), isRFID);
    });
  }

  private _handleScanResult(completion: DocumentReaderCompletion, isRfid: boolean) {
    if (completion.action === Enum.DocReaderAction.COMPLETE) { // 1
      if (isRfid && !this.rfidFinished) {
        this._startRfidScan(completion);
      } else {
        console.log('<DEBUG> Scan Result: ', {
          withRfid: isRfid,
          result: completion
        });
      }
    } else if (completion.action === Enum.DocReaderAction.MORE_PAGES_AVAILABLE) { // 8
      if (isRfid) {
        this._startRfidScan(completion);
      }
    } else if (completion.action === Enum.DocReaderAction.ERROR) { // 3
      // error alert
      this.alertCtrl.create({
        header: 'Scan failed',
        message: 'Failed to scan the document!',
        buttons: ['Ok']
      }).then(alert => {
        alert.present().then();
      });
    } else {
      // PROCESS - 0, CANCEL - 2, NOTIFICATION - 5, PROCESS_WHITE_UV_IMAGE - 6
    }
  }

  private _startRfidScan(completion: DocumentReaderCompletion) {
    let accessKey = completion.results.getTextFieldValueByType({ fieldType: 51 });
    if (accessKey != null && accessKey !== '') {
      accessKey = accessKey.replace(/^/g, '').replace(/\n/g, '');
      this.regula.setRFIDScenario({ mMrz: accessKey, mPacePasswordType: 1 });
    } else {
      accessKey = completion.results.getTextFieldValueByType({ fieldType: 159 });
      if (accessKey != null && accessKey !== '') {
        this.regula.setRFIDScenario({ mMrz: accessKey, mPacePasswordType: 2, });
      }
    }

    this.regula.stopScan(false).then();
    const notification = 'rfidNotificationCompletionEvent';
    const paCert = 'paCertificateCompletionEvent';
    const taCert = 'taCertificateCompletionEvent';
    const taSig = 'taSignatureCompletionEvent';
    this.regula.startRFIDScan().subscribe((scanResult) => {
      if ((scanResult.substring(0, notification.length) !== notification) && (scanResult.substring(0, paCert.length) !== paCert) &&
        (scanResult.substring(0, taCert.length) !== taCert) && (scanResult.substring(0, taSig.length) !== taSig)) {
        this.rfidFinished = true;
        this._handleScanResult(DocumentReaderCompletion.fromJson(JSON.parse(scanResult)), true);
      }
    }, _ => {
      this.alertCtrl.create({
        header: 'Scan failed',
        message: 'Failed to scan the document!',
        buttons: ['Ok']
      }).then(alert => {
        alert.present().then();
      });
    });
  }

}
