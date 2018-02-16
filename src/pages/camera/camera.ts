// Base Dependencies
import { Component, ElementRef, ViewChild } from '@angular/core';
import { NavController, NavParams, MenuController, normalizeURL } from 'ionic-angular';
import uuid from 'uuid/v1';

// Ionic Native plugins
import { StatusBar } from '@ionic-native/status-bar';
import { CameraPreview, CameraPreviewOptions, CameraPreviewPictureOptions } from '@ionic-native/camera-preview';
import { File, IWriteOptions } from '@ionic-native/file';
import { DeviceMotion, DeviceMotionAccelerationData } from '@ionic-native/device-motion';

// RxJs Import
import { Subscription } from 'rxjs/Subscription';

// Classes
import { Picture } from '../../classes/picture';
import { PictureResult } from '../../classes/picture-result';
import { CameraTranslations } from '../../classes/translations';

// Components
import { EditComponent } from '../edit/edit';

// Helpers
import { base64toBlob, rotateBase64Image } from '../../helpers/picture-mutations';

@Component({
  selector: 'ionic-multi-camera',
  templateUrl: 'camera.html',
  styleUrls: ['camera.scss']
})
export class CameraComponent {

  @ViewChild('header') header: ElementRef;
  @ViewChild('footer') footer: ElementRef;

  public pictures: Array<Picture> = [];
  private callback: (data: PictureResult) => Promise<void>;
  private pictureOptions: CameraPreviewPictureOptions;
  public translations: CameraTranslations;

  private deviceOrientation: DeviceMotionAccelerationData;
  private motionSubscription: Subscription;

  private doesExit: boolean = false;

