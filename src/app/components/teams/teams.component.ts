import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss']
})
export class TeamsComponent {
  
  teams$ = new BehaviorSubject([])
  visible: boolean;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.getTeams();
  }

  getTeams() {
    this.dataService.getTeams().subscribe(teams => {
      this.teams$.next(teams)
    })
  }

  addTeam() {
    this.visible = true;
  }

  closeModal() {
    this.visible = false;
    this.getTeams();
  }
}
