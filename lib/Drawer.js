import _ from 'lodash'
import Layer from './Layer'
import Line from './Line'
import Text from './Text'
import Picture from './Picture'
import Canvas from './Canvas'

class Drawer {
  constructor(canvas, {
    width = 100,
    height = 100,
    scale = 2
  } = {}) {
    this.scale = scale;
    canvas.width = width * scale;
    canvas.height = height * scale;
    this.context = canvas.getContext('2d');
    this.context.lineWidth = 2,
    this.context.lineCap = 'round',
    this.context.lineJoin = 'round',
    this.context.textBaseline = 'ideographic';
    this.context.imageSmoothingQuality = 'high';
    this.layers = [];
  }
  get line() {
    const context = this.context;
    return {
      set width(width) {
        context.lineWidth = width;
      },
      get width() {
        return context.lineWidth;
      },
      set color(style) {
        context.strokeStyle = style;
      },
      get color() {
        return context.strokeStyle;
      },
      set join(join) {
        context.lineJoin = join;
      },
      set smoothing(smoothing) {
        context.imageSmoothingQuality = smoothing;
      },
      set cap(cap) {
        context.lineCap = cap;
      }
    };
  }
  set line(line) {
    for (let prop in line) {
      this.line[prop] = line[prop];
    }
  }
  get canvas() {
    return this.context.canvas
  }
  get source() {
    const clone = Canvas.clone(this.context);
    _.forEachRight(this.layers, layer => layer.draw(clone));
    return clone.canvas.toDataURL();
  }
  get width() {
    return this.canvas.width;
  }
  get height() {
    return this.canvas.height;
  }
  get helpers() {
    const self = this;
    const { context, scale } = this;
    return {
      *draw(x, y, { style }) {
        const line = new Line(style);
        self.add(new Layer(line, {
          x: x * scale,
          y: y * scale
        }));
        let cord = yield;
        while (cord) {
          line.add((cord.x - x) * scale, (cord.y - y) * scale);
          self.redraw();
          cord = yield;
        }
      },
      *text (x, y, { style }) {
        let string = yield;
        const text = new Text(style);
        self.add(new Layer(text, {
          name: string,
          x: x * scale,
          y: y * scale
        }));
        while (string != 'Enter') {
          if (string == 'Backspace') {
            text.remove(1);
          } else {
            text.add(string);
          }
          self.layers[0].name = text.data;
          self.redraw();
          string = yield;
        }
      },
      *move(x, y) {
        const layer = self.select(x, y);
        if (layer) {
          let cord = yield;
          while (cord) {
            self.move(layer, cord.x - x, cord.y - y);
            x = cord.x;
            y = cord.y;
            cord = yield;
            self.redraw();
          }
        }
      },
      *resize(x, y) {
        const point = self.point(x, y);
        if (point) {
          let cord = yield;
          while (cord) {
            self.resize(point, cord.x - x, cord.y - y);
            x = cord.x;
            y = cord.y;
            cord = yield;
            self.redraw();
          }
          self.focused.recalc();
        }
      }
    };
  }
  add(layer) {
    this.layers.unshift(layer);
    this.redraw();
  }
  select(x, y) {
    x *= this.scale;
    y *= this.scale;
    if (this.focused && this.focused.select(x, y, { expanded: true })) {
      return this.focused;
    }
    return this.layers.find(layer => layer.select(x, y));
  }
  move(layer, rx, ry) {
    layer.x += rx * this.scale;
    layer.y += ry * this.scale;
  }
  point(x, y) {
    const { focused, scale } = this;
    if (x * scale >= focused.x - 10 && x * scale <= focused.x + 10 &&
      y * scale >= focused.y - 10 && y * scale <= focused.y + 10) {
        return 'lt';
    } else if (x * scale >= focused.x + focused.width - 10 && x * scale <= focused.x + focused.width + 10 && 
      y * scale >= focused.y - 10 && y * scale <= focused.y + 10) {
        return 'rt';
    } else if ( x * scale >= focused.x + focused.width - 10 && x * scale <= focused.x + focused.width + 10 && 
      y * scale >= focused.y + focused.height - 10 && y * scale <= focused.y + focused.height + 10) {
        return 'rb';
    } else if (x * scale >= focused.x - 10 && x * scale <= focused.x + 10 &&
      y * scale >= focused.y + focused.height - 10 && y * scale <= focused.y + focused.height + 10) {
        return 'lb';
    }
  }
  focus(index) {
    this.focused = this.layers[index];
    this.redraw();
    return this.focused;
  }
  defocus() {
    this.focused = null;
    this.redraw();
  }
  resize(point, rx, ry) {
    this.focused.resize(point, rx * this.scale, ry * this.scale);
  }
  raise(index) {
    if (index > 0 && index < this.layers.length) {
      [this.layers[index - 1], this.layers[index]] = [this.layers[index], this.layers[index - 1]];
      this.layers = this.layers.slice();
      this.redraw();
    }
  }
  lower(index) {
    if (index >= 0 && index < this.layers.length - 1) {
      [this.layers[index + 1], this.layers[index]] = [this.layers[index], this.layers[index + 1]];
      this.layers = this.layers.slice();
      this.redraw();
    }
  }
  remove(index) {
    if (this.focused == this.layers[index]) { 
      this.focused = null;
    }
    this.layers.splice(index, 1);
    this.redraw();
  }
  drop() {
    this.layers = [];
    this.focused = null;
    this.redraw();
  }
  async conversion(index) {
    await this.layers[index].conversion();
    this.redraw();
  }
  async upload(file) {
    const src = URL.createObjectURL(file);
    const image = Picture.normalize(await Picture.create(src), {
      width: this.width,
      height: this.height
    });
    const picture = new Picture(image);
    this.add(new Layer(picture, {
      name: file.name.slice(0, file.name.lastIndexOf('.'))
    }));
  }
  async redraw() {
    this.context.clearRect(0, 0, this.width, this.height);
    _.forEachRight(this.layers, layer => layer.draw(this.context));
    if (this.focused) {
      this.focused.frame(this.context);
    }
  }
}

export default Drawer;
