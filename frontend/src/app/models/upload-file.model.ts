export interface UploadFileModel {
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  responseData?: any;
  objectUrl?: string; // used for audio preview
}

export interface FileModel {
  id: string;
  filename: string;
  filepath: string;
  uploadTime: Number;
}
