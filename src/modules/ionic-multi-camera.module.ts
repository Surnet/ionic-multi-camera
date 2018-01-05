// Base Dependencies
import { NgModule, ModuleWithProviders } from '@angular/core';
import { IonicPageModule, NavController } from 'ionic-angular';

// Ionic Native plugins
import { StatusBar } from '@ionic-native/status-bar';
import { CameraPreview } from '@ionic-native/camera-preview';
import { File } from '@ionic-native/file';
import { DeviceMotion } from '@ionic-native/device-motion';

// Components
import { CameraComponent } from '../pages/camera/camera';
import { EditComponent } from '../pages/edit/edit';

// Providers
import { IonicMultiCamera } from '../providers/ionic-multi-camera';

@NgModule({
  declarations: [
    CameraComponent,
    EditComponent
  ],
  imports: [
    IonicPageModule.forChild(CameraComponent)
  ],
  providers: [
    StatusBar,
    CameraPreview,
    File,
    DeviceMotion
  ],
  entryComponents: [
    CameraComponent,
    EditComponent
  ]
})
export class IonicMultiCameraModule {
  public static forRoot(): ModuleWithProviders {
    return {
      ngModule: IonicMultiCameraModule,
      providers: [ IonicMultiCamera ]
    };
  }
}
