import crypto from 'crypto'
import Images from './Images'

class Layer {
  constructor({ image, name = 'New Layer', x = 0, y = 0 }) {
    this.uid = crypto.randomBytes(32).toString('base64');
    this.name = name;
    this.image = image;
    this.x = x;
    this.y = y;
  }
  get width() {
    return this.image.width;
  }
  set width(width) {
    this.image.width = width;
  }
  get height() {
    return this.image.height;
  }
  set height(height) {
    this.image.height = height;
  }
  static async fromSource(src, { x, y, name }) {
    const image = await Images.create(src);
    return new Layer({ name, image, x, y });
  } 
}

export default Layer;