<template>
  <el-row type="flex" :gutter="5" id="app" class="stretch">
    <el-col :span="18" class="stretch">
      <div class="tool horizontal space around">
        <el-select :disabled="!onText" v-model="font.family" size="mini">
          <el-option v-for="font in fonts" :key="font" :label="font" :value="font" :style="`font-family: ${font}`" />
        </el-select>
        <el-input-number
          :disabled="!onText && !onDraw"
          v-model="number"
          :min="1"
          size="mini"
        />
        <span class="block title">
          <el-color-picker v-model="color" size="mini"></el-color-picker>
          <span class="title"> Color </span>
        </span>
      </div>
      <el-row type="flex" :gutter="5" class ="grow">
        <el-col :span="2">
          <div class="tool vertical">
            <el-dropdown @command="changeFontType" :hide-on-click="false">
              <el-button type="text" :class="onText && 'selected'" @click="changeMode('text')">
                <i class="fa fa-font"></i> Text
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item :class="font.type.bold && 'selected'" command="bold">
                  <i class="fa fa-bold"></i> Bold
                </el-dropdown-item>
                <el-dropdown-item :class="font.type.italic && 'selected'" command="italic">
                  <i class="fa fa-italic"></i> Italic
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <el-button :class="onDraw && 'selected'" type="text" icon="fa fa-paint-brush" @click="changeMode('draw')"> Draw </el-button>
            <el-button :class="onMove && 'selected'" type="text" icon="fa fa-arrows" @click="changeMode('move')"> Move </el-button>
            <el-button type="text" icon="fa fa-trash" @click="drawer.drop()"> Clear </el-button>
            <!-- <el-button type="text" icon="fa fa-undo" @click="drawer.undo()"> Undo </el-button>
            <el-button type="text" icon="fa fa-repeat" @click="drawer.redo()"> Redo </el-button> -->
          </div>
        </el-col>
        <el-col :span="22">
          <div id="drawer" ref="drawer">
            <canvas id="d2" ref="d2"
              @mousedown="start($event)"
              @mousemove="action($event)"
              @dblclick="focus($event)"
              @mouseup="stop($event)"
              @mouseout="stop($event)">
            </canvas>
          </div>
          <div class="tool horizontal">
            <order-form :source="source" />
          </div>
        </el-col>
      </el-row>
    </el-col>
    <el-col :span="6" class="column">
      <div class="tool horizontal space around">
        <el-button type="text" icon="fa fa-share" @click="cover"> Cover </el-button>
        <el-button type="text" icon="fa fa-pause" @click="animate(false)" v-if="preview.animation"> Pause </el-button>
        <el-button type="text" icon="fa fa-play" @click="animate(true)" v-else> Play </el-button>
        <el-button type="text" icon="fa fa-trash" @click="preview.clear()"> Clear </el-button>
        <span class="block title">
          <el-color-picker v-model="sceneColor" size="mini" @change="changeSceneColor"></el-color-picker>
          <span class="title"> Scene </span>
        </span>
      </div>
      <div id="previewMini" ref="previewMini">
        <canvas id="mini3d" ref="mini3d" @click="show">
          Sorry your browser doesn't seem to support webgl! :(
        </canvas>
      </div>
      <el-dialog
        custom-class="column"
        :visible.sync="dialogVisible"
        :fullscreen="true">
        <span slot="title">
          <order-form :source="source" />
        </span>
        <div id="previewMax" ref="previewMax">
          <canvas id="max3d" ref="max3d"
            @mousedown="grab($event)"
            @mousemove="rotate($event)"
            @mouseup="release($event)">
          </canvas>
        </div>
        <span slot="footer">
          <el-button icon="fa fa-pause" @click="animate(false)" v-if="preview.animation"> Pause </el-button>
          <el-button icon="fa fa-play" @click="animate(true)" v-else> Play </el-button>
          <el-button icon="fa fa-photo" @click="cover"> Cover </el-button>
          <el-button icon="fa fa-trash" @click="preview.clear()"> Clear </el-button>
          <el-button @click="dialogVisible = false"> Cancel </el-button>
        </span>
      </el-dialog>
      <el-upload id="upload" drag action="false" :http-request="empty" :before-upload="upload" :show-file-list="false" accept="image/*">
        <div slot="tip" class="el-upload__tip">jpg/png files with a size less than 500kb</div>
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">Drop file here or
          <em>click to upload</em>
        </div>
      </el-upload>
      <transition-group name="flip-list" tag="ul" class="el-upload-list el-upload-list--picture grow">
        <li v-for="(layer, index) in layers" :key="layer.uid" class="el-upload-list__item" :class="selected == index && 'selected'">
          <img
            :src="layer.type == 'picture' ? layer.src : `../assets/img/${layer.type}.png`"
            :alt="layer.name"
            class="el-upload-list__item-thumbnail"
            @click="choose(index)"
          />
          <div class="name">{{ layer.name }}</div>
          <el-button type="text" icon="fa fa-chevron-up" :disabled="index === 0" @click="raise(index)" />
          <el-button type="text" icon="fa fa-chevron-down" :disabled="index === layers.length - 1" @click="lower(index)" />
          <el-button type="text" icon="fa fa-image" @click="conversion(index)" />
          <i class="el-icon-close" @click="remove(index)"></i>
        </li>
      </transition-group>
    </el-col>
  </el-row>
