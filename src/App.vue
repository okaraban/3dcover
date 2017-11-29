<template @keyup="test">
    <el-row type="flex" :gutter="5" id="app">
      <el-col :span="6">
        <el-upload id="upload" drag action="false" :http-request="empty" :before-upload="upload" :show-file-list="false" accept="image/*">
          <div slot="tip" class="el-upload__tip">jpg/png files with a size less than 500kb</div>
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">Drop file here or
            <em>click to upload</em>
          </div>
        </el-upload>
        <transition-group name="flip-list" tag="ul" class="el-upload-list el-upload-list--picture">
          <li class="el-upload-list__item is-success" v-for="(layer, index) in layers" :key="layer.uid">
            <img v-if="layer.type == 'image'" :src="layer.data.src" :alt="layer.name" class="el-upload-list__item-thumbnail">
            <div class="name">{{ layer.name }}</div>
            <el-button type="text" :class="selected == index && 'selected'" icon="fa fa-crosshairs" @click="choose(index)"></el-button>
            <el-button type="text" icon="fa fa-chevron-up" :disabled="index === 0" @click="raise(index)"></el-button>
            <el-button type="text" icon="fa fa-chevron-down" :disabled="index === layers.length - 1" @click="lower(index)"></el-button>
            <i class="el-icon-close" @click="remove(index)"></i>
          </li>
        </transition-group>
      </el-col>
      <el-col :span="18">
        <el-row type="flex" :gutter="5" style="height: 35%">
          <el-col :span="22">
            <div id="drawer" ref="drawer">
              <canvas id="d2" ref="d2"
                @mousedown="start($event)"
                @mousemove="action($event)"
                @mouseup="stop($event)"
                @mouseout="stop($event)">
              </canvas>
            </div>
          </el-col>
          <el-col :span="2">
            <div class="tools">
              <el-button :class="onDraw && 'selected'" type="text" icon="fa fa-paint-brush" @click="changeMode('draw')"> Draw </el-button>
              <span class="title">Width</span>
              <el-input-number v-model="line.width" controls-position="right" :min="1" size="mini" @change="width()"></el-input-number>
              <span class="title">Color</span>
              <el-color-picker v-model="line.style" size="mini" @change="style()"></el-color-picker><!--/// draw, text, resize, move-->
              <el-button :class="onMove && 'selected'" type="text" icon="fa fa-arrows" @click="changeMode('move')"> Move </el-button>
              <el-button :class="onText && 'selected'" type="text" icon="fa fa-font" @click="changeMode('text')"> Text </el-button>
              <el-button type="text" icon="fa fa-photo" @click="cover"> Cover </el-button>
              <el-button type="text" icon="fa fa-trash" @click="drawer.drop()"> Clear </el-button>
            </div>
          </el-col>
        </el-row>
        <el-row type="flex" :gutter="5" style="height: 65%">
          <el-col :span="22" style="padding-top: 5px">
            <div id="preview" ref="preview">
              <canvas id="d3" ref="d3"
                @mousedown="grab($event)"
                @mousemove="rotate($event)"
                @mouseup="release($event)"></canvas>
            </div>
          </el-col>
          <el-col :span="2">
            <div class="tools">
              <el-button type="text" icon="fa fa-pause" @click="animate(false)" v-if="preview.animation"> Pause </el-button>
              <el-button type="text" icon="fa fa-play" @click="animate(true)" v-else> Play </el-button>
              <el-button type="text" icon="fa fa-trash" @click="preview.clear()"> Clear </el-button>
              <span class="title"> Model </span>
              <el-color-picker v-model="baseColor" size="mini" @change="changeBaseColor"></el-color-picker>
              <span class="title">Scene</span>
              <el-color-picker v-model="sceneColor" size="mini" @change="changeSceneColor"></el-color-picker>
            </div>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
</template>

