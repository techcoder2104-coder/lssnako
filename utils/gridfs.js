import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';

let gridfsBucket = null;

export const initGridFS = () => {
  if (mongoose.connection.readyState === 1) {
    gridfsBucket = new GridFSBucket(mongoose.connection.getClient().db());
    console.log('✅ GridFS initialized');
  }
};

export const uploadToGridFS = async (file, filename) => {
  if (!gridfsBucket) {
    throw new Error('GridFS not initialized');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = gridfsBucket.openUploadStream(filename, {
      metadata: {
        originalFilename: file.originalname,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
      },
    });

    const bufferStream = Readable.from(file.buffer);

    bufferStream.pipe(uploadStream)
      .on('finish', () => {
        resolve({
          _id: uploadStream.id,
          filename: filename,
        });
      })
      .on('error', (error) => {
        reject(new Error(`GridFS upload failed: ${error.message}`));
      });
  });
};

export const downloadFromGridFS = async (fileId) => {
  if (!gridfsBucket) {
    throw new Error('GridFS not initialized');
  }

  return gridfsBucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
};

export const deleteFromGridFS = async (fileId) => {
  if (!gridfsBucket) {
    throw new Error('GridFS not initialized');
  }

  try {
    await gridfsBucket.delete(new mongoose.Types.ObjectId(fileId));
    console.log(`Deleted from GridFS: ${fileId}`);
  } catch (error) {
    console.error('Error deleting from GridFS:', error);
  }
};

export const getGridFSBucket = () => gridfsBucket;
