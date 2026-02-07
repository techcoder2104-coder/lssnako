import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

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
    console.warn('⚠️ GridFS init error:', error.message);
  }
  return false;
};

export const uploadToGridFS = async (file, filename) => {
  if (!gridfsBucket) {
    throw new Error('GridFS not initialized');
  }

  return new Promise((resolve, reject) => {
    try {
      const uploadStream = gridfsBucket.openUploadStream(filename);

      uploadStream.end(file.buffer, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            _id: uploadStream.id,
            filename: filename,
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const downloadFromGridFS = async (fileId) => {
  if (!gridfsBucket) {
    throw new Error('GridFS not initialized');
  }

  try {
    return gridfsBucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
  } catch (error) {
    throw new Error(`File not found: ${error.message}`);
  }
};

export const deleteFromGridFS = async (fileId) => {
  if (!gridfsBucket) {
    return;
  }

  try {
    await gridfsBucket.delete(new mongoose.Types.ObjectId(fileId));
  } catch (error) {
    console.error('GridFS delete error:', error);
  }
};

export default gridfsBucket;
