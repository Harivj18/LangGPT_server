const multer = require('multer');
const { uploadDir } = require('../utils');
const path = require('path')
const { v4: uuid } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const suffix = uuid();
    const extension = path.extname(file.originalname);
    const fileName = path.basename(file.originalname, extension);
    cb(null, `${fileName}_${suffix}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/csv',
    'application/json',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, Images, TXT, CSV, JSON'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = { upload };