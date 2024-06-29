import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-match-detail',
  templateUrl: './match-detail.component.html',
  styleUrls: ['./match-detail.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MatchDetailComponent {
  players$ = new BehaviorSubject([]);

  matchId: string;
  match: any;
  selectStriker = false;
  selectBowler = false;
  selectRuns = false;
  displayWicket = false;
  wicketType = 'Bowled';
  selectedPlayer: any;
  selectedRuns: number;
  toss = false;
  currentBall = 0;
  maidenBallCount = 0;
  battingTeam: string;
  bowlingTeam: string;
  strikerForm: FormGroup;
  bowlerForm: FormGroup;
  tossForm: FormGroup;
  matchRunsDetail = {
    team1: { runs: 0, wickets: 0, overs: 0 },
    team2: { runs: 0, wickets: 0, overs: 0 },
  };
  userId: string;
  selectedTab: string = 'commentry';

  constructor(
    private dataService: DataService,
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {
    this.strikerForm = this.fb.group({
      striker: '',
      nonStriker: '',
    });

    this.bowlerForm = this.fb.group({
      bowler: '',
    });

    this.tossForm = this.fb.group({
      winTheToss: '',
      selected: '',
    });
  }

  ngOnInit() {
    this.matchId = this.route.snapshot.params['matchId'];
    this.getMatchDetail();
    this.userId = localStorage.getItem('userId');
  }

  openStriker() {
    this.selectStriker = true;
    this.strikerForm.patchValue({striker: this.match.striker, nonStriker: this.match.nonStriker})
  }

  saveStriker() {
    const payload = { ...this.match, ...this.strikerForm.value };
    this.match = payload;
    // this.dataService.updateMatch(payload);
    this.selectStriker = false;
  }

  openBowler() {
    this.selectBowler = true;
  }

  saveBowler() {
    const payload = { ...this.match, ...this.bowlerForm.value };
    this.match = payload;

    const playerIndex = this.match[this.bowlingTeam].players.findIndex(x => x.id === this.bowlerForm.value.bowler.id);
    const matchIndex = this.match[this.bowlingTeam].players[playerIndex]?.matches?.findIndex(x => x.matchId === this.matchId);
    if(matchIndex != -1 && matchIndex >=0 ) {
      this.match.bowler = {...this.match.bowler, ...this.match[this.bowlingTeam].players[playerIndex].matches[matchIndex]}
    }
    // this.dataService.updateMatch(payload);
    this.selectBowler = false;
  }

  openTheToss() {
    this.toss = true;
  }

  saveTheToss() {
    const winningTossTeam = this.tossForm.value.winTheToss;
    const lossingTossTeam = this.tossForm.value.winTheToss === 'team1' ? 'team2' : 'team1';
    this.battingTeam =
      this.tossForm.value.selected == 'Bat First'
        ? winningTossTeam
        : lossingTossTeam;
    this.bowlingTeam =
      this.tossForm.value.selected == 'Bowl First'
        ? winningTossTeam
        : lossingTossTeam;

    const payload = { ...this.match, toss: { ...this.tossForm.value }, battingTeam: this.battingTeam, bowlingTeam: this.bowlingTeam };
    payload['isStarted'] = true;
    this.dataService.updateMatch(payload);
    this.getMatchDetail();
    this.toss = false;
  }

  openRunsModal(score) {
    this.selectRuns = true;
    this.selectedRuns = score;
  }

  openWicketModal() {
    this.displayWicket = true;
    this.wicketType = 'Bowled';
    this.selectedPlayer = this.match.bowler
  }

  selectWicketType(type) {
    this.wicketType = type;

    if(this.wicketType === 'Bowled') {
      this.selectedPlayer = this.match.bowler
    }
  }

  getMatchDetail() {
    this.dataService.getMatch(this.matchId).subscribe((match) => {
      this.match = match;
      this.match['outBatsman'] = [];

      if (this.match.bowler) {
        const balls =
          this.match.bowler.overs > 0
            ? this.match.bowler.overs.split('.')?.[1]
            : 0;
        if (balls) {
          this.currentBall = +balls;
        }
      }

      this.battingTeam = this.match.battingTeam
      this.bowlingTeam = this.match.bowlingTeam


      this.setTeamScores();
    });
  }

  getPlayers() {
    this.dataService.getPlayers().subscribe((players) => {
      this.players$.next(players);
    });
  }

  setTeamScores() {
    let team1 = { runs: 0, wickets: 0, overs: 0 };
    let team2 = { runs: 0, wickets: 0, overs: 0 };
    this.match.team1.players.map((x) => {
      if (x.matches.length) {
        const matchIndex = x.matches.findIndex(
          (x) => x.matchId === this.matchId
        );
        team1.runs = x.matches[matchIndex]?.runs
          ? x.matches[matchIndex].runs + team1.runs
          : team1.runs;
        team2.wickets = x.matches[matchIndex]?.wickets
          ? x.matches[matchIndex].wickets + team2.wickets
          : team2.wickets;
        console.log(x.matches[matchIndex])
        team2.overs = x.matches[matchIndex]?.overs
          ? +x.matches[matchIndex].overs + team2.overs
          : team2.overs;
      }
    });

    this.match.team2.players.map((x) => {
      if (x.matches.length) {
        const matchIndex = x.matches.findIndex(
          (x) => x.matchId === this.matchId
        );
        team2.runs = x.matches[matchIndex]?.runs
          ? x.matches[matchIndex].runs + team2.runs
          : team2.runs;
        team1.wickets = x.matches[matchIndex]?.wickets
          ? x.matches[matchIndex].wickets + team1.wickets
          : team1.wickets;
        console.log(x.matches[matchIndex])
        team1.overs = x.matches[matchIndex]?.overs
          ? +x.matches[matchIndex].overs + team1.overs
          : team1.overs;
      }
    });

    this.matchRunsDetail = {
      team1: team1,
      team2: team2,
    };
    console.log(this.matchRunsDetail)
  }

  setBowling(score) {
    this.displayWicket = false;
    this.selectRuns = false;

    if(score === 'OUT') {
      if(this.wicketType != 'Bowled') {
        let type = this.wicketType === 'Catch' ? 'catch' : this.wicketType === 'Stump' ? 'stump' : 'runout';
        const playerIndex = this.match[this.bowlingTeam].players.findIndex(
          (x) => x.uid === this.selectedPlayer.uid
        );

        const matchIndex = this.match[this.bowlingTeam].players[playerIndex]?.matches?.findIndex((x) => x.matchId === this.match.id);
        let player = this.match[this.bowlingTeam].players[playerIndex];

        if(player.matches[matchIndex]?.matchId) {
          player.matches[matchIndex][type] = player.matches[matchIndex]?.[type] ? player.matches[matchIndex]?.[type] + 1 : 1;
        } else {
          player.matches.push({
            matchId: this.match.id
          })

          const matchIndex = this.match[this.bowlingTeam].players[playerIndex]?.matches?.findIndex((x) => x.matchId === this.match.id);
          player.matches[matchIndex][type] = player.matches[matchIndex]?.[type] ? player.matches[matchIndex]?.[type] + 1 : 1;
        }

        //  this.dataService.updatePlayer(this.match[this.bowlingTeam].players[playerIndex]);
      }
    }

    const striker = this.match.striker;
    const nonStriker = JSON.parse(JSON.stringify(this.match.nonStriker));
    const strikerIndex = this.match[this.battingTeam].players.findIndex(
      (x) => x.uid === striker.uid
    );
    const nonStrikerIndex = this.match[this.battingTeam].players.findIndex(
      (x) => x.uid === nonStriker.uid
    );
    const bowler = this.match.bowler;
    const bowlerIndex = this.match[this.bowlingTeam].players.findIndex(
      (x) => x.uid === bowler.uid
    );

    let strikerRuns = {};
    // handle striker runs
    this.maidenBallCount = score === 0 ? this.maidenBallCount + 1 : 0;
    const strikerMatch =
      this.match[this.battingTeam].players[strikerIndex]?.matches?.filter(
        (x) => x.matchId === this.match.id
      ) ?? [];
    const strikerDetail = strikerMatch.length ? strikerMatch[0] : {};
    strikerRuns = {
      ...strikerDetail,
      matchId: this.match.id,
      runs:
        score != 'OUT'
          ? strikerDetail.runs > 0
            ? strikerDetail.runs + +score
            : score
          : (strikerDetail.runs ?? 0),
      facedBalls: strikerDetail.facedBalls > 0 ? strikerDetail.facedBalls + 1 : 1,
      out: score === 'OUT',
    };

    if (score === 6) {
      strikerRuns['sixes'] =
        strikerDetail.sixes > 0 ? strikerDetail.sixes + 1 : 1;
    } else if (score === 4) {
      strikerRuns['fours'] =
        strikerDetail.fours > 0 ? strikerDetail.fours + 1 : 1;
    }

    if(score === 'OUT') {
      strikerRuns['outData'] = {
        type: this.wicketType
      }

      if(this.selectedPlayer?.id) {
        strikerRuns['outData'].player = this.selectedPlayer
      }
    }

    const matchIndex = this.match[this.battingTeam].players[
      strikerIndex
    ]?.matches?.findIndex((x) => x.matchId === this.match.id);

    if (matchIndex != -1 && matchIndex >= 0) {
      this.match[this.battingTeam].players[strikerIndex].matches[matchIndex] =
        strikerRuns;
    } else {
      this.match[this.battingTeam].players[strikerIndex].matches.push(
        strikerRuns
      );
    }

    // handle bowlers runs/balls
    this.currentBall = this.currentBall + 1;

    const bowlerMatch =
      this.match[this.bowlingTeam].players[bowlerIndex]?.matches?.filter(
        (x) => x.matchId === this.match.id
      ) ?? [];
    const bowlerDetail = bowlerMatch.length ? bowlerMatch[0] : {};

    const bowlerRuns = {
      ...bowlerDetail,
      matchId: this.match.id,
      balls: bowlerDetail.balls > 0 ? bowlerDetail.balls + 1 : 1,
    };

    if (score === 'OUT') {
      bowler['wickets'] = bowler?.wickets ? +bowler.wickets + 1 : 1;
      bowlerRuns.wickets = bowler.wickets;
    } else {
      bowler['concededRuns'] =
        bowler?.concededRuns > 0 ? bowler.concededRuns + +score : score;
      bowlerRuns.concededRuns = bowler.concededRuns;
    }

    if (this.currentBall === 6) {
      const overs = this.match.bowler?.overs?.split('.')?.[0] ?? 0;
      bowler['overs'] = bowler.overs > 0 ? `${+overs + 1}.0` : '1.0';
      bowlerRuns.overs = bowler.overs;
      if (this.maidenBallCount === 6) {
        bowler['maidens'] = bowler?.maidens > 0 ? bowler.maidens + 1 : 1;
        bowlerRuns.maidens = bowler.maidens;
      }
    } else {
      const overs = this.match.bowler?.overs?.split('.')?.[0] ?? 0;
      bowler['overs'] =
        bowler.overs > 0
          ? `${overs}.${this.currentBall}`
          : `0.${this.currentBall}`;
      bowlerRuns.overs = bowler.overs;
    }

    const matchBwIndex = this.match[this.bowlingTeam].players[
      bowlerIndex
    ]?.matches?.findIndex((x) => x.matchId === this.match.id);

    if (matchBwIndex != -1 && matchBwIndex >= 0) {
      this.match[this.bowlingTeam].players[bowlerIndex].matches[matchBwIndex] =
        bowlerRuns;
    } else {
      this.match[this.bowlingTeam].players[bowlerIndex].matches.push(
        bowlerRuns
      );
    }

    this.match.striker = { ...this.match.striker, ...strikerRuns };
    this.match.bowler = { ...this.match.bowler, ...bowlerRuns };

    if (score === 1 || (this.currentBall === 6 && score != 'OUT')) {
      this.match.nonStriker = this.match.striker;
      this.match.striker = nonStriker;
    } else if (score === 'OUT') {
      this.match['outBatsman'] = this.match?.outBatsman
        ? [...this.match.outBatsman, this.match.striker.id]
        : [this.match.striker.id];
      this.match.striker = {};
    }


    this.match['team1Score'] =
      this.match['team1Score'] > 0 ? +this.match['team1Score'] + 1 : 0;
    const payload = { ...this.match, bowler };

    const batsmanPlayer = this.match[this.battingTeam].players[strikerIndex];
    const bowlingPlayer = this.match[this.bowlingTeam].players[bowlerIndex];


    // this.dataService.updatePlayer(batsmanPlayer);
    // this.dataService.updatePlayer(bowlingPlayer);
    // this.dataService.updateTeam(this.match[this.battingTeam]);
    // this.dataService.updateTeam(this.match[this.bowlingTeam]);

    if(this.currentBall === 6) {
      this.match.bowler = {};
    }

    this.currentBall = this.currentBall === 6 ? 0 : this.currentBall;



    let totalBalls = +this.match.overs * 6;
    let totalFacedBalls = 0;

    this.match[this.bowlingTeam].players.map(x => {
      const matchIndex = x.matches.findIndex(x => x.matchId === this.matchId);
      totalFacedBalls = totalFacedBalls + (x.matches[matchIndex]?.balls ?? 0)
    })

    this.setTeamScores();

    if(this.matchRunsDetail[this.battingTeam].wickets === this.match[this.battingTeam].players.length - 1) {
      this.match.striker = nonStriker;
      this.match.nonStriker = {};
    }

    if(totalBalls === totalFacedBalls || this.matchRunsDetail[this.battingTeam].wickets === this.match[this.battingTeam].players.length) {
      this.match.battingTeam = this.match.battingTeam === 'team1' ? 'team2' : 'team1';
      this.match.bowlingTeam = this.match.bowlingTeam === 'team1' ? 'team2' : 'team1';
      this.match.striker = {};
      this.match.nonStriker = {};
      this.match.bowler = {};
      console.log('this.match?.isFirstInnigCompelted',this.match?.isFirstInnigCompelted)
      if(this.match?.isFirstInnigCompelted) {
        this.match['isCompletedMatch'] = true;
      } else {
        this.match['isFirstInnigCompelted'] = true;
      }
      this.battingTeam =  this.match.battingTeam
      this.bowlingTeam =  this.match.bowlingTeam;
      console.log('Inning End')
    }

    console.log('this', this.match)
    // this.dataService.updateMatch(payload);
  }

  calculateStrikeRate(totalRuns, totalBallsFaced) {
    if (totalBallsFaced === 0) {
      return 0;
    }
    return !isNaN((totalRuns / totalBallsFaced) * 100)
      ? ((totalRuns / totalBallsFaced) * 100).toFixed(2)
      : 0;
  }

  calculateEconomy(overs, runs) {
    const oversFloat = parseFloat(overs);
    const economy = (runs / oversFloat) * 6;
    const economyRounded = economy.toFixed(2);
    return !isNaN(economy) ? economyRounded : 0;
  }

  calculateRunRate(totalRuns, totalOvers) {
    // Convert totalOvers from overs and balls to decimal format (e.g., 0.2 -> 0.3333)
    let overs = Math.floor(totalOvers); // Get the whole number of overs
    let balls = (totalOvers - overs) * 10; // Convert remaining balls to a decimal fraction of an over
    let oversDecimal = overs + (balls / 6); // Combine overs and balls into a decimal format

    // Calculate run rate
    let runRate = totalRuns / oversDecimal;

    return !isNaN(runRate) ? runRate.toFixed(2) : 0;
}

calculateRequiredRunRate(targetRuns, totalOvers, runsScored, oversBowled) {
  // Convert oversBowled from overs and balls to decimal format (e.g., 5.5 -> 5.8333)
  let overs = Math.floor(oversBowled); // Get the whole number of overs
  let balls = (oversBowled - overs) * 10; // Convert remaining balls to a decimal fraction of an over
  let oversDecimal = overs + (balls / 6); // Combine overs and balls into a decimal format

  // Calculate remaining overs
  let remainingOvers = totalOvers - oversDecimal;

  // Calculate remaining target runs
  let remainingTarget = targetRuns - runsScored;

  console.log(remainingOvers, remainingTarget, targetRuns, runsScored)

  // Calculate required run rate
  let requiredRunRate = remainingTarget / remainingOvers;

  return !isNaN(requiredRunRate) ? requiredRunRate.toFixed(2) : 0;
}

  async deleteMatch() {
    if (confirm('Are you sure to delete match?') == true) {
      await this.dataService.deleteMatch(this.matchId);
      this.messageService.add({
        severity: 'success',
        summary: 'Match',
        detail: 'Deleted Successfully!',
      });
      this.router.navigate(['/matches']);
    }
  }

  selectTab(tab) {
    this.selectedTab = tab;
  }
}
