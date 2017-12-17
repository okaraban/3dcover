import Canvas from './Canvas'
/**
 * @interface LayerData
 */
class Picture {
  constructor(image) {
    this.data = image;
    const canvas = new Canvas(image.width, image.height);
    const context =  canvas.getContext();
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, image.width, image.height);
    this.pixels = data;
  }
  get src() {
    return this.data.src;
  }
  get type() {
    return 'picture';
  }
  get width() {
    return this.data.width;
  }
  set width(width) {
    this.data.width = width;
  } 
  get height() {
    return this.data.height;
  }
  set height(height) {
    this.data.height = height;
  } 
  includes(rx, ry, x, y) {
    return rx >= x && 
      rx <= x + this.width &&
      ry >= y &&
      ry <= y + this.height;
  }
  select(rx, ry, x, y) {
    if (this.includes(rx, ry, x, y)) {
      const sx = rx - x;
      const sy = ry - y;
      const alpha = this.pixels[(sy * this.width + sx) * 4 + 4]
      if (alpha) {
        return true
      }
    }
    return false;
  }
  draw(context, x, y) {
    context.drawImage(this.data, x, y, this.width, this.height);
  }
  frame(context, x, y) {
    context.save();
    context.setLineDash([10]);
    context.strokeRect(x, y, this.width, this.height);
    context.fillRect(x - 10, y - 10, 20, 20);
    context.fillRect(x + this.width - 10, y - 10, 20, 20);
    context.fillRect(x + this.width - 10, y + this.height - 10, 20, 20);
    context.fillRect(x - 10, y + this.height - 10, 20, 20);
    context.restore();
  }
  resize(point, rx, ry, x, y) {
    if (point == 'rb') {
      this.width += rx;
      this.height += ry;
    } else if ( point == 'lb') {
      this.width -= rx;
      this.height += ry;
      x += rx;
    } else if (point == 'rt') {
      this.width += rx;
      this.height -= ry;
      y += ry;
    } else if (point == 'lt') {
      this.width -= rx;
      this.height -= ry;
      x += rx;
      y += ry;
    }
    return { x, y };
  }
  recalc() {
    const canvas = new Canvas(this.width, this.height);
    const context =  canvas.getContext();
    context.drawImage(this.data, 0, 0, this.width, this.height);
    const { data } = context.getImageData(0, 0, this.width, this.height);
    this.pixels = data;
  }
  async toPicture(x, y) {
    return { picture: this, x, y }
  }
  // specific
  static normalize(image, { width, height }) {
    if (image.width > width || image.height > height) {
      const correlation = width / height;
      if (correlation > 1) {
        image.width = height * (image.width / image.height);
        image.height = height;
      } else if (correlation < 1) {
        image.height = width / (image.width / image.height);
        image.width = width;
      } else {
        image.width = image.height = Math.min(width, height);
      }
    }
    return image;
  }
  static create(src) {
    return new Promise(resolve => {
      const image = new Image();
      image.src = src;
      image.onload = function() {
        resolve(image);
      };
    });
  }
}

export default Picture;
