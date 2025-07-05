import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export interface QRData {
  type: 'user' | 'key';
  id: string;
  timestamp: number;
}

export const generateQRCode = async (data: QRData): Promise<string> => {
  try {
    const qrString = JSON.stringify(data);
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: parseInt(process.env.QR_CODE_SIZE || '200'),
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const parseQRCode = (qrString: string): QRData | null => {
  try {
    const data = JSON.parse(qrString);
    
    // Validate QR data structure
    if (!data.type || !data.id || !data.timestamp) {
      return null;
    }
    
    // Validate type
    if (!['user', 'key'].includes(data.type)) {
      return null;
    }
    
    return data as QRData;
  } catch (error) {
    console.error('Error parsing QR code:', error);
    return null;
  }
};

export const generateUniqueId = (): string => {
  return uuidv4();
};

export const generateKeyQRData = (keyId: string): QRData => {
  return {
    type: 'key',
    id: keyId,
    timestamp: Date.now(),
  };
};

export const generateUserQRData = (userId: string): QRData => {
  return {
    type: 'user',
    id: userId,
    timestamp: Date.now(),
  };
};

export const isQRDataValid = (data: QRData, maxAge: number = 24 * 60 * 60 * 1000): boolean => {
  const now = Date.now();
  const age = now - data.timestamp;
  return age <= maxAge;
};
