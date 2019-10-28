//natives
const express = require('express');
const router = express.Router();

const multer  = require('multer');
const multerConfig = require('../config/multer');

var upload = multer(multerConfig);

//controllers
const index_controller = require('../controllers/index');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Cript AES', result: '' });
});

/* POST enviar form. */
router.post('/', upload.single('arquivo'), index_controller.post);

module.exports = router;