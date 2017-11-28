import crypto from 'crypto'
import Images from './Images'

class Layer {
  constructor({ image, name = 'New Layer', x = 0, y = 0, type = 'image' }) {
    this.uid = crypto.randomBytes(32).toString('base64');
    this.type = type;
    this.name = name;
    this.image = image;
    this.x = x;
    this.y = y;
  }
  get width() {
    return this.image.width || this._width;
  }
  set width(width) {
    if (typeof this.image == 'string')
      this._width = width;
    else this.image.width = width;
  }
  get height() {
    return this.image.height || this._height;
  }
  set height(height) {
    if (typeof this.image == 'string')
      this._height = height;
    else this.image.height = height;
  }
  static async fromSource(src, { x, y, name }) {
    const image = await Images.create(src);
    return new Layer({ name, image, x, y });
  }
}

export default Layer;