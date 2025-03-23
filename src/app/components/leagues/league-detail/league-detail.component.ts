import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MDCSnackbar } from '@material/snackbar';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-league-detail',
  templateUrl: './league-detail.component.html',
  styleUrls: ['./league-detail.component.scss']
})
export class LeagueDetailComponent {

  league: any;
  leagueId: string;
  selectedTab: string = 'fixtures';
  constructor(
    private route: ActivatedRoute,
    private dataService: DataService) { }

  
    ngOnInit() {
      this.leagueId = this.route.snapshot.paramMap.get('id');
      this.dataService.getLeagueDetails(this.leagueId).then(league => {
        this.league = league;
      });
    }

      copyToClipBoard() {
        try {
            const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'));
            snackbar.open()
            const text = (document.getElementById('copylink') as HTMLInputElement).value;
            const input = document.createElement('input');
            input.setAttribute('value', String(text));
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setTimeout(()=> snackbar.close(), 3000);
            return true;
        } catch (err) {
            return false;
        }
    }

    generateFixtures(teamIds: string[], matchesPerPair: number): any[] {
      const fixtures: any[] = [];
      let matchCounter = 1;
  
      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          for (let k = 0; k < matchesPerPair; k++) {
            // Alternate home/away logic
            const home = k % 2 === 0 ? teamIds[i] : teamIds[j];
            const away = k % 2 === 0 ? teamIds[j] : teamIds[i];
            fixtures.push({
              match_no: matchCounter++,
              team1: home,
              team2: away,
              round: `Round ${k + 1}`,
            });
          }
        }
      }
      console.log(fixtures);
      return fixtures;
    }
  
    // async saveFixturesToFirebase(fixtures: any[]) {
    //   const fixturesCollection = collection(this.firestore, 'fixtures');
    //   for (const fixture of fixtures) {
    //     await addDoc(fixturesCollection, fixture);
    //   }
    // }



}
