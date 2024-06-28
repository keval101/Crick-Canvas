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
  selectedTeam: any;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.getTeams();
  }

  getTeams() {
    this.dataService.getTeams().subscribe(teams => {
      this.teams$.next(teams)
    })
  }

  selectTeam(team) {
    this.visible = true;
    this.selectedTeam = team
  }

  addTeam() {
    this.visible = true;
  }

  async deleteTeam(team, e: Event) {
    e.stopPropagation();
    if(confirm(`Are you want to delete team ${team.name}`) === true) {
      await this.dataService.deleteTeam(team.id)
    }
  }

  closeModal() {
    this.visible = false;
    this.selectedTeam = undefined;
    this.getTeams();
  }
}
