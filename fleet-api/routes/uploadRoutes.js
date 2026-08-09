const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');

const sanitize = (str) => str.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { vehicleName, plateNumber } = req.body;
        const folderName = sanitize(`${plateNumber || 'unknown'}_${vehicleName || 'vehicle'}`);
        const uploadDir = path.join(__dirname, '..', 'uploads', folderName);
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-');
        const ext = path.extname(file.originalname) || '.jpg';
        const baseName = sanitize(path.basename(file.originalname, ext)) || 'file';
        cb(null, `${baseName}_${timestamp}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf)$/i;
    if (allowed.test(path.extname(file.originalname))) {
        cb(null, true);
    } else {
        cb(new Error('Only image and PDF files are allowed'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', authenticate, (req, res, next) => {
    console.log('[Upload] Incoming request, content-type:', req.headers['content-type']);
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('[Upload] Multer error:', err.message);
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            console.warn('[Upload] No file in request. Body keys:', Object.keys(req.body));
            return res.status(400).json({ message: 'No file uploaded' });
        }
        console.log('[Upload] File saved:', { filename: req.file.filename, size: req.file.size, dest: req.file.destination });
        const relativePath = req.file.path.split('uploads')[1].replace(/\\/g, '/');
        const fileUrl = `/uploads${relativePath}`;
        res.status(201).json({
            message: 'File uploaded successfully',
            fileUrl,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
        });
    });
});

router.post('/multiple', authenticate, upload.array('files', 5), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }
    const files = req.files.map((f) => {
        const relativePath = f.path.split('uploads')[1].replace(/\\/g, '/');
        return {
            fileUrl: `/uploads${relativePath}`,
            fileName: f.filename,
            originalName: f.originalname,
            size: f.size,
        };
    });
    res.status(201).json({ message: 'Files uploaded successfully', files });
});

module.exports = router;
