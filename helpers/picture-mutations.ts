
export function base64toBlob(b64Data: string, contentType?: string, sliceSize?: number): Blob {
  contentType = contentType || '';
  sliceSize = sliceSize || 512;

  const byteCharacters: string = atob(b64Data);
  const byteArrays: Array<Uint8Array> = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice: string = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers: Array<number> = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray: Uint8Array = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  const blob: Blob = new Blob(byteArrays, {type: contentType});
  return blob;
}

export function rotateBase64Image(imageData: string, degrees: number): Promise<string> {
  return new Promise<string>((resolve) => {
    let canvas: HTMLCanvasElement = document.createElement('canvas');
    let canvasContext: CanvasRenderingContext2D = canvas.getContext('2d');
    let image: HTMLImageElement = new Image();

    image.onload = () => {
      if ((degrees / 90) % 2 === 0) {
        canvas.width = image.width;
        canvas.height = image.height;
      } else {
        canvas.width = image.height;
        canvas.height = image.width;
      }

      switch (degrees) {
        case 90:
          canvasContext.translate(canvas.width, 0);
          break;
        case 180:
          canvasContext.translate(canvas.width, canvas.height);
          break;
        case 270:
          canvasContext.translate(0, canvas.height);
          break;
      }

      canvasContext.rotate(degrees * Math.PI / 180);
      canvasContext.drawImage(image, 0, 0);
      let dataUrl: string = canvas.toDataURL('image/jpeg');
      resolve(dataUrl.replace('data:image/jpeg;base64,', ''));
    };

    image.src = 'data:image/jpeg;base64,' + imageData;
  });
}
