import Canvas from './Canvas'
import Layer from './Layer'

class Text {
  constructor(context, { scale, font, color, width, style}) {
    this.text = '';
    this.context = context;
    this.scale = scale;
  }
  print(string) {
    string 
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

export default Text;
