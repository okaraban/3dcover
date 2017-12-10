const { Router } = require('express');
const router = Router();
const {extname} = require('path');
const crypto = require('crypto');
const multer = require('multer');
const storage = multer.diskStorage({
  destination: './uploads/',
  filename(req, file, cb) {
    crypto.pseudoRandomBytes(16, (err, raw) => {
      if (err) return cb(err)
      cb(null, raw.toString('hex') + extname(file.originalname))
    })
  }
});
const upload = multer({storage});

router.post('/', (req, res, next) => {
  console.log(req.body);
  res.json(req.file);
});

module.exports = router;