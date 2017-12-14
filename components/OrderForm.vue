<template>
  <div>
    <el-button type="primary" icon="fa fa-paper-plane" @click="dialogFormVisible = true"> Send to the Server </el-button>
    <el-dialog title="Send to the Server" :visible.sync="dialogFormVisible">
      <el-form :model="form">
        <el-form-item label="First name">
          <el-input v-model="form.firstname" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="Last name">
          <el-input v-model="form.lastname" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="Phone number">
          <el-input v-model="form.phone" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="form.email" auto-complete="off"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">Cancel</el-button>
        <el-button type="primary" @click="confirm">Confirm</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
  import axios from 'axios'

  export default {
    name: 'OrderForm',
    props: {
      source: Function
    },
    data() {
      return {
        dialogFormVisible: false,
        form: {
          firstname: '',
          lastname: '',
          phone: '',
          email: '',
        }
      };
    },
    methods: {
      async confirm() {
        try {
          const res = await axios.post('/api/upload', {
            ...this.form,
            source: this.source()
          });
          console.log(this.form);
        } catch (err) {
          console.error(err);
        } 
      }
    }
  };
</script>