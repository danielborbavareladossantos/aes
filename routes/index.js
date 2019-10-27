//natives
const express = require('express');
const router = express.Router();

//controllers
const index_controller = require('../controllers/index');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Cript AES', result: '' });
});

/* POST enviar form. */
router.post('/', (req, res, next) => {
  index_controller.post(req, res, next);
});

module.exports = router;