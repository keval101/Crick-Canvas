import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>; 

  ngAfterViewInit(): void {
    const video = this.videoPlayer.nativeElement;
    video.muted = true; // Ensure muted
    video.play().catch(error => {
      console.error('Autoplay failed:', error);
    });
  }
}
