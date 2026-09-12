const { google } = require('googleapis');
const fetch = require('node-fetch');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.initializeDrive();
  }

  initializeDrive() {
    try {
      // Using API key for public file access
      const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
      
      if (!apiKey) {
        console.warn('GOOGLE_DRIVE_API_KEY not set. Drive sync will not work.');
        return;
      }

      this.drive = google.drive({
        version: 'v3',
        auth: apiKey
      });
    } catch (error) {
      console.error('Failed to initialize Google Drive:', error);
    }
  }

  /**
   * Extract folder ID from various Google Drive link formats
   */
  extractFolderId(driveLink) {
    try {
      // Format: https://drive.google.com/drive/folders/FOLDER_ID
      const folderMatch = driveLink.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      if (folderMatch) return folderMatch[1];

      // Format: https://drive.google.com/drive/u/0/folders/FOLDER_ID
      const folderMatch2 = driveLink.match(/\/u\/\d+\/folders\/([a-zA-Z0-9_-]+)/);
      if (folderMatch2) return folderMatch2[1];

      // If it's already just an ID
      if (/^[a-zA-Z0-9_-]+$/.test(driveLink)) return driveLink;

      throw new Error('Invalid Google Drive folder link format');
    } catch (error) {
      throw new Error(`Failed to extract folder ID: ${error.message}`);
    }
  }

  /**
   * List all files in a Google Drive folder
   */
  async listFilesInFolder(folderId) {
    if (!this.drive) {
      throw new Error('Google Drive not initialized');
    }

    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, modifiedTime, size, webContentLink)',
        pageSize: 100
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error listing Drive files:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Download file content from Google Drive
   */
  async downloadFile(fileId) {
    if (!this.drive) {
      throw new Error('Google Drive not initialized');
    }

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, {
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId) {
    if (!this.drive) {
      throw new Error('Google Drive not initialized');
    }

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, modifiedTime, size, webContentLink'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Check if file is supported (PDF or text-based)
   */
  isSupportedFileType(mimeType) {
    const supportedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.google-apps.document', // Google Docs
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    return supportedTypes.includes(mimeType);
  }

  /**
   * Export Google Docs as PDF
   */
  async exportGoogleDoc(fileId) {
    if (!this.drive) {
      throw new Error('Google Drive not initialized');
    }

    try {
      const response = await this.drive.files.export({
        fileId: fileId,
        mimeType: 'application/pdf'
      }, {
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error exporting Google Doc:', error);
      throw new Error(`Failed to export Google Doc: ${error.message}`);
    }
  }
}

module.exports = new GoogleDriveService();