<script>
  import Drawer from './Drawer'
  import Preview from './Preview'

  export default {
    name: 'app',
    data() {
      return {
        line: {
          style: '#54d595',
          width: 3
        },
        baseColor: '#ffffff',
        sceneColor: '#ffffff',
        animation: false,
        mode: 1, /// draw, text, resize, move
        selected: -1,
        preview: {},
        drawer: {}
      }
    },
    computed: {
      layers() {
        return this.drawer.layers;
      },
      onDraw() {
        return this.mode & 0b1000;
      },
      onText() {
        return this.mode & 0b0100;
      },
      onResize() {
        return this.mode & 0b0010;
      },
      onMove() {
        return this.mode & 0b0001;
      }
    },
    methods: {
      animate(animation) {
        this.preview.animation = this.animation = animation;
      },
      changeBaseColor() {
        this.preview.baseColor = this.baseColor;
      },
      changeSceneColor() {
        this.preview.sceneColor = this.sceneColor;
      },
      changeMode(mode) {
        switch (mode) {
          case 'draw':
            this.mode = 0b1000;
            break;
          case 'text':
            this.mode = 0b0100;
            break;
          case 'resize':
            this.mode = 0b0011;
            break;
          case 'move':
            this.mode = 0b0001;
            break;
        }
      },
      style() {
        this.drawer.line.style = this.line.style;
      },
      width() {
        this.drawer.line.width = this.line.width;
      },
      upload(file) {
        this.drawer.upload(file);
      },  
      remove(layer) {
        this.drawer.remove(layer);
      },
      cover() {
        this.preview.base64 = this.drawer.source;
      },
      raise(layer) {
        if (this.selected == layer) {
          this.selected -= 1;
        } else if (this.selected + 1 == layer) {
          this.selected += 1;
        }
        this.drawer.raise(layer);
      },
      lower(layer) {
        if (this.selected == layer) {
          this.selected += 1;
        } else if (this.selected - 1 == layer) {
          this.selected -= 1;
        }
        this.drawer.lower(layer);
      },
      choose(layer) {
        if (this.selected == layer) {
          this.drawer.defocus(layer);
          this.selected = -1;
          this.changeMode('move');
        } else {
          this.drawer.focus(layer);
          this.selected = layer;
          this.changeMode('resize');
        }
      },
      start(event) {
        if (this.onDraw) {
          return this.mouse = this.drawer.helpers.draw(event.offsetX, event.offsetY);
        }
        if (this.onText) {
          this.keyboard = this.drawer.helpers.text(event.offsetX, event.offsetY);
          return this.keyboard.next();
        }
        if (this.onResize) {
          this.mouse = this.drawer.helpers.resize(event.offsetX, event.offsetY);
          if (!this.mouse.next().done)
            return
        }
        if (this.onMove) {
          this.mouse = this.drawer.helpers.move(event.offsetX, event.offsetY);
        }
      },
      action(event) {
        if (this.mouse) {
          this.mouse.next({ x: event.offsetX, y: event.offsetY });
        }
      },
      stop(event) {
        if (this.mouse) {
          this.mouse.next();
          this.mouse = false;
        }
      },
      grab(event) {
        this.preview.animation = false;
        this.rotating = this.preview.do.rotate(0, event.offsetX);
      },
      rotate(event) {
        if (this.rotating)
          this.rotating.next({ x: 0, y: event.offsetX });
      },
      release(event) {
        this.rotating.next();
        this.rotating = false;
        setTimeout(() => {
          this.preview.animation = this.animation;
        }, 1500);
      },
      empty() {}
    },
    created() {
      document.body.addEventListener('keypress', (event => {
        if (this.onText && this.keyboard) {
          console.log(event);
          this.keyboard.next(event.key);
        }
      }).bind(this));
    },
    mounted() {
      this.drawer = new Drawer(this.$refs.d2, {
        width: this.$refs.drawer.clientWidth,
        height: this.$refs.drawer.clientHeight,
        scale: 2
      });
      this.drawer.line.style = this.line.style;
      this.drawer.line.width = this.line.width;
      this.preview = new Preview(this.$refs.d3, {
        path: './src/assets/models/cup.json',
        width: this.$refs.preview.clientWidth - this.$refs.preview.style.paddingLeft - this.$refs.preview.style.paddingLeft,
        height: this.$refs.preview.clientHeight - this.$refs.preview.style.paddingBottom - this.$refs.preview.style.paddingTop,
        sceneColor: this.sceneColor,
        modelColor: this.baseColor,
        animation: false
      });
      this.preview.render();
    }
  }
</script>

<style>
  .selected, .selected:focus {
    color: #004b96;
  }
  .selected:hover {
    color: #003263;
  }
  .name {
    white-space: nowrap;
    font-family: Open Sans,Arial,sans-serif;
    font-weight: 400;
    font-size: 14px;
    padding-right: 15px;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  * {
    box-sizing: border-box;
  }
  html,
  body {
    height: 100%;
    margin: 0;
  }
  body {
    padding: 5px;
  }
  .tools > * {
    display: block !important;
    margin-right: 0 !important;
    margin-left: 0 !important;
    text-align: center;
  }
  .tools .el-button {
    width: 100%;
  }
  .tools .title {
    font-family: Arial;
    font-weight: 500;
    font-size: 14px;
    color: #409EFF;
  }
  .tools .el-color-picker {
    padding: 0 auto;
  }
  .tools .el-color-picker__trigger {
    border: none;
  }
  #app {
    height: 100%;
  }
  #app > * {
    padding: 2.5px 0;
  }
  .stretch {
    height: 100%;
    align-items: stretch;
  }
  #upload>.el-upload,
  #upload>.el-upload>.el-upload-dragger {
    width: 100%;
  }
  #upload>.el-upload>.el-upload-dragger {
    border-radius: 0;
    width: 100%;
    height: auto;
    padding: 5px;
  }
  #upload .el-upload-dragger .el-icon-upload {
    font-size: 40px;
    margin: 0;
  }
  #drawer, #preview {
    border: 1px dashed #d9d9d9;
    height: 100%;
  }
  #d2 {
    width: 100%;
    height: 100%;
  }
  .el-upload-list--picture .el-upload-list__item {
    border-radius: 0;
  }
  .el-upload-list--picture .el-upload-list__item {
    margin-top: 10px;
    padding: 5px 5px 5px 85px;
    height: 82px;
  }
  .el-input-number {
    width: 80%;
    margin: 3px auto 10px auto !important;
  }
  .el-input-number.is-controls-right .el-input__inner {
    padding-left: 5px;
    padding-right: 35px;
  }
  .flip-list-move {
    transition: transform .5s;
  }
</style>
