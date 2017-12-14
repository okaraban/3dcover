import Canvas from './Canvas'
import Picture from './Picture'
/**
 * @interface LayerData
 */
class Line {
  constructor({ width, color }) {
    this.style = { width, color };
    this.data = [{ x: 1, y: 1 }];
    this.min = { x: 0, y: 0 };
    this.max = { x: 1, y: 1 };
  }
  get type() {
    return 'line';
  }
  get width() {
    return this.max.x - this.min.x + this.style.width;
  }
  get height() {
    return this.max.y - this.min.y + this.style.width;
  }
  add(x, y) {
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
    this.data.push({ x, y });
  }
  includes(rx, ry, x, y) {
    const extra = this.style.width / 2;
    return rx >= x + this.min.x - extra && 
      rx <= x + this.max.x + extra &&
      ry >= y + this.min.y - extra &&
      ry <= y + this.max.y + extra;
  }
  select(rx, ry, x, y) {
    const context = Canvas.context({
      lineWidth: this.style.width
    });
    const path = this.getPath(x, y);
    return context.isPointInStroke(path, rx, ry);
  }
  draw(context, x, y) {
    context.save();
    context.lineWidth = this.style.width;
    context.strokeStyle = this.style.color;
    const path = this.getPath(x, y);
    context.stroke(path);
    context.restore();
  }
  frame(context, x, y) {
    context.save();
    context.setLineDash([10]);
    context.strokeRect(
      x + this.min.x - this.style.width / 2,
      y + this.min.y - this.style.width / 2,
      this.width,
      this.height
    );
    context.restore();
  }
  async toPicture(x, y) {
    const context = Canvas.context({
      size: {
        width: this.width,
        height: this.height,
      },
      lineWidth: this.style.width,
      strokeStyle: this.style.color
    });
    const sx = -this.min.x + this.style.width / 2;
    const sy = -this.min.y + this.style.width / 2;
    const path = this.getPath(sx, sy);
    context.stroke(path);
    const src = context.canvas.toDataURL();
    const image = await Picture.create(src);
    const picture = new Picture(image);
    return {
      picture,
      x: x - sx,
      y: y - sy
    };
  }
  // specific
  getPath(x, y) {
    const path = new Path2D();
    path.moveTo(x, y);
    this.data.forEach(point => {
      path.lineTo(x + point.x, y + point.y);
    });
    return path;
  }
}

export default Line;
