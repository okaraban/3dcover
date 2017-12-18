import _ from 'lodash'
import Layer from './Layer'
import Line from './Line'
import Text from './Text'
import Picture from './Picture'
import Canvas from './Canvas'
import { History, Event } from './History'
import { List } from './List'
import { setTimeout } from 'timers';

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
    this.layers = new List();
    this.history = new History(this);
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
    this.layers.forEachRight(layer => layer.draw(clone));
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
        const layer = new Layer(line, {
          x: x * scale,
          y: y * scale
        });
        self.add(layer);
        let cord = yield;
        while (cord) {
          line.add((cord.x - x) * scale, (cord.y - y) * scale);
          self.redraw();
          cord = yield;
        }
        self.history.save(new Event({
          up() {
            this.layers.unshift(layer);
          },
          down() {
            this.layers.shift();
          }
        }));
      },
      *text (x, y, { style }) {
        let string = yield;
        const text = new Text(style);
        const layer = new Layer(text, {
          name: string,
          x: x * scale,
          y: y * scale
        });
        self.add(layer);
        while (string != 'Enter') {
          if (string == 'Backspace') {
            text.remove(1);
          } else {
            text.add(string);
          }
          self.layers.get(0).name = text.data;
          self.redraw();
          string = yield;
        }
        self.history.save(new Event({
          up() {
            this.layers.unshift(layer);
          },
          down() {
            this.layers.shift();
          }
        }));
      },
      *move(x, y) {
        const layer = self.select(x, y);
        if (layer) {
          const old = { x: layer.x, y: layer.y };
          let cord = yield;
          while (cord) {
            self.move(layer, cord.x - x, cord.y - y);
            x = cord.x;
            y = cord.y;
            cord = yield;
            self.redraw();
          }
          const current = { x: layer.x, y: layer.y };
          self.history.save(new Event({
            up() {
              layer.x = current.x;
              layer.y = current.y;
            },
            down() {
              layer.x = old.x;
              layer.y = old.y;
            }
          }));
        }
      },
      *resize(x, y) {
        const point = self.point(x, y);
        if (point) {
          const old = {
            x: self.focused.x,
            y: self.focused.y,
            width: self.focused.width,
            height: self.focused.height
          };
          let cord = yield;
          while (cord) {
            self.resize(point, cord.x - x, cord.y - y);
            x = cord.x;
            y = cord.y;
            cord = yield;
            self.redraw();
          }
          const current = {
            x: self.focused.x,
            y: self.focused.y,
            width: self.focused.width,
            height: self.focused.height
          };
          self.focused.recalc();
          self.history.save(new Event({
            up() {
              self.focused.x = old.x;
              self.focused.y = old.y;
              self.focused.width = old.width;
              self.focused.height = old.width;
              self.focused.recalc();
            },
            down() {
              self.focused.x = current.x;
              self.focused.y = current.y;
              self.focused.width = current.width;
              self.focused.height = current.width;
              self.focused.recalc();
            }
          }));
        }
      }
    };
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
    this.focused = this.layers.get(index);
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
    this.layers.swap(index - 1, index);
    this.redraw();
  }
  lower(index) {
    this.layers.swap(index, index + 1);
    this.redraw();
  }
  add(layer) {
    this.layers.unshift(layer);
    this.redraw();
  }
  remove(index) {
    if (this.focused == this.layers.get(index)) { 
      this.focused = null;
    }
    const layer = this.layers.remove(index);
    this.redraw();
    this.history.save(new Event({
      up() {
        this.layers.remove(index);
      },
      down() {
        this.layers.add(layer, index);
      }
    }));
  }
  drop() {
    this.layers.drop();
    this.focused = null;
    this.redraw();
  }
  undo() {
    this.history.undo();
    this.redraw();
  }
  redo() {
    this.history.redo();
    this.redraw();
  }
  async conversion(index) {
    await this.layers.get(index).conversion();
    this.redraw();
  }
  async upload(file) {
    const src = URL.createObjectURL(file);
    const image = await Picture.load(src);
    const picture = new Picture(Picture.normalize(image, { width: this.width, height: this.height }));
    const layer = new Layer(picture, {
      name: file.name.slice(0, file.name.lastIndexOf('.'))
    });
    this.add(layer);
    this.history.save(new Event({
      up() {
        this.layers.unshift(layer);
      },
      down() {
        this.layers.shift();
      }
    }));
  }
  async redraw() {
    this.context.clearRect(0, 0, this.width, this.height);
    this.layers.forEachRight(layer => {
      layer.draw(this.context)
    });
    if (this.focused) {
      this.focused.frame(this.context);
    }
  }
}

export default Drawer;
