import { Component, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { Teams } from 'src/app/enums/teams.enum';
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
  Teams = Teams

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
    this.getPlayers();
  }

  getPlayers() {
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
    this.teamForm.reset();
    this.close.emit();
  }

  setLogoUrl(url) {
    this.teamForm.get('logo').setValue(url);
  }

}
