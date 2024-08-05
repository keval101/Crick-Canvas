import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
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
  @Input() selectedTeam;
  playersIds = [];

  teamForm: FormGroup
  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.teamForm = this.fb.group({
      name: [''],
      logo: [''],
    })
    this.getPlayers();

  }

  ngOnChanges() {
    if(this.selectedTeam) {
      this.teamForm.get('name').setValue(this.selectedTeam.name)
      this.teamForm.get('logo').setValue(this.selectedTeam.logo)
      this.players = this.selectedTeam.players
      this.playersIds = this.players.map(x => x.id)
    }
  }

  getPlayers() {
    this.dataService.getPlayers().subscribe(players => {
      players.sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      });
      this.players$.next(players)
    })
  }

  addPlayers(e, player) {
    const isChecked = e.target.checked
    if(isChecked) {
      this.players.push(player)
      this.playersIds.push(player.id)
    } else {
      this.players = this.players.filter(x => x.id != player.id)
      this.playersIds = this.playersIds.filter(x => x != player.id)
    }
  }

  async createTeam() {
    let payload = this.teamForm.value
    payload = {...payload, players: this.players}
    if(this.selectedTeam) {
      payload = {...payload, id: this.selectedTeam.id}
      await this.dataService.updateTeam(payload)
    } else {
      await this.dataService.createTeam(payload)
    }
    this.messageService.add({ severity: 'success', summary: 'Match', detail: 'Created Successfully!' });
    this.teamForm.reset();
    this.close.emit();
  }

  setLogoUrl(url) {
    this.teamForm.get('logo').setValue(url);
  }

}
