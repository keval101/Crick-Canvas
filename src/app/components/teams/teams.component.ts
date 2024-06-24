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
  players$ = new BehaviorSubject([]);
  players = []

  teamForm: FormGroup
  constructor(
    private fb: FormBuilder,
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.teamForm = this.fb.group({
      name: ['', Validators.required],
      logo: ['', Validators.required],
    })
    this.getUsers();
  }

  getUsers() {
    this.dataService.getUsers().subscribe(players => {
      this.players$.next(players)
    })
  }

  addPlayers(e, player) {
    const isChecked = e.target.checked
    if(isChecked) {
      this.players.push(player.id)
    } else {
      this.players = this.players.filter(x => x != player.id)
    }
  }

  async createTeam() {
    let payload = this.teamForm.value
    payload = {...payload, players: this.players}
    await this.dataService.createTeam(payload)
  }

}
