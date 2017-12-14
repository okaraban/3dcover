const { Router } = require('express');
const router = Router();
const Mailer = require('../utils/Mailer');
const { extname } = require('path');
const crypto = require('crypto');
const multer = require('multer');
const storage = multer.diskStorage({
  destination: './uploads/',
  filename(req, file, cb) {
      cb(null, `${crypto.randomBytes(8).toString('base64')}.${Date.now()}.${extname(file.originalname)}`)
  }
});
const upload = multer({ storage });

router.post('/', (req, res, next) => {
  const { email, firstname, lastname } = req.body;
  Mailer.send({
    to: email,
    template: 'thanks',
    data: {
      firstname,
      lastname,
      src: 'https://pp.userapi.com/c834202/v834202137/205e7/NLQOhtWzD9k.jpg'
    }
  });
  console.log(req.body);
  res.json(req.file);
});

module.exports = router;