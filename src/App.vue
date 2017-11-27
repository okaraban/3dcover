<template>
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
            <img :src="layer.image.src" :alt="layer.name" class="el-upload-list__item-thumbnail">
            <div>{{ layer.name }}</div>
            <el-button type="text" icon="fa fa-crosshairs" @click="choose(index)"></el-button>
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
                @mousedown="mousedown($event)"
                @mousemove="mousemove($event)"
                @mouseup="mouseup($event)">
              </canvas>
            </div>
          </el-col>
          <el-col :span="2">
            <div class="tools">
              <el-button type="text" icon="fa fa-paint-brush" @click="changeMode('draw')"> Draw </el-button>
              <span class="title">Width</span>
              <el-input-number v-model="line.width" controls-position="right" :min="1" size="mini" @change="width()"></el-input-number>
              <span class="title">Color</span>
              <el-color-picker v-model="line.style" size="mini" @change="style()"></el-color-picker>
              <el-button type="text" icon="fa fa-arrows" @click="changeMode('move')">  Move </el-button>
              <el-button type="text" icon="fa fa-photo" @click="print"> Cover </el-button>
              <el-button type="text" icon="fa fa-trash" @click="print"> Clear </el-button>
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
              <el-button type="text" icon="fa fa-pause" @click="animation(false)" v-if="preview.animation"> Pause </el-button>
              <el-button type="text" icon="fa fa-play" @click="animation(true)" v-else="preview.animation"> Play </el-button>
              <el-button type="text" icon="fa fa-trash" @click="print"> Clear </el-button>
              <span class="title">Model</span>
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
        modes: {
          move: true,
          resize: false,
          draw: false
        },
        onAction: false,
        selected: -1,
        preview: {},
        drawer: {}
      }
    },
    computed: {
      layers() {
        return this.drawer.layers;
      }
    },
    methods: {
      animation(animation) {
        this.preview.animation = animation;
      },
      changeBaseColor() {
        this.preview.baseColor = this.baseColor;
      },
      changeSceneColor() {
        this.preview.sceneColor = this.sceneColor;
      },
      changeMode(mode) {
        this.modes[mode] = true;
        if (mode == 'draw') {
          this.modes.move = false;
        } else {
          this.modes.draw = false; 
        }
      },
      style() {
        this.drawer.line = { style: this.line.style };
      },
      width() {
        this.drawer.line = { width: this.line.width };
      },
      upload(file) {
        this.drawer.upload(file);
      },
      remove(layer) {
        this.drawer.layering.remove(layer);
      },
      print() {
        this.preview.base64 = this.drawer.base64;
      },
      raise(layer) {
        this.drawer.layering.raise(layer);
      },
      lower(layer) {
        this.drawer.layering.lower(layer);
      },
      choose(layer) {
        this.drawer.layering.focus(layer);
        this.modes.resize = true;
      },
      mousedown(event) {
        if (this.modes.draw) {
          return this.drawing = this.drawer.do.draw(event.offsetX, event.offsetY);
        }
        if (this.modes.resize) {
          this.resizing = this.drawer.do.resize(event.offsetX, event.offsetY);
        }
        if (this.modes.move) {
          this.moving = this.drawer.do.move(event.offsetX, event.offsetY);
        }
      },
      mousemove(event) {
        if (this.drawing) {
          this.drawing.next({ x: event.offsetX, y: event.offsetY });
        }
        if (this.resizing) {
          this.resizing.next({ x: event.offsetX, y: event.offsetY });
        }
        if (this.moving) {
          this.moving.next({ x: event.offsetX, y: event.offsetY });
        }
      },
      mouseup(event) {
        if (this.modes.draw) {
          this.drawing.next();
          this.drawing = false;
        }
        if (this.modes.resize) {
          this.resizing.next();
          return this.resizing = false;
        }
        if (this.modes.move) {
          this.moving.next();
          this.moving = false;
        }
      },
      grab(event) {

      },
      empty() {}
    },
    mounted() {
      this.drawer = new Drawer(this.$refs.d2, {
        width: this.$refs.drawer.clientWidth,
        height: this.$refs.drawer.clientHeight,
        scale: 2
      });
      this.drawer.line = this.line;
      this.preview = new Preview(this.$refs.d3, {
        path: './src/assets/models/cup.json',
        width: this.$refs.preview.clientWidth - this.$refs.preview.style.paddingLeft - this.$refs.preview.style.paddingLeft,
        height: this.$refs.preview.clientHeight - this.$refs.preview.style.paddingBottom - this.$refs.preview.style.paddingTop,
        sceneColor: this.sceneColor,
        modelColor: this.baseColor,
        animation: true
      });
      this.preview.render();
    }
  }
</script>

<style>
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
    font weight: 500;
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
