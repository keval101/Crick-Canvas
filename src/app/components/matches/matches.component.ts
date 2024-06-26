import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-matches',
  templateUrl: './matches.component.html',
  styleUrls: ['./matches.component.scss']
})
export class MatchesComponent {
  matches$ = new BehaviorSubject([])
  visible: boolean;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.getMatches();
  }

  getMatches() {
    this.dataService.getMatches().subscribe(teams => {
      this.matches$.next(teams)
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
