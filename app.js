const express = require('express');
const multer  = require('multer');
const bodyParser = require('body-parser')

const app = express();

const upload = require('./api/upload');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/dist', express.static('dist'));
app.use('/assets', express.static('assets'));

app.get('/', (req, res) => {
  res.sendFile('E:/Kyrylo/studing/3dcup/index.html');
});

app.use('/api/upload', upload);

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json([{
    message: err.message
  }]);
});

app.listen(3000, () => {
  console.log('Server listen on port 3000!');
});