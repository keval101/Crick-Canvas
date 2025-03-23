import { Component, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-matches',
  templateUrl: './matches.component.html',
  styleUrls: ['./matches.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MatchesComponent {
  matches$ = new BehaviorSubject([])
  visible: boolean;
  userId: string;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.userId = localStorage.getItem('userId');

    this.getMatches();
  }

  getMatches() {
    this.dataService.getMatches().subscribe(matches => {
      const data = [];
      matches.map(x => {
        data.push(x);
      })
      this.matches$.next(data)
    })
  }

  addTeam() {
    this.visible = true;
  }

  closeModal() {
    this.visible = false;
    this.getMatches();
  }

  getDate(date) {
    return new Date()
  }
}
