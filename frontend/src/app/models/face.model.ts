import { Url } from "url";

export interface FilePreview {
  file: File;
  url: URL;
  urlFaces: Url;
  progress: number;
  faces: Face[];
  selectedFace: Face;
  filsId: string;
  isSelected: boolean;
  isProcessing: boolean;
}

export interface Face {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
  name: string;
  image_path: string;
  hasResults: boolean;
  profiles: Profile[];
}

export interface Profile {
  records: Record[];
  showRecords: boolean;
}

export interface Record {
  image_id: string;
  image_path: string;
  url: string;
  nameAr: string;
  nameEn: string;
  nationality: string;
  birthdate: string;
  index: string;
  score: string;
  isHovered: boolean;
}