</template>

<script>
  import Drawer from '../lib/Drawer'
  import Preview from '../lib/Preview'
  import OrderForm from './OrderForm.vue'

  export default {
    name: 'app',
    components: {
      OrderForm
    },
    data() {
      return {
        dialogVisible: false,
        fonts: [
          'Arial',
          'Comic Sans MS',
          'Georgia',
          'Courier New',
          'Impact',
          'Tahoma',
          'Consolas',
          'Times New Roman'
        ],
        font: {
          color: '#ff0000',
          type: {
            bold: false,
            italic: false
          },
          family: 'Arial',
          size: 45
        },
        line: {
          color: '#54d595',
          width: 100
        },
        sceneColor: '#ffffff',
        animation: false,
        mode: 0b0001, /// draw, text, resize, move
        selected: -1,
        preview: {},
        drawer: {},
        layers: []
      }
    },
    watch: {
      'drawer.layers.observable'() {
        this.layers = this.drawer.layers.array;
      }
    },
    computed: {
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
      },
      number: {
        get() {
          return this.onText ? this.font.size : this.line.width;
        },
        set(number) {
          if (this.onText) {
            this.font.size = number;
          } else {
            this.line.width = number;
          }
        }
      },
      color: {
        get() {
          return this.onText ? this.font.color : this.line.color;
        },
        set(color) {
          if (this.onText) {
            this.font.color = color;
          } else {
            this.line.color = color;
          }
        }
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
      changeFontType(name) {
        this.font.type[name] = !this.font.type[name];
      },
      changeMode(mode) {
        switch (mode) {
          case 'draw':
            this.mode = 0b1000;
            this.drawer.defocus();
            this.selected = -1;
            break;
          case 'text':
            this.mode = 0b0100;
            this.drawer.defocus();
            this.selected = -1;
            break;
          case 'resize':
            this.mode = 0b0011;
            break;
          case 'move':
            this.mode = 0b0001;
            this.drawer.defocus();
            this.selected = -1;
            break;
        }
      },
      async upload(file) {
        await this.drawer.upload(file);
        this.drawer.focus(0);
        this.selected = 0;
        this.changeMode('resize');
      },
      cover() {
        this.preview.base64 = this.drawer.source;
      },
      source() {
        return this.drawer.source;
      },
      remove(layer) {
        if (layer == this.selected) {
          this.selected = -1;
        }
        this.drawer.remove(layer);
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
      focus(event) {
        const layer = this.drawer.layer(event.offsetX, event.offsetY);
        this.drawer.focus(layer);
        this.selected = layer;
        this.changeMode('resize');
      },
      conversion(index) {
        this.drawer.conversion(index);
      },
      start(event) {
        if (this.onDraw) {
          return this.mouse = this.drawer.helpers.draw(
            event.offsetX,
            event.offsetY,
            { style: this.line }
          );
        }
        if (this.onText) {
          this.keyboard = this.drawer.helpers.text(
            event.offsetX,
            event.offsetY,
            { style: this.font }
          );
          return this.keyboard.next();
        }
        if (this.onResize) {
          this.mouse = this.drawer.helpers.resize(event.offsetX, event.offsetY);
          if (this.mouse.next().done) {
            this.mouse = this.drawer.helpers.rotate(event.offsetX, event.offsetY);
            if (!this.mouse.next().done) {
              return;
            }
          } else {
            return;
          }
        }
        if (this.onMove) {
          this.mouse = this.drawer.helpers.move(event.offsetX, event.offsetY);
        } 
      },
      action(event) {
        if (this.mouse) {
          this.mouse.next({ x: event.offsetX, y: event.offsetY });
        } else {
          this.hover.next({ x: event.offsetX, y: event.offsetY });
        }
      },
      stop(event) {
        if (this.mouse) {
          this.mouse.next();
          this.mouse = false;
          if (this.onDraw) {
            this.drawer.focus(0);
            this.selected = 0;
            this.changeMode('resize');
          }
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
      show() {
        this.dialogVisible = true;
        if (!this.mirror) {
          this.$nextTick(() => {
            this.mirror = this.preview.mirror(this.$refs.max3d, {
              width: this.$refs.previewMax.clientWidth,
              height: this.$refs.previewMax.clientHeight,
            });
            this.mirror.render();
          });
        }
      },
      empty() {},
    },
    created() {
      document.body.addEventListener('keypress', (event => {
        if (this.onText && this.keyboard) {
          this.keyboard.next(event.key);
        }
      }).bind(this));
      document.body.addEventListener('keydown', (event => {
        if (this.onText && this.keyboard && event.key == 'Backspace') {
          this.keyboard.next(event.key);
        } else if (this.onText && this.keyboard && event.key == 'Enter') {
          this.drawer.focus(0);
          this.selected = 0;
          this.changeMode('resize');
        } else if (this.selected != -1 && event.key == 'Delete') {
          this.drawer.remove(this.selected);
          this.selected = -1;
        }
      }).bind(this));
    },
    mounted() {
      this.drawer = new Drawer(this.$refs.d2, {
        width: this.$refs.drawer.clientWidth,
        height: this.$refs.drawer.clientHeight,
        scale: 2
      });
      this.hover = this.drawer.helpers.hover();
      this.preview = new Preview(this.$refs.mini3d, {
        path: '../assets/models/cup.json',
        width: this.$refs.previewMini.clientWidth,
        height: this.$refs.previewMini.clientHeight,
        sceneColor: this.sceneColor,
        animation: false
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
    padding: 0 5px 5px;
  }
  #app {
    height: 100%;
  }
  #app > * {
    padding: 2.5px 0;
  }
  .column {
    display: flex;
    flex-direction: column;
  }
  .is-fullscreen.column .el-dialog__body {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .stretch {
    display: flex;
    height: 100%;
    align-items: stretch;
  }
  .grow {
    flex-grow: 1
  }
  .el-col.stretch {
    display: flex;
    flex-direction: column;
  }
  .tool .title {
    font-family: Arial;
    font-weight: 500;
    font-size: 14px;
    text-transform: capitalize;
    color: #409EFF;
  }
  .tool.horizontal {
    display: flex;
    align-items: center;
    height: 40px;
  }
  .tool.horizontal > .block.title{
    display: flex;
    align-items: center;
  }
  .space.around {
    justify-content: space-around;
  }
  .tool.vertical {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }
  .tool.vertical > * {
    margin: 0;
  }
  .selected {
    color: #004b96 !important;
  }
  .el-dropdown-menu__item.selected {
    background-color: #D1E7FE !important;
  }
  .selected:hover {
    color: #003263 !important;
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
  .el-color-picker__trigger {
    border: none;
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
  #previewMini {
    border: 1px dashed #d9d9d9;
    height: 33%;
    margin-bottom: 5px;
    cursor: pointer;
    box-sizing: content;
  }
  #previewMini:hover {
    border-color: #409EFF;
  }
  #previewMax {
    flex-grow: 1;
  }
  #drawer {
    margin: auto;
    border: 1px dashed #d9d9d9;
    height: 50%;
  }
  #d2 {
    width: 100%;
    height: 100%;
  }
  .el-upload-list {
    overflow-y: auto;
    overflow-x: hidden;
  }
  .el-upload-list--picture .el-upload-list__item {
    border-radius: 0;
    border: 1px dashed #d9d9d9;
    margin-top: 10px;
    padding: 5px 5px 5px 85px;
    height: 82px;
  }
  .el-upload-list--picture .el-upload-list__item.selected {
    background-color: #D1E7FE;
    border-color: #409EFF;
  }
  .flip-list-move {
    transition: transform .5s;
  }
  *::-webkit-scrollbar{
    width: 10px;
    background-color: white;
  }
  *::-webkit-scrollbar-thumb{
    border-radius: 10px;
    background-color: rgba(0,0,0,.3);
  }
</style>
