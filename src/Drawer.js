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
  get base64() {
    return this.layering.source();
  }
  get width() {
    return this.canvas.width;
  }
  get height() {
    return this.canvas.height;
  }
  get do() {
    const self = this;
    const { context, scale, layering } = this;
    return {
      async *draw(x, y) {
        const line = new Line(context, { scale });
        line.start(x, y);
        let cord = yield;
        while (cord) {
          line.draw(cord.x, cord.y);
          cord = yield;
        }
        layering.new(await line.toLayer());
      },
      *move(x, y) {
        const layer = layering.select(x, y);
        if (layer) {
          let cord = yield;
          while (cord) {
            layer.x += (cord.x - x) * scale;
            layer.y += (cord.y - y) * scale;
            x = cord.x;
            y = cord.y;
            cord = yield;
            self.redraw();
          }
        }
      },
      *resize(x, y) {
        const point = layering.point(x, y);
        if (point) {
          const layer = self.layers[self.focused];
          let cord = yield;
          while (cord) {
            switch (point) {
              case 'rb':
                layer.image.width += (cord.x - x) * scale;
                layer.image.height += (cord.y - y) * scale;
              break;
              case 'lb':
                layer.image.width -= (cord.x - x) * scale;
                layer.image.height += (cord.y - y) * scale;
                layer.x += (cord.x - x) * scale;
              break;
              case 'rt':
                layer.image.width += (cord.x - x) * scale;
                layer.image.height -= (cord.y - y) * scale;
                layer.y += (cord.y - y) * scale;
              break;
              case 'lt':
                layer.image.width -= (cord.x - x) * scale;
                layer.image.height -= (cord.y - y) * scale;
                layer.x += (cord.x - x) * scale;
                layer.y += (cord.y - y) * scale;
              break;
            }
            x = cord.x;
            y = cord.y;
            cord = yield;
            self.redraw();
          }
        }
      }
    };
  }
  get layering() {
    const self = this;
    const { layers, scale } = this;
    return {
      isSelected(layer, x, y) {
        return x * scale >= layer.x && 
          x * scale <= layer.x + layer.image.width &&
          y * scale >= layer.y &&
          y * scale <= layer.y + layer.image.height;
      },
      select(x, y) {
        /*if (self.focused != null && this.isSelected(self.focused, x, y)) {
          return self.focused;
        }*/
        return layers.find(layer => this.isSelected(layer, x, y));
      },
      point(x, y) {
        const layer = layers[self.focused];
        if (x * scale >= layer.x - 10 && x * scale <= layer.x + 10 &&
          y * scale >= layer.y - 10 && y * scale <= layer.y + 10) {
            return 'lt';
        } else if (x * scale >= layer.x + layer.image.width - 10 && x * scale <= layer.x + layer.image.width + 10 && 
          y * scale >= layer.y - 10 && y * scale <= layer.y + 10) {
            return 'rt';
        } else if ( x * scale >= layer.x + layer.image.width - 10 && x * scale <= layer.x + layer.image.width + 10 && 
          y * scale >= layer.y + layer.image.height - 10 && y * scale <= layer.y + layer.image.height + 10) {
            return 'rb';
        } else if (x * scale >= layer.x - 10 && x * scale <= layer.x + 10 &&
          y * scale >= layer.y + layer.image.height - 10 && y * scale <= layer.y + layer.image.height + 10) {
            return 'lb';
        }
      },
      focus(layer) {
        self.focused = layer;
        self.redraw();
      },
      defocus() {
        self.focused = null;
        self.redraw();
      },
      raise(layer) {
        if (layer > 0 && layer < layers.length) {
          [layers[layer - 1], layers[layer]] = [layers[layer], layers[layer - 1]];
          if (self.focused == layer) {
            self.focused -= 1;
          } else if (self.focused == layer - 1) {
            self.focused += 1;
          }
          self.layers = self.layers.slice();
          this.redraw();
        }
      },
      lower(layer) {
        if (layer >= 0 && layer < layers.length - 1) {
          [layers[layer + 1], layers[layer]] = [layers[layer], layers[layer + 1]];
          if (self.focused == layer) {
            self.focused += 1;
          } else if (self.focused == layer + 1) {
            self.focused -= 1;
          }
          self.layers = self.layers.slice();
          this.redraw();
        }
      },
      remove(layer) {
        layers.splice(layer, 1);
        if (self.focused == layer) {
          self.focused = null;
        }
        self.redraw();
      },
      new(layer) {
        layers.unshift(layer);
        self.redraw();
      },
      source() {
        const canvas = new Canvas(self.width, self.height);
        const context = canvas.getContext();
        _.forEachRight(self.layers, layers => {
          context.drawImage(layers.image, layers.x, layers.y, layers.image.width, layers.image.height);
        });
        return canvas.toDataURL();
      }
    }
  }
  async upload(file) {
    const src = URL.createObjectURL(file);
    const image = await Images.create(src);
    this.layering.new(new Layer({
      name: file.name.slice(0, file.name.lastIndexOf('.')),
      image: Images.resize(image, this.width, this.height, this.scale)
    }));
    if (this.focused != null) {
      this.focused += 1;
    }
  }
  async redraw() {
    this.context.clearRect(0, 0, this.width, this.height);
    _.forEachRight(this.layers, ({ image, x, y }) => {
      this.context.drawImage(image, x, y, image.width, image.height);
    });
    if (this.focused != null) {
      const { x, y, image } = this.layers[this.focused];
      this.context.fillRect(x - 10, y - 10, 20, 20);
      this.context.fillRect(x + image.width - 10, y - 10, 20, 20);
      this.context.fillRect(x + image.width - 10, y + image.height - 10, 20, 20);
      this.context.fillRect(x - 10, y + image.height - 10, 20, 20);
    }
  }
}

export default Drawer;
