import crypto from 'crypto'

class Layer {
  constructor(data, { x = 0, y = 0, name }) {
    this.data = data;
    this.uid = crypto.randomBytes(32).toString('base64');
    this.name = name || 'New Layer';
    this.x = x;
    this.y = y;
    this.type = data.type;
  }
  get width() {
    return this.data.width;
  }
  get height() {
    return this.data.height;
  }
  get src() {
    if (this.type == 'picture') {
      return this.data.src;
    }
  }
  select(x, y, { expanded } = {}) {
    if (expanded) {
      return this.data.includes(x, y, this.x, this.y);
    } else {
      return this.data.select(x, y, this.x, this.y);
    }
  }
  draw(context) {
    this.data.draw(context, this.x, this.y);
  }
  frame(context) {
    this.data.frame(context, this.x, this.y);
  }
  resize(point, rx, ry) {
    const { x, y } = this.data.resize(point, rx, ry, this.x, this.y);
    this.x = x;
    this.y = y;
  }
  recalc() {
    this.data.recalc();
  }
  async conversion() {
    const { picture, x, y } = await this.data.toPicture(this.x, this.y);
    this.data = picture;
    this.x = x;
    this.y = y;
    this.type = this.data.type;
  }
}

export default Layer;