import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import WaveSurfer from 'wavesurfer.js';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram';
import Hover from 'wavesurfer.js/dist/plugins/hover'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline'
import ZoomPlugin from 'wavesurfer.js/dist/plugins/zoom';
import { FileuploadService } from 'src/app/services/fileupload.service';
import { SnackbarService } from 'src/app/services/snackbar.service';

@Component({
  selector: 'app-wavesurfer',
  templateUrl: './wavesurfer.component.html',
  styleUrls: ['./wavesurfer.component.scss']
})
export class WavesurferComponent {

  @Input() fileId!: string; // Receive fileId from parent

  // control vars
  isPlay: boolean = false;

  // Initialize the Wavesurfer and the Regions plugin
  wavesurfer!: WaveSurfer;
  wsRegions!: RegionsPlugin;
  constructor(
    private fileuploadService: FileuploadService,
    private snackbarService: SnackbarService
  ) {
  }

  @ViewChild('waveform') waveformRef!: ElementRef;
  @ViewChild('waveform', { static: false }) set setSort(content: any) {
    if (content) {

      this.wavesurfer = WaveSurfer.create({
        container: this.waveformRef.nativeElement,
        waveColor: '#FF9800',
        progressColor: '#4CAF50',
        barWidth: 2,
        plugins: [
          Hover.create({
            lineColor: '#E91E63',
            lineWidth: 2,
            labelBackground: '#222831',
            labelColor: '#eeeeee',
            labelSize: '11px',
          }),
          TimelinePlugin.create({
            height: 15,
            timeInterval: 5,
            primaryLabelInterval: 1,
            style: {
              fontSize: '10px',
              color: '#3498db',
            },
          }),
        ],
      });

      // Load an audio file

      // Call function to load file dynamically
      this.loadFile(this.fileId);
      // this.wavesurfer.load('../../../assets/audio.wav');

      this.wsRegions.on('region-updated', (region) => {
        // console.log(region);
      })

      this.wsRegions.on('region-created', (region) => {

      });

      this.wsRegions.on('region-removed', (region) => {
      })

      // update controls based on timestamp
      this.wavesurfer.on('timeupdate', (currentTime) => {

      });
    }
  }

  loadFile(fileId: string) {
    this.fileuploadService.retrieveFile(fileId).subscribe(blob => {
      const audioUrl = URL.createObjectURL(blob);
      this.wavesurfer.load(audioUrl);
    });
  }

  togglePlayPause() {
    this.isPlay = !this.isPlay;
    this.isPlay ? this.wavesurfer.play() : this.wavesurfer.pause();
  }


  rewind() {
    let newTime = this.wavesurfer.getCurrentTime() - 5; // Rewind 5 seconds
    this.wavesurfer.setTime(newTime > 0 ? newTime : 0);
  }

  forward() {
    let newTime = this.wavesurfer.getCurrentTime() + 5; // Forward 5 seconds
    let duration = this.wavesurfer.getDuration();
    this.wavesurfer.setTime(newTime < duration ? newTime : duration);
  }
}
