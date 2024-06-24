import { Component } from '@angular/core';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.scss']
})
export class PlayersComponent {

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.getUsers();
  }

  getUsers() {
    this.dataService.getUsers().subscribe(res => console.log(res))
  }
}
