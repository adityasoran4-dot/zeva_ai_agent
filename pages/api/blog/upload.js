import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Formidable v3 uses promise-based API
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      filename: (name, ext, part) => {
        const timestamp = Date.now();
        const originalName = part.originalFilename || 'image';
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        return `${timestamp}-${sanitizedName}`;
      },
    });

    // Parse the form - formidable v3 returns a promise
    const [fields, files] = await form.parse(req);

    try {
      // Handle formidable v3 file structure
      // In v3, files can be an array or a single file object
      let file;
      if (files.file) {
        if (Array.isArray(files.file)) {
          file = files.file[0];
        } else {
          file = files.file;
        }
      } else {
        // Try to find any file in the files object
        const fileKeys = Object.keys(files);
        if (fileKeys.length > 0) {
          const firstKey = fileKeys[0];
          if (Array.isArray(files[firstKey])) {
            file = files[firstKey][0];
          } else {
            file = files[firstKey];
          }
        }
      }

      if (!file) {
        // console.error('No file found in upload:', { fields, files });
        return res.status(400).json({ 
          error: 'No file uploaded',
          message: 'Please select a file to upload'
        });
      }

      // In formidable v3, the file object has a filepath property
      const filepath = file.filepath || file.path;
      if (!filepath) {
        // console.error('File path not found:', file);
        return res.status(500).json({ 
          error: 'Upload failed',
          message: 'File path not found after upload'
        });
      }

      const filename = path.basename(filepath);
      const fileUrl = `/uploads/blog/${filename}`;

      // Verify file exists
      if (!fs.existsSync(filepath)) {
        // console.error('Uploaded file does not exist:', filepath);
        return res.status(500).json({ 
          error: 'Upload failed',
          message: 'File was not saved correctly'
        });
      }

      return res.status(200).json({ url: fileUrl });
    } catch (error) {
      // console.error('Error processing uploaded file:', error);
      return res.status(500).json({ 
        error: 'Upload failed',
        message: error.message || 'Failed to process uploaded file'
      });
    }
  } catch (error) {
    // console.error('Error in upload handler:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      message: error.message || 'Internal server error'
    });
  }
}
