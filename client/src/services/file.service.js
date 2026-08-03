import api from './api';

export const fileService = {
  uploadFile: (formData, onUploadProgress) => {
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
  
  getUserFiles: () => {
    return api.get('/files');
  },
  
  deleteFile: (fileId) => {
    return api.delete(`/files/${fileId}`);
  },
};
