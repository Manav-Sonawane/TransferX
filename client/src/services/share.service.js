import api from './api';

export const shareService = {
  createShare: (shareData) => {
    return api.post('/shares', shareData);
  },

  getShareByCode: (code) => {
    return api.get(`/shares/${code}`);
  },
};
