import Canvas from './Canvas'
import Layer from './Layer'

class Line {
  constructor(context, { scale }) {
    this.path = new Path2D();
    this.context = context;
    this.scale = scale;
  }
  start(x, y) {
    x *= this.scale;
    y *= this.scale;
    this.path.moveTo(x, y);
    this.path.lineTo(x + 1, y + 1);
    this.min = { x, y };
    this.max = { x: x + 1, y: y + 1 };
    this.context.stroke(this.path);
  }
  draw(x, y) {
    x *= this.scale;
    y *= this.scale;
    if (this.min.x > x) {
      this.min.x = x;
    } else if (this.max.x < x) {
      this.max.x = x;
    }
    if (this.min.y > y) {
      this.min.y = y;
    } else if (this.max.y < y) {
      this.max.y = y;
    }
    this.path.lineTo(x, y);
    this.context.stroke(this.path);
  }
  async toLayer() {
    const context = Canvas.clone(this.context);
    context.stroke(this.path);
    const extra = context.lineWidth / 2;
    const x = this.min.x - extra;
    const y = this.min.y - extra;
    const width = this.max.x - x  + extra * 2;
    const height = this.max.y - y + extra * 2;
    const imageData = context.getImageData(x, y, width, height);
    const base64 = Canvas.imageDataToBase64(imageData);
    const layer = await Layer.fromSource(base64, { x, y });
    return layer;
  }
}

export default Line;
