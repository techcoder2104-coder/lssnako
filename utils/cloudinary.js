let cloudinary = null;

// Initialize Cloudinary if available
if (process.env.CLOUDINARY_CLOUD_NAME) {
  try {
    const CloudinaryModule = await import('cloudinary').catch(() => null);
    if (CloudinaryModule) {
      cloudinary = CloudinaryModule.v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      console.log('✅ Cloudinary initialized');
    }
  } catch (error) {
    console.warn('⚠️ Cloudinary initialization failed:', error.message);
  }
}

export const uploadToCloudinary = async (file) => {
  if (!cloudinary) {
    throw new Error('Cloudinary not configured. Install: npm install cloudinary');
  }
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'tradon',
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!cloudinary) return;
  
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

export default cloudinary;
