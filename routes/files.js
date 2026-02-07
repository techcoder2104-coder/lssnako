import express from 'express';
import { downloadFromGridFS } from '../utils/gridfs.js';
import mongoose from 'mongoose';

const router = express.Router();

// Download file from GridFS
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const downloadStream = await downloadFromGridFS(fileId);

    // Set proper headers
    res.setHeader('Content-Type', downloadStream.gridFSFile.contentType || 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="${downloadStream.gridFSFile.filename}"`);

    downloadStream.pipe(res);

    downloadStream.on('error', (error) => {
      console.error('Error downloading file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'File download failed' });
      }
    });
  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({ error: 'File retrieval failed: ' + error.message });
  }
});

export default router;
