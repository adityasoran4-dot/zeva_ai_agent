// lib/upload.ts
import multer from 'multer';

const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '')}`);
  }
});

export const upload = multer({ storage });
