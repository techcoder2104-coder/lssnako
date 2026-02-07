import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';

let gridfsBucket = null;

export const initGridFS = () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.getClient().db();
      gridfsBucket = new GridFSBucket(db);
      console.log('✅ GridFS initialized');
      return true;
    }
  } catch (error) {
    console.warn('⚠️ GridFS initialization failed:', error.message);
    return false;
  }
};

export const uploadToGridFS = async (file, filename) => {
  if (!gridfsBucket) {
    // Try to reinitialize
    const initialized = initGridFS();
    if (!initialized) {
      throw new Error('GridFS not initialized. MongoDB connection required.');
    }
  }

  return new Promise((resolve, reject) => {
    const uploadStream = gridfsBucket.openUploadStream(filename, {
      metadata: {
        originalFilename: file.originalname,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
      },
    });

    const bufferStream = Readable.from([file.buffer]);

    uploadStream.on('finish', () => {
      resolve({
        _id: uploadStream.id,
        filename: filename,
      });
    });

    uploadStream.on('error', (error) => {
      reject(new Error(`GridFS upload failed: ${error.message}`));
    });

    bufferStream.pipe(uploadStream);
  });
};

export const downloadFromGridFS = async (fileId) => {
  if (!gridfsBucket) {
    initGridFS();
  }

  if (!gridfsBucket) {
    throw new Error('GridFS not initialized');
  }

  return gridfsBucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
};

export const deleteFromGridFS = async (fileId) => {
  if (!gridfsBucket) {
    initGridFS();
  }

  if (!gridfsBucket) {
    return;
  }

  try {
    await gridfsBucket.delete(new mongoose.Types.ObjectId(fileId));
    console.log(`Deleted from GridFS: ${fileId}`);
  } catch (error) {
    console.error('Error deleting from GridFS:', error);
  }
};

export const getGridFSBucket = () => gridfsBucket;
