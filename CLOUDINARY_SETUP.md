# Cloudinary Setup Guide

This application now uses Cloudinary for file storage instead of local uploads. Follow these steps to configure Cloudinary:

## 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. After registration, you'll be taken to your dashboard

## 2. Get Your Credentials

From your Cloudinary dashboard, you'll find:
- **Cloud Name**: Your unique cloud name
- **API Key**: Your API key
- **API Secret**: Your API secret (keep this private!)

## 3. Update Environment Variables

Update your `.env` file in the backend directory with your Cloudinary credentials:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

**Important**: Replace the placeholder values with your actual Cloudinary credentials.

## 4. Features

The updated upload system now provides:

### ✅ Benefits of Cloudinary Integration:
- **Cloud Storage**: Files are stored in the cloud, not locally
- **Better Performance**: Faster file delivery via CDN
- **Automatic Optimization**: Images are automatically optimized
- **Scalability**: No storage limits on your server
- **File Management**: Easy file management through Cloudinary dashboard
- **Security**: Secure file URLs with optional transformations

### 📁 File Organization:
- All files are stored in the `aistudybuddy` folder in your Cloudinary account
- Files are automatically organized with unique names
- Both images and PDFs are supported

### 🔧 API Endpoints:
- `POST /api/upload` - Upload files to Cloudinary
- `GET /api/upload/files` - Get list of uploaded files
- `DELETE /api/upload/:publicId` - Delete files from Cloudinary

## 5. Testing

After updating your environment variables:

1. Restart your backend server
2. Try uploading a file through your application
3. Check your Cloudinary dashboard to see the uploaded files

## 6. Troubleshooting

If you encounter issues:

1. **Check credentials**: Make sure your Cloudinary credentials are correct
2. **Check environment variables**: Ensure the `.env` file is properly configured
3. **Restart server**: Restart your backend server after updating environment variables
4. **Check console**: Look for error messages in the server console

## 7. Migration from Local Storage

The old local uploads are still in the `backend/uploads` folder. You can:
- Keep them as backup
- Manually upload important files to Cloudinary
- Delete the folder once you're confident everything works

---

**Note**: Make sure to keep your API secret secure and never commit it to version control!