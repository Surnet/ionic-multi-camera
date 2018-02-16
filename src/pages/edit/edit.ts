// Base Dependencies
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

// Classes
import { Picture } from '../../classes/picture';

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
    this.picture.imageOrientation += 90;
    if (this.picture.imageOrientation >= 360) {
      this.picture.imageOrientation - 360;
    }
  }

}