  // Flash Mode
  public showFlashOptions: boolean = false;
  private _activeFlashMode: string = 'auto';
  get activeFlashMode(): string {
    return this._activeFlashMode;
  }
  set activeFlashMode(newValue) {
    this.cameraPreview.setFlashMode(newValue)
    .then(() => {
      this._activeFlashMode = newValue;
      this.showFlashOptions = false;
    })
    .catch(err => {
      this.errorHandler(err);
    });
  }

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private menu: MenuController,
    private statusBar: StatusBar,
    private cameraPreview: CameraPreview,
    private file: File,
    private deviceMotion: DeviceMotion
  ) {
    this.callback = this.navParams.get('callback');
    this.pictureOptions = this.navParams.get('pictureOptions') || {
      quality: 80,
      width: 4096,
      height: 4096
    };
    this.translations = this.navParams.get('translations') || {
      cancel: 'Cancel',
      finish: 'Finish',
      auto: 'AUTO',
      on: 'On',
      off: 'Off'
    };
  }

  public ionViewWillEnter(): void {
    this.menu.swipeEnable(false);
    this.statusBar.styleBlackOpaque();
  }

  public ionViewDidEnter(): void {
    this.startCam();
    this.motionSubscription = this.deviceMotion.watchAcceleration({ frequency: 500 }).subscribe((acceleration: DeviceMotionAccelerationData) => {
      this.deviceOrientation = acceleration;
    });
  }

  public ionViewWillLeave(): void {
    if (this.doesExit) {
      this.menu.swipeEnable(true);
      this.statusBar.styleDefault();
    }
  }

  public ionViewDidLeave(): void {
    if (this.doesExit) {
      this.stopCam();
      this.motionSubscription.unsubscribe();
    }
  }

  public focus(event) {
    const headerHeight = this.header.nativeElement.offsetHeight;
    const footerHeight = this.footer.nativeElement.offsetHeight;
    const xPoint: number = event.offsetX;
    const yPoint: number = (event.offsetY - headerHeight) / (window.screen.height - headerHeight - footerHeight) * window.screen.height;
    this.cameraPreview.tapToFocus(xPoint, yPoint)
    .then(() => {

    })
    .catch(err => {
      console.error(err);
    });
  }

  public switchCamera(): void {
    this.cameraPreview.switchCamera()
    .then(() => {

    })
    .catch(err => {
      this.errorHandler(err);
    });
  }

  public cancel(): void {
    let i: number = this.pictures.length;
    this.pictures.forEach(picture => {
      picture.fileEntry.remove(() => {
        i--;
        if (i === 0) {
          this.pictures = [];
          this.exit();
        }
      }, err => {
        this.errorHandler(err);
      });
    });
    if (i === 0) {
      this.exit();
    }
  }

  public takePicture(): void {
    const imageOrientation = this.getImageOrientation();
    this.cameraPreview.takePicture(this.pictureOptions)
    .then(picture => {
      const fileOptions: IWriteOptions = {
        replace: true
      };
      return this.file.writeFile(this.file.cacheDirectory, uuid() + '.jpeg', base64toBlob(picture, 'image/jpeg'), fileOptions)
      .then(fileEntry => {
        const normalizedURL = normalizeURL(fileEntry.toURL());
        this.pictures.push({
          fileEntry,
          normalizedURL,
          base64Data: picture,
          imageOrientation
        });
      })
      .catch(err => {
        this.errorHandler(err);
      });
    })
    .catch(err => {
      this.errorHandler(err);
    });
  }

  public finish(): void {
    const promises = [];
    this.pictures.forEach(picture => {
      promises.push(
        new Promise((resolve, reject) => {
          rotateBase64Image(picture.base64Data, picture.imageOrientation)
          .then(imageData => {
            picture.imageOrientation = 0;
            picture.base64Data = imageData;
            picture.fileEntry.createWriter(fileWriter => {
              fileWriter.onwriteend = () => {
                resolve(picture);
              };
              fileWriter.onerror = function (e) {
                reject(e);
              };
              const file: Blob = base64toBlob(imageData, 'image/jpeg');
              fileWriter.truncate(file.size);
              fileWriter.write(file);
            }, err => {
              reject(err);
            });
          })
          .catch(err => {
            reject(err);
          });
        })
      );
    });

    Promise.all(promises)
    .then(results => {
      this.callback({
        pictures: results
      });
      this.doesExit = true;
      this.navCtrl.pop();
    })
    .catch(err => {
      this.errorHandler(err);
    });
  }

  public editPicture(picture: Picture, index: number): void {
    this.navCtrl.push(EditComponent, {
      picture,
      array: this.pictures,
      index
    });
  }

  private errorHandler(error: any): void {
    this.callback({
      error
    });
    this.doesExit = true;
    this.navCtrl.pop();
  }

  private exit(): void {
    this.callback({
      pictures: this.pictures
    });
    this.doesExit = true;
    this.navCtrl.pop();
  }

  private startCam(): void {
    const headerHeight = this.header.nativeElement.offsetHeight;
    const footerHeight = this.footer.nativeElement.offsetHeight;
    const cameraPreviewOpts: CameraPreviewOptions = {
      x: 0,
      y: headerHeight,
      width: window.screen.width,
      height: window.screen.height - headerHeight - footerHeight,
      camera: 'rear',
      tapPhoto: false,
      previewDrag: false,
      toBack: true,
      alpha: 1
    };

    this.cameraPreview.startCamera(cameraPreviewOpts)
    .then(() => {
      this.cameraPreview.setFlashMode('auto')
      .then(() => {

      })
      .catch(err => {
        this.errorHandler(err);
      });
    })
    .catch(err => {
      if (err.indexOf('Camera already started') !== -1) {
        this.cameraPreview.setFlashMode('auto')
        .then(() => {

        })
        .catch(err => {
          this.errorHandler(err);
        });
      } else {
        this.errorHandler(err);
      }
    });
  }

  private stopCam(): void {
    this.cameraPreview.stopCamera();
  }

  private getImageOrientation(): number {
    if (this.deviceOrientation) {
      // If landscape
      if (Math.abs(this.deviceOrientation.x) > Math.abs(this.deviceOrientation.y)) {
        if (this.deviceOrientation.x > 0) {
          return 270;
        } else {
          return 90;
        }
      } else {
        // Portrait upside-down
        if (this.deviceOrientation.y < 0) {
          return 180;
        } else {
          // Right-side up
          return 0;
        }
      }
    } else {
      return 0;
    }
  }

}
