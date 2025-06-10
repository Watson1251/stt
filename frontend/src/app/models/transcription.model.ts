export interface TranscriptionModel {
  id: string;
  fileId: string;
  enhancedPath: string;
  status: 'pending' | 'segmented' | 'processed';
  segments: SegmentModel[];
  isHovered?: boolean; // For UI hover state
}

export interface SegmentModel {
  id: string;
  start: number;
  end: number;
  text: string;
  status: 'pending' | 'transcribed' | 'processed';
  suggestions?: any[];
  editedText?: string;
  speaker?: string;
  confidence?: number;
}
