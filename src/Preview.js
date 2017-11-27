import * as THREE from 'three'

class Preview {
  constructor(canvas, { path, width, height, sceneColor, modelColor, animation } = {}) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setClearColor(sceneColor);
    this.renderer.setSize(width, height);
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0xffffff, .4));
    this.scene.add(new THREE.PointLight(0xffffff, .5));
    this.camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    const loader = new THREE.JSONLoader();
    loader.load(path, (geometry) => {
      this.materials = [new THREE.MeshLambertMaterial({
        color: modelColor,
        side: THREE.DoubleSide
      })]
      this.mesh = new THREE.Mesh(geometry, this.materials);
      this.mesh.scale.x = this.mesh.scale.y = this.mesh.scale.z = .8;
      this.mesh.translation = geometry.center();
      this.mesh.rotation.x = .4;
      this.mesh.position.z = -7;
      this.scene.add(this.mesh);
    });
    this.animation = animation;
  }
  get dom() {
    return this.renderer.domElement;
  }
  set picture (path) {
    const texture = new THREE.TextureLoader().load(path);
    this.front = texture;
  }
  set base64 (src) {
    const image = new Image();
    image.src = src;
    const texture = new THREE.Texture();
    texture.image = image;
    image.onload = () => {
      texture.needsUpdate = true;
    };
    this.front = texture;
  }
  set front (texture) {
    texture.offset.set(0, -.38);
    texture.repeat.set(1, .75);
    const material = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true
    });
    this.materials[1] = material;
  }
  set base (color) {
    const material = new THREE.MeshLambertMaterial({
      color: color,
      side: THREE.DoubleSide
    });
    this.materials[0] = material;
  }
  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  rotate({ x = 0, y = 0 }) {
    this.mesh.rotation.x += x;
    this.mesh.rotation.y += y;
  }
  animate() {
    if (this.mesh) {
      this.rotate({ y: .02 })
    }
  }
  render() {
    this.renderer.render(this.scene, this.camera);
    if (this.animation) {
      this.animate();
    }
    requestAnimationFrame(this.render.bind(this));
  }
}

export default Preview;
