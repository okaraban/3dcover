import Canvas from './Canvas'
/**
 * @interface LayerData
 */
class Text {
  constructor({ type, family, size, color }) {
    this.data = '';
    this.style = { 
      type: `${type.italic ? 'italic' : ''} ${type.bold ? 'bold' : ''}`,
      family,
      size,
      color
    };
  }
  get type() {
    return 'text';
  }
  get width() {
    const context = Canvas.context({
      font: this.font
    });
    const { width } = context.measureText(this.data);
    return width;
  }
  get height() {
    return this.style.size;
  }
  add(string) {
    this.data += string;
  }
  remove(count) {
    this.data = this.data.slice(0, -count);
  }
  includes(rx, ry, x, y) {
    return rx >= x - 5 && 
    rx <= x + this.width + 5 &&
    ry <= y + 10 &&
    ry >= y - this.height;
  }
  select(rx, ry, x, y) {
    return rx >= x && 
      rx <= x + this.width &&
      ry <= y &&
      ry >= y - this.height;
  }
  draw(context, x, y) {
    context.save();
    context.font = this.font;
    if (this.style.type.stroke) {
      context.strokeStyle = this.style.color;
      context.strokeText(this.data, x, y);
    } else {
      context.fillStyle = this.style.color;
      context.fillText(this.data, x, y);
    }
    context.restore();
  }
  frame(context, x, y) {
    context.save();
    context.setLineDash([10]);
    context.strokeRect(x - 5, y - this.height - 5, this.width + 10, this.height + 10);
    context.restore();
  }
  // specific
  get font() {
    return `${this.style.type} ${this.style.size}px ${this.style.family}`;
  }
}

export default Text;
