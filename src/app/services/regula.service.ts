import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file/ngx';
import { DocumentReader, Enum } from '@regulaforensics/ionic-native-document-reader/ngx';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegulaService {

  constructor(private file: File, private documentReader: DocumentReader) { }

  /**
   * Initialize Regula DB
   * @returns {Observable<any>} Observable
   */
  initDB(): Observable<any> {
    return this.documentReader.prepareDatabase('Full');
  }

  /**
   * Initialize Regula SDK
   * @returns {Promise<any>} Promise
   */
  initSDK(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this._readFile('', 'regula.license', (license) => {
        this.documentReader.initializeReader(license).then(initResult => {
          this.documentReader.setConfig({
            functionality: {
              videoCaptureMotionControl: true,
              showCaptureButton: true,
              cameraFrame: Enum.DocReaderFrame.DOCUMENT,
              showCaptureButtonDelayFromDetect: 1,
              showChangeFrameButton: true,
            },
            customization: {
              showResultStatusMessages: true,
              showStatusMessages: true
            },
            processParams: {
              scenario: 'Ocr',
              doRfid: false,
              dateFormat: 'yyyy-mm-dd',
              multipageProcessing: true,
              debugSaveLogs: true,
              debugSaveCroppedImages: true,
              debugSaveRFIDSession: true
            },
          }).then(_ => {
            this._sessionLogFolder();
          });
          this.documentReader.setRfidDelegate(Enum.RFIDDelegate.NO_PA).then();
          this.documentReader.setRfidScenario({
            autoSettings: true,
            readEPassport: true,
            ePassportDataGroups: {DG1: false, DG2: false, DG3: false, DG4: false, DG5: false, DG6: false, DG7: false, DG8: false, DG9: false,
                                  DG10: false, DG11: false, DG12: false, DG13: false, DG14: false, DG15: false, DG16: false},
            readEID: false,
            eIDDataGroups: {DG1: false, DG2: false, DG3: false, DG4: false, DG5: false, DG6: false, DG7: false, DG8: false, DG9: false, DG10: false,
                            DG11: false, DG12: false, DG13: false, DG14: false, DG15: false, DG16: false, DG17: false, DG18: false, DG19: false, DG20: false, DG21: false},
            readEDL: false,
            eDLDataGroups: {DG1: false, DG2: false, DG3: false, DG4: false, DG5: false, DG6: false, DG7: false, DG8: false, DG9: false,
                            DG10: false, DG11: false, DG12: false, DG13: false, DG14: false,}
          }).then();

          resolve(initResult);
        }).catch(initError => {
          reject(initError);
        });
      });
    });
  }

  startRegularScan(): Observable<any> {
    return this.documentReader.showScanner();
  }

  startRFIDScan(): Observable<any> {
    return this.documentReader.startRFIDReader();
  }

  /**
   * Stops regular OR RFID scan
   * @param {boolean} isRfid Set to true to stop RFID scan, otherwise stops the regular scanning
   * @returns {Promise<any>} Promise
   */
  stopScan(isRfid: boolean): Promise<any> {
    if (isRfid) {
      return this.documentReader.stopRFIDReader();
    }
    return this.documentReader.stopScanner();
  }

  setRFIDScenario(scenario) {
    this.documentReader.setRfidScenario(scenario).then();
  }

  private _getFileReader(): FileReader {
    const fileReader = new FileReader();
    return (fileReader as any).__zone_symbol__originalInstance;
  }

  private _readFile(dirPath: string, fileName: string, callback, ...items) {
    this.file.resolveDirectoryUrl(this.file.applicationDirectory + dirPath).then(dir => {
      this.file.getFile(dir, fileName, null).then(fileEntry => {
        fileEntry.file(file => {
          const reader = this._getFileReader();
          reader.readAsDataURL(file);
          reader.onload = (evt) => {
            let data = ((evt.target as FileReader).result as string);
            data = data.substring(data.indexOf(',') + 1);
            callback(data, items);
          };
        });
      });
    });
  }

  private _sessionLogFolder() {
    console.log('<DEBUG> Session log folder: ', this.documentReader.getSessionLogFolder());
  }
}
