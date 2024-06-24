import { Component, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-add-team',
  templateUrl: './add-team.component.html',
  styleUrls: ['./add-team.component.scss']
})
export class AddTeamComponent {
  @Output() close = new EventEmitter();
  players$ = new BehaviorSubject([]);
  players = []

  teamForm: FormGroup
  constructor(
    private fb: FormBuilder,
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.teamForm = this.fb.group({
      name: [''],
      logo: [''],
    })
    this.getUsers();
  }

  getUsers() {
    this.dataService.getPlayers().subscribe(players => {
      this.players$.next(players)
    })
  }

  addPlayers(e, player) {
    const isChecked = e.target.checked
    if(isChecked) {
      this.players.push(player)
    } else {
      this.players = this.players.filter(x => x.id != player.id)
    }
  }

  async createTeam() {
    let payload = this.teamForm.value
    payload = {...payload, players: this.players}
    await this.dataService.createTeam(payload)
    this.close.emit();
  }

}
