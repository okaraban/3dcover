/**
 * @interface LayerData
 */
class Picture {
  constructor(image) {
    this.data = image;
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
    return this.select(rx, ry, x, y);
  }
  select(rx, ry, x, y) {
    return rx >= x && 
      rx <= x + this.width &&
      ry >= y &&
      ry <= y + this.height;
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
