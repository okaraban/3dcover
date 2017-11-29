import crypto from 'crypto'
import Images from './Images'

class Layer {
  constructor(data, options) {
    this.uid = crypto.randomBytes(32).toString('base64');
    this.type = options.type || 'image';
    this.name = options.name || 'New Layer';
    this.data = data;
    this.width = options.width || data.width;
    this.height = options.height || data.height;
    this.x = options.x || 0;
    this.y = options.y || 0;
  }
  static async fromSource(src, options) {
    const image = await Images.create(src);
    return new Layer(image, options);
  }
}

export default Layer;