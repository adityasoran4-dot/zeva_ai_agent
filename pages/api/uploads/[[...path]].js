import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    // Get the file path from the URL
    const { path: filePath } = req.query;
    
    if (!filePath || filePath.length === 0) {
      return res.status(400).json({ error: 'No file path provided' });
    }
    
    // Join the path parts
    const fileName = filePath.join('/');
    const fullPath = path.join(process.cwd(), 'public', 'uploads', fileName);
    
    console.log('📂 Serving file:', fullPath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.log('❌ File not found:', fullPath);
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Get file extension to set proper content type
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
    
    // Stream the file
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('❌ File stream error:', err);
      res.status(500).json({ error: 'Failed to read file' });
    });
    
  } catch (error) {
    console.error('❌ Uploads API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Disable body parser for file serving
export const config = {
  api: {
    bodyParser: false,
  },
};