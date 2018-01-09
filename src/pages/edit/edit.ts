// Base Dependencies
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

// Classes
import { Picture } from '../../classes/picture';

// Helpers
import { base64toBlob, rotateBase64Image } from '../../helpers/picture-mutations';

@Component({
  selector: 'ionic-multi-edit',
  templateUrl: 'edit.html',
  styleUrls: ['edit.scss']
})
export class EditComponent {

  public picture: Picture;
  private array: Array<Picture>;
  private index: number;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams
  ) {
    this.picture = this.navParams.data.picture;
    this.array = this.navParams.data.array;
    this.index = this.navParams.data.index;
  }

  public cancel(): void {
    this.navCtrl.pop();
  }

  public remove(): void {
    this.picture.fileEntry.remove(() => {
      this.array.splice(this.index, 1);
      this.navCtrl.pop();
    }, err => {
      console.error(err);
    });
  }

  public rotateLeft(): void {
    rotateBase64Image(this.picture.base64Data, 270)
    .then(imageData => {
      this.picture.base64Data = imageData;
      this.picture.fileEntry.createWriter(fileWriter => {
        const file: Blob = base64toBlob(imageData, 'image/jpeg');
        fileWriter.truncate(file.size);
        fileWriter.write(file);
      }, err => {
        console.error(err);
      });
    })
    .catch(err => {
      console.error(err);
    });
  }

}
