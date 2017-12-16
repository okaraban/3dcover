import Vue from 'vue'
import Vuelidate from 'vuelidate'
import ElementUI from 'element-ui'
import App from './components/App.vue'
import locale from 'element-ui/lib/locale/lang/en'

import 'element-ui/lib/theme-chalk/index.css'
import './assets/css/font-awesome.css'

Vue.use(Vuelidate)
Vue.use(ElementUI, { locale })

const vue = new Vue({
  el: '#app',
  render: h => h(App)
})
