import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.scss']
})
export class PlayersComponent {
  players$ = new BehaviorSubject([]);

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.getPlayers();
  }

  getPlayers() {
    this.dataService.getPlayers().subscribe(players => 
      {
        this.players$.next(players);
      })
  }
}
