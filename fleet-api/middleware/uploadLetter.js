const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for generated letter PDFs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const letterheadId = req.params.id || 'temp';
    const uploadDir = path.join(__dirname, '../../public/letters', letterheadId);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `letter-${uniqueSuffix}.pdf`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB max file size
  }
});

module.exports = upload;
