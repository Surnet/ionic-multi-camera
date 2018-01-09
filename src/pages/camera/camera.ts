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

  public pictures: Array<Picture> = [];
  private callback: (data: PictureResult) => Promise<void>;

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
    this.cameraPreview.tapToFocus(event.offsetX, event.offsetY + headerHeight);
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
    const pictureOptions: CameraPreviewPictureOptions = {
      quality: 80,
      width: 4096,
      height: 4096
    };
    this.cameraPreview.takePicture(pictureOptions)
    .then(async picture => {
      picture = await this.rotateImageBasedOnOrientation(picture);
      const fileOptions: IWriteOptions = {
        replace: true
      };
      this.file.writeFile(this.file.cacheDirectory, uuid() + '.jpeg', base64toBlob(picture, 'image/jpeg'), fileOptions)
      .then(fileEntry => {
        const normalizedURL = normalizeURL(fileEntry.toURL());
        this.pictures.push({
          fileEntry,
          normalizedURL,
          base64Data: picture
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
    this.exit();
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
    const cameraPreviewOpts: CameraPreviewOptions = {
      x: 0,
      y: 0,
      width: window.screen.width,
      height: window.screen.height,
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
      if (err === 'Camera already started!') {
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

  private rotateImageBasedOnOrientation(imageData: string): Promise<string> {
    if (this.deviceOrientation) {
      // If landscape
      if (Math.abs(this.deviceOrientation.x) > Math.abs(this.deviceOrientation.y)) {
        if (this.deviceOrientation.x > 0) {
          return rotateBase64Image(imageData, 270);
        } else {
          return rotateBase64Image(imageData, 90);
        }
      } else {
        // Portrait upside-down
        if (this.deviceOrientation.y < 0) {
          return rotateBase64Image(imageData, 180);
        } else {
          // Right-side up
          return new Promise((resolve) => {
            resolve(imageData);
          });
        }
      }
    } else {
      return new Promise((resolve) => {
        resolve(imageData);
      });
    }
  }

}
