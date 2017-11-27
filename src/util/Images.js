
class Images {
  static resize(image, width, height, scale = 1) {
    if (image.width * scale > width || image.height * scale > height) {
      const correlation = image.width / image.height;
      if (correlation > 1) {
        image.height = height;
        image.width = height * correlation;
      } else if (correlation < 1) {
        image.width = width;
        image.height = width / correlation;
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

export default Images;
