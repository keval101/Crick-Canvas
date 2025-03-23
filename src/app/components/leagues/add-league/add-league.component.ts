import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, timestamp } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-add-league',
  templateUrl: './add-league.component.html',
  styleUrls: ['./add-league.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddLeagueComponent {
 @Output() close = new EventEmitter();
  date = new Date();
  teams = [];
  leagueForm: FormGroup;
  isLoading = false;
  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private datepipe: DatePipe,
    private router: Router,
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.leagueForm = this.fb.group({
      name: ['', Validators.required],
      venue: ['', Validators.required],
      startFrom: ['', Validators.required]
    })
  }


  async createMatch() {
    let payload = this.leagueForm.value;
    this.isLoading = true;
    this.authService.getCurrentUser().subscribe(async (user) => {
      payload = {...payload, userId: user.uid}
      payload.startFrom = this.datepipe.transform(payload.startFrom, 'dd/MM/yyyy');

      if (this.leagueForm.valid) {
        const leagueData = payload;
        const timestamp = new Date().getTime();
        // Generate a unique ID for the league (you can customize this logic)
        const customId = `${timestamp}`; // Using timestamp as a custom ID
        const leagueCode = (timestamp % 1000000).toString().padStart(6, '0'); // Ensures it's 6 digits long
        payload['leagueCode'] = leagueCode;
        payload['leagueId'] = customId;  
        const response = await this.dataService.createLeague(payload, customId)
        this.isLoading = false;
        this.messageService.add({ severity: 'success', summary: 'League', detail: 'Created Successfully!' });
        this.close.emit();
      }
    })
  }

  async fetchPlayers(team: any) {
    return Promise.all(team.players.map(async (player: any) => {
      return await this.dataService.getPlayer(player.id);
    }));
  };
}
