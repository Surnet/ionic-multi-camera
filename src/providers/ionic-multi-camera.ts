// Base Dependencies
import { Injectable } from '@angular/core';
import { App, NavController } from 'ionic-angular';
import { CameraPreviewPictureOptions } from '@ionic-native/camera-preview';

// Classes
import { Picture } from '../classes/picture';
import { PictureResult } from '../classes/picture-result';
import { CameraTranslations } from '../classes/translations';

// Components
import { CameraComponent } from '../pages/camera/camera';

@Injectable()
export class IonicMultiCamera {

  private navCtrl: NavController;

  constructor(
    private app: App
  ) {
    this.navCtrl = this.app.getActiveNavs()[0];
  }

  public getPicture(pictureOptions?: CameraPreviewPictureOptions, translations?: CameraTranslations): Promise<Array<Picture>> {
    return new Promise<Array<Picture>>((resolve, reject) => {
      const getData = (data: PictureResult): Promise<void> => {
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data.pictures);
        }
        return Promise.resolve();
      };

      this.navCtrl.push(CameraComponent, {
        callback: getData,
        pictureOptions,
        translations
      });
    });
  }

}
