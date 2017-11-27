import _ from 'lodash'

class Canvas {
  constructor(width, height) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
  }
  getContext() {
    return this.canvas.getContext('2d');
  }
  toDataURL() {
    return this.canvas.toDataURL();
  }
  static clone(context) {
    const canvas = new Canvas(context.canvas.width, context.canvas.height);
    const clone = canvas.getContext('2d');
    clone.lineWidth = context.lineWidth;
    clone.strokeStyle = context.strokeStyle;
    clone.imageSmoothingQuality = context.imageSmoothingQuality;
    clone.lineJoin = context.lineJoin;
    clone.lineCap = context.lineCap;
    return clone;
  }
  static imageDataToBase64(imageData) {
    const canvas = new Canvas(imageData.width, imageData.height);
    const context = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }
} 

export default Canvas;