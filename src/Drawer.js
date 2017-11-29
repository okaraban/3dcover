import _ from 'lodash'
import Layer from './util/Layer.js'
import Line from './util/Line.js'
import Images from './util/Images.js'
import Canvas from './util/Canvas'

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
    this.context.font = '48px serif';
    this.context.lineCap = 'round',
    this.context.lineJoin = 'round',
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
      set style(style) {
        context.strokeStyle = style;
      },
      get style() {
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
  get canvas() {
    return this.context.canvas
  }
  get source() {
    const clone = Canvas.clone(this.context);
    _.forEachRight(this.layers, layer => {
      if (layer.type == 'image' ) {
        clone.drawImage(layer.data, layer.x, layer.y, layer.width, layer.height);
      } else {
        clone.fillText(layer.data, layer.x, layer.y);
      }
    });
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
      async *draw(x, y) {
        const line = new Line(context, { scale });
        line.start(x, y);
        let cord = yield;
        while (cord) {
          line.draw(cord.x, cord.y);
          cord = yield;
        }
        self.add(await line.toLayer());
      },
      *text (x, y) {
        let string = yield;
        self.add(new Layer(string, {
          type: 'text',
          name: string,
          x: x * scale,
          y: y * scale
        }));
        while (string) {
          const m = self.context.measureText(string);
          self.layers[0].width = m.width;
          self.layers[0].height = 48;
          self.layers[0].data = string;
          self.layers[0].name = string;
          self.redraw();
          string += yield;
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
        }
      }
    };
  }
  add(layer) {
    this.layers.unshift(layer);
    this.redraw();
  }
  select(x, y) {
    return [this.focused, ...this.layers].find(layer => {
      if (layer) {
        return x * this.scale >= layer.x && 
        x * this.scale <= layer.x + layer.width &&
        y * this.scale >= layer.y &&
        y * this.scale <= layer.y + layer.height;
      }
    });
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
  }
  defocus() {
    this.focused = null;
    this.redraw();
  }
  resize(point, rx, ry) {
    rx *= this.scale;
    ry *= this.scale;
    switch (point) {
      case 'rb':
        this.focused.width += rx;
        this.focused.height += ry;
      break;
      case 'lb':
        this.focused.width -= rx;
        this.focused.height += ry;
        this.focused.x += rx;
      break;
      case 'rt':
        this.focused.width += rx;
        this.focused.height -= ry;
        this.focused.y += ry;
      break;
      case 'lt':
        this.focused.width -= rx;
        this.focused.height -= ry;
        this.focused.x += rx;
        this.focused.y += ry;
      break;
    }
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
    this.layers.splice(index, 1);
    if (this.focused == this.layers[index]) {
      this.focused = null;
    }
    this.redraw();
  }
  async upload(file) {
    const src = URL.createObjectURL(file);
    const image = await Images.create(src);
    this.add(new Layer(Images.resize(image, this.width, this.height, this.scale), {
      name: file.name.slice(0, file.name.lastIndexOf('.'))
    }));
  }
  async redraw() {
    this.context.clearRect(0, 0, this.width, this.height);
    _.forEachRight(this.layers, layer => {
      if ( layer.type == 'image' ) {
        this.context.drawImage(layer.data, layer.x, layer.y, layer.width, layer.height);
      } else {
        this.context.fillText(layer.data, layer.x, layer.y);
      }
    });
    if (this.focused) {
      this.context.fillRect(this.focused.x - 10, this.focused.y - 10, 20, 20);
      this.context.fillRect(this.focused.x + this.focused.width - 10, this.focused.y - 10, 20, 20);
      this.context.fillRect(this.focused.x + this.focused.width - 10, this.focused.y + this.focused.height - 10, 20, 20);
      this.context.fillRect(this.focused.x - 10, this.focused.y + this.focused.height - 10, 20, 20);
    }
  }
}

export default Drawer;
