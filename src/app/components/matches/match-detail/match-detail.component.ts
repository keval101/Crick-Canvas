import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import {MDCSnackbar} from '@material/snackbar';

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
  matchResult: string;
  isAdmin = false;
  team1Players = [];
  team2Players = [];
  activeScorecard: string;
  matchUrl:string;
  whatsappUrl:string;
  facebookUrl:string;
  mvpPlayer;

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
    this.matchUrl = window.location.href;
    this.whatsappUrl = encodeURI('https://api.whatsapp.com/send?text=') + encodeURIComponent(this.matchUrl);
    this.facebookUrl  = encodeURI('https://www.facebook.com/sharer/sharer.php?quote=') + '&u=' + this.matchUrl;
    this.getMatchDetail();
    this.userId = localStorage.getItem('userId');
    this.isAdmin = this.userId === 'qQsEQGrKWpUp36dkTAcqEhkCcCO2';
    this.getProjectDetail();
  }

  getTeamScore(team?: string) {
    this.activeScorecard = team;
    this.team1Players = []
    this.team2Players = []

    this.match[team === 'team1' ? 'team1' : 'team2'].players.map(x => {
      const match = x.matches.find(m => m.matchId === this.matchId)
      let playerDetail: any = {
        name: x.name,
        id: x.id,
        uid: x.uid,
      };
      if(match) {
        playerDetail = {
          ...playerDetail,
          match: match,
        }
      }
      this.team1Players.push(playerDetail)
    })

    this.match[team === 'team2' ? 'team1' : 'team2'].players.map(x => {
      const match = x.matches.find(m => m.matchId === this.matchId)
      let playerDetail: any = {
        name: x.name,
        id: x.id,
        uid: x.uid,
      };
      if(match) {
        playerDetail = {
          ...playerDetail,
          match: match,
        }
      }
      this.team2Players.push(playerDetail)
    })

  }

  openStriker() {
    this.selectStriker = true;
    this.strikerForm.patchValue({striker: this.match.striker, nonStriker: this.match.nonStriker})
  }

  saveStriker() {
    const payload = { ...this.match, ...this.strikerForm.value };
    this.match = payload;
    this.dataService.updateMatch(payload);
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
    this.dataService.updateMatch(payload);
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

  switchBatsman() {
    const striker = JSON.parse(JSON.stringify(this.match.nonStriker))
    const nonStriker = JSON.parse(JSON.stringify(this.match.striker))
    this.match = {...this.match, striker, nonStriker};
    this.dataService.updateMatch(this.match)
  }

  getPlayerDetail(player) {
    const playerDetail = this.match[this.match.battingTeam].players.find(x => x.id === player.id)
    return playerDetail;
  }

  calculateMvpPoints(match) {
    // Define weights for each statistic
    const ballFaced = match?.facedBalls ?? 0
    const runs = match?.runs ?? 0
    const sixes = match?.sixes ?? 0;

    const pointsPerRun = 1;
    const pointsPerDotBall = -1;
    const pointsPerSix = 8;
    const pointsPerFour = 6;
    const bonusFor30Plus = 8;
    const bonusFor50Plus = 12;
    
    // Calculate the number of dot balls
    const dotBalls = ballFaced - runs; // Every ball faced minus the runs scored gives dot balls
    
    // Calculate base points
    let points = (runs * pointsPerRun) +
                 (dotBalls * pointsPerDotBall) +
                 (sixes * pointsPerSix);
    
    // Calculate fours from runs and sixes
    // Total runs scored from fours and sixes: Runs - (6 * number of sixes)
    const runsFromFours = runs - (6 * sixes);
    const fours = Math.floor(runsFromFours / 4);
    points += fours * pointsPerFour;
    
    // Apply bonuses
    if (runs >= 50) {
        points += bonusFor50Plus;
    } else if (runs >= 30) {
        points += bonusFor30Plus;
    }

    return points;
  }

  calculateBowlingMvpPoints(match) {

    const balls = match?.balls ?? 0
    const concededRuns = match?.concededRuns ?? 0
    const catches = match?.catches ?? 0
    const runouts = match?.runouts ?? 0

    // Define weights for each statistic
    const pointsPerDotBall = 2;
    const pointsPerRun = -0.5;
    const pointsPerCatch = 8;
    const pointsPerRunout = 8;
    const deductionFor30Plus = -8;
    const deductionFor50Plus = -12;

    // Calculate the number of dot balls
    // Assuming dot balls are balls where no runs were scored
    const dotBalls = balls - concededRuns; // Simplified assumption
    
    // Calculate base points
    let points = (dotBalls * pointsPerDotBall) +
                (concededRuns * pointsPerRun) +
                (catches * pointsPerCatch) +
                (runouts * pointsPerRunout);

    // Apply deductions
    if (concededRuns >= 50) {
        points += deductionFor50Plus;
    } else if (concededRuns >= 30) {
        points += deductionFor30Plus;
    }

    return points;
  }

  getBestData() {
    if(this.match.isCompletedMatch) {
      this.getTeamScore('team1')
      const team1Results = this.analyzeMatchStats(this.team1Players);
      const team2Results = this.analyzeMatchStats(this.team2Players);
      this.team1Players.map(x => {
        x['battingPoints'] = this.calculateMvpPoints(x.match)
        x['bowlingPoints'] = this.calculateBowlingMvpPoints(x.match)
        x['totalMVPPoints'] = x.battingPoints + x.bowlingPoints;
      })

      this.team2Players.map(x => {
        x['battingPoints'] = this.calculateMvpPoints(x.match)
        x['bowlingPoints'] = this.calculateBowlingMvpPoints(x.match)
        x['totalMVPPoints'] = x.battingPoints + x.bowlingPoints;
      })


      const players = [...this.team1Players, ...this.team2Players];
      let mvpPlayer: any = {};
      players.map(x => {
        if(x.totalMVPPoints > (mvpPlayer?.totalMVPPoints ?? 0)) {
          mvpPlayer = x
        }
      })
      this.mvpPlayer = mvpPlayer;
      console.log(this.mvpPlayer)
  
      // const bestData = this.findHighestStats(team1Results, team2Results)
    }
  }

  analyzeMatchStats(players) {
    // Initialize statistics holders
    const stats = {
        bestBatsman: { name: '', runs: -1 },
        bestBowler: { name: '', wickets: -1 },
        mostSixes: { name: '', sixes: -1 },
        mostFours: { name: '', fours: -1 },
        mostCatches: { name: '', catches: -1 },
        mostRunouts: { name: '', runouts: -1 }
    };

    // Process each player
    players.forEach(player => {
        const match = player.match;
        
        // Check for Best Batsman
        if (match.runs > stats.bestBatsman.runs) {
            stats.bestBatsman.name = player.name;
            stats.bestBatsman.runs = match.runs;
        }

        // Check for Best Bowler
        if (match.wickets > stats.bestBowler.wickets) {
            stats.bestBowler.name = player.name;
            stats.bestBowler.wickets = match.wickets;
        }

        // Check for Most Sixes (assuming `sixes` is part of match)
        if (match.sixes > stats.mostSixes.sixes) {
            stats.mostSixes.name = player.name;
            stats.mostSixes.sixes = match.sixes;
        }

        // Check for Most Fours (assuming `fours` data is available, but it's not in this data)
        // Example (if available): if (match.fours > stats.mostFours.fours) {
        //     stats.mostFours.name = player.name;
        //     stats.mostFours.fours = match.fours;
        // }

        // Check for Most Catches
        if (match.catches > stats.mostCatches.catches) {
            stats.mostCatches.name = player.name;
            stats.mostCatches.catches = match.catches;
        }

        // Check for Most Runouts (assuming `runouts` is part of match)
        if (match.runouts) {
            if (match.runouts > stats.mostRunouts.runouts) {
              stats.mostRunouts.name = player.name;
              stats.mostRunouts.runouts = match.runouts;
            }
        }
    });

    return stats;
  }

  findHighestStats(team1, team2) {
    // Helper function to compare and include team information
    function compareAndIncludeTeam(stat1, stat2, teamName1, teamName2) {
        if (stat1 > stat2) {
            return { name: team1.bestBatsman.name, runs: stat1, team: teamName1 };
        } else if (stat2 > stat1) {
            return { name: team2.bestBatsman.name, runs: stat2, team: teamName2 };
        } else {
            return { name: team1.bestBatsman.name, runs: stat1, team: teamName1 }; // Or adjust as needed for ties
        }
    }

    // Initialize result object
    const highestStats = {
        bestBatsman: compareAndIncludeTeam(team1.bestBatsman.runs, team2.bestBatsman.runs, 'Team 1', 'Team 2'),
        bestBowler: compareAndIncludeTeam(team1.bestBowler.wickets, team2.bestBowler.wickets, 'Team 1', 'Team 2'),
        mostSixes: compareAndIncludeTeam(team1.mostSixes.sixes, team2.mostSixes.sixes, 'Team 1', 'Team 2'),
        mostFours: compareAndIncludeTeam(team1.mostFours.fours, team2.mostFours.fours, 'Team 1', 'Team 2'),
        mostCatches: compareAndIncludeTeam(team1.mostCatches.catches, team2.mostCatches.catches, 'Team 1', 'Team 2'),
        mostRunouts: compareAndIncludeTeam(team1.mostRunouts.runouts, team2.mostRunouts.runouts, 'Team 1', 'Team 2')
    };

    // Return highest statistics
    return highestStats;
}

  getMatchDetail() {
    this.dataService.getMatch(this.matchId).subscribe(async (match) => {
      this.match = match;
      this.match['outBatsman'] = this.match['outBatsman'].length ? this.match['outBatsman'] : [];

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


      const team1Players = await this.fetchPlayers(this.match.team1);
      const team2Players = await this.fetchPlayers(this.match.team2);
      
      this.match.team1.players = team1Players;
      this.match.team2.players = team2Players;
      this.setTeamScores();
      this.getBestData();
    });
  }

  async fetchPlayers(team: any) {
    return Promise.all(team.players.map(async (player: any) => {
      return await this.dataService.getPlayer(player.id);
    }));
  };

  getPlayerCurrentStatus(player){
    if(!player?.match?.out){
      return 'not out'
    }

    if(player?.match?.outData?.type === 'Bowled'){
      return 'B ' + player?.match?.outData?.bowler?.name
    }
    
    if(player?.match?.outData?.type === 'Catch'){
      return 'C ' + player?.match?.outData?.player?.name + ' B ' + player?.match?.outData?.bowler?.name
    }

    if(player?.match?.outData?.type === 'Stump'){
      return 'St ' + player?.match?.outData?.player?.name
    }

    if(player?.match?.outData?.type === 'Runout'){
      return 'Runout by' + player?.match?.outData?.player?.name
    }

    return 'Out'
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
        team2.overs = x.matches[matchIndex]?.overs
          ? +x.matches[matchIndex].overs + team2.overs
          : team2.overs;

          if(x.matches[matchIndex]?.out && x.matches[matchIndex]?.outData?.type === 'Runout') {
            team1.wickets = team1.wickets + 1
          }
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
        team1.overs = x.matches[matchIndex]?.overs
          ? +x.matches[matchIndex].overs + team1.overs
          : team1.overs;

        if(x.matches[matchIndex]?.out && x.matches[matchIndex]?.outData?.type === 'Runout') {
          team2.wickets = team2.wickets + 1
        }
      }
    });

    this.matchRunsDetail = {
      team1: team1,
      team2: team2,
    };
  }

  async setBowling(score) {
    this.displayWicket = false;
    this.selectRuns = false;

    if(score === 'OUT') {
      if(this.wicketType != 'Bowled') {
        let type = this.wicketType === 'Catch' ? 'catches' : this.wicketType === 'Stump' ? 'stumps' : 'runouts';
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

         this.dataService.updatePlayer(this.match[this.bowlingTeam].players[playerIndex]);
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
        strikerRuns['outData'].bowler = this.match.bowler
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
      if(this.wicketType != 'Runout') {
        bowlerDetail['wickets'] = bowlerDetail?.wickets ? +bowlerDetail.wickets + 1 : 1;
        bowlerRuns.wickets = bowlerDetail.wickets;
      }
    } else {
      bowlerDetail['concededRuns'] =
      bowlerDetail?.concededRuns > 0 ? bowlerDetail?.concededRuns + +score : score;
      bowlerRuns.concededRuns = bowlerDetail.concededRuns;
    }

    if (this.currentBall === 6) {
      const overs = this.match.bowler?.overs?.split('.')?.[0] ?? 0;
      bowlerDetail['overs'] = bowlerDetail.overs > 0 ? `${+overs + 1}.0` : '1.0';
      bowlerRuns.overs = bowlerDetail.overs;
      if (this.maidenBallCount === 6) {
        bowlerDetail['maidens'] = bowlerDetail?.maidens > 0 ? bowlerDetail.maidens + 1 : 1;
        bowlerRuns.maidens = bowlerDetail.maidens;
      }
    } else {
      const overs = this.match.bowler?.overs?.split('.')?.[0] ?? 0;
      bowlerDetail['overs'] =
      bowlerDetail.overs > 0
          ? `${overs}.${this.currentBall}`
          : `0.${this.currentBall}`;
      bowlerRuns.overs = bowlerDetail.overs;
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

    if(this.matchRunsDetail[this.battingTeam].wickets != this.match[this.battingTeam].players.length - 1) { 
      this.match.striker = { ...this.match.striker, ...strikerRuns };
    }

    this.match.bowler = { ...this.match.bowler, ...bowlerRuns };

    this.setTeamScores();

    if (score === 1 || (this.currentBall === 6 && score != 'OUT')) {
      if(this.matchRunsDetail[this.battingTeam].wickets != this.match[this.battingTeam].players.length - 1) {
        this.match.nonStriker = this.match.striker;
        this.match.striker = nonStriker;
      } else {
        this.match.striker = this.match.striker;
        this.match.nonStriker = {};
      }
    } else if (score === 'OUT') {
      this.match['outBatsman'] = this.match?.outBatsman
        ? [...this.match.outBatsman, this.match.striker.id]
        : [this.match.striker.id];

    if(this.matchRunsDetail[this.battingTeam].wickets === this.match[this.battingTeam].players.length - 1) {
      this.match.striker = nonStriker ?? this.match.striker;
      this.match.nonStriker = {};
    } else {
      this.match.striker = {};
    }

    }

    this.match['team1Score'] =
      this.match['team1Score'] > 0 ? +this.match['team1Score'] + 1 : 0;
    const payload = { ...this.match, bowler };

    const batsmanPlayer = this.match[this.battingTeam].players[strikerIndex];
    const bowlingPlayer = this.match[this.bowlingTeam].players[bowlerIndex];


    this.dataService.updatePlayer(batsmanPlayer);
    this.dataService.updatePlayer(bowlingPlayer);
    this.dataService.updateTeam(this.match[this.battingTeam]);
    this.dataService.updateTeam(this.match[this.bowlingTeam]);

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


    if(this.match?.isFirstInnigCompelted && (this.matchRunsDetail[this.battingTeam]?.runs > this.matchRunsDetail[this.bowlingTeam]?.runs)) {
      this.match['isCompletedMatch'] = true;
      this.findMatchResult(this.match.toss, this.matchRunsDetail, this.match[this.battingTeam].players.length)
      this.match['matchResult'] = this.matchResult;
      this.match.striker = {};
      this.match.nonStriker = {};
      this.match.bowler = {};
    }

    if(totalBalls === totalFacedBalls || this.matchRunsDetail[this.battingTeam].wickets === this.match[this.battingTeam].players.length) {
      this.match.battingTeam = this.match.battingTeam === 'team1' ? 'team2' : 'team1';
      this.match.bowlingTeam = this.match.bowlingTeam === 'team1' ? 'team2' : 'team1';
      this.match.striker = {};
      this.match.nonStriker = {};
      this.match.bowler = {};
      if(this.match?.isFirstInnigCompelted) {
        this.match['isCompletedMatch'] = true;
        this.findMatchResult(this.match.toss, this.matchRunsDetail, this.match[this.battingTeam].players.length)
        this.match['matchResult'] = this.matchResult;
        this.match['outBatsman'] = [];
      } else {
        this.match['isFirstInnigCompelted'] = true;
        this.match['outBatsman'] = [];
        this.currentBall = 0;
      }
      this.battingTeam =  this.match.battingTeam
      this.bowlingTeam =  this.match.bowlingTeam;
    }

    this.match['matchRunsDetail'] = this.matchRunsDetail;
    this.dataService.updateMatch(this.match);
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
    const economy = runs / oversFloat;
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

    // Calculate required run rate
    let requiredRunRate = remainingTarget / remainingOvers;

    return !isNaN(requiredRunRate) ? requiredRunRate.toFixed(2) : 0;
  }

  async deleteMatch() {
    if (confirm('Are you sure to delete match?') == true) {
      this.match.team1.players.map(async (x) => {
        x.matches = x.matches.filter(m => m.matchId != this.matchId);
        await this.dataService.updatePlayer(x)
      })

      this.match.team2.players.map(async (x) => {
        x.matches = x.matches.filter(m => m.matchId != this.matchId);
        await this.dataService.updatePlayer(x)
      })


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
    this.activeScorecard = undefined
    this.selectedTab = tab;
    this.team1Players = []
    this.team2Players = []
  }

  getProjectDetail() {
    this.dataService.getMatchDetail(this.matchId).subscribe();
  }



  // ----------------------------------------------------------- Find Match Result
  findMatchResult(toss, matchRunsDetail, totalWickets) {
    const { winTheToss, selected } = toss;
    const { team1, team2 } = matchRunsDetail;

    // Extract scores and wickets
    const runsTeam1 = team1.runs;
    const runsTeam2 = team2.runs;
    const wicketsTeam2 = team2.wickets;
    const wicketsTeam1 = team1.wickets;

    // Determine the winner and construct the result message
    let winner = '';
    let losser = '';
    let resultMessage = '';

    if(runsTeam1 > runsTeam2) {
      winner = 'team1'
      losser = 'team2'
    } else if(runsTeam2 > runsTeam1) {
      winner = 'team2'
      losser = 'team1'
    } else {
      resultMessage = 'Match tied';
    }

    if(winTheToss === 'team1' && selected === 'Bat First' && winner === 'team1') {
        resultMessage = `${this.match.team1.name} won by ${runsTeam1 - runsTeam2} runs`;
    } else if(winTheToss === 'team1' && selected === 'Bowl First' && winner === 'team1') {
        resultMessage = `${this.match.team1.name} won by ${totalWickets - wicketsTeam1} wickets`;
    }

    if(winTheToss === 'team2' && selected === 'Bat First' && winner === 'team2') {
      resultMessage = `${this.match.team2.name} won by ${wicketsTeam2 - runsTeam1} runs`;
    } else if(winTheToss === 'team2' && selected === 'Bowl First' && winner === 'team2') {
        resultMessage = `${this.match.team2.name} won by ${totalWickets - wicketsTeam2} wickets`;
    }

    if(winTheToss != 'team1' && selected === 'Bat First' && winner === 'team1') {
      resultMessage = `${this.match.team1.name} won by ${totalWickets - wicketsTeam1} wickets`;
    } else if(winTheToss != 'team1' && selected === 'Bowl First' && winner === 'team1') {
      resultMessage = `${this.match.team1.name} won by ${runsTeam1 - runsTeam2} runs`;
    }

    if(winTheToss != 'team2' && selected === 'Bat First' && winner === 'team2') {
      resultMessage = `${this.match.team2.name} won by ${totalWickets - wicketsTeam2} wickets`;
    } else if(winTheToss != 'team1' && selected === 'Bowl First' && winner === 'team2') {
      resultMessage = `${this.match.team2.name} won by ${runsTeam2 - runsTeam1} runs`;
    }

    // if (runsTeam1 > runsTeam2) {
    //   winner = 'team1';
    //   losser = 'team2';
    //   if (winTheToss === 'team1' && selected === 'Bat First') {
    //     resultMessage = `${this.match[winner].name} won by ${runsTeam1 - runsTeam2} runs`;
    //   } else if (winTheToss === 'team1' && selected === 'Bowl First') {
    //     resultMessage = `${this.match[winner].name} won by ${totalWickets - wicketsTeam2} wickets`;
    //   } else {
    //     resultMessage = `${this.match[losser].name} won by ${runsTeam1 - runsTeam2} runs`;
    //   }
    // } else if (runsTeam2 > runsTeam1) {
    //   winner = 'team2';
    //   losser = 'team1';
    //   if (winTheToss === 'team2' && selected === 'Bowl First') {
    //     resultMessage = `${this.match[winner].name} won by ${runsTeam2 - runsTeam1} runs`;
    //   } else if (winTheToss === 'team2' && selected === 'Bat First') {
    //     resultMessage = `${this.match[winner].name} won by ${totalWickets - wicketsTeam2} wickets`;
    //   } else {
    //     resultMessage = `${this.match[losser].name} won by ${runsTeam2 - runsTeam1} runs`;
    //   }
    // } else {
    //   resultMessage = 'Match tied';
    // }

    this.matchResult = resultMessage

    return resultMessage;
  }







  // ----------------------------------------------------------- Player Of The Match
  // Example data representing players and their match statistics
  players = [
  { name: "Player A", runsScored: 78, wicketsTaken: 2, catches: 1 },
  { name: "Player B", runsScored: 102, wicketsTaken: 1, catches: 2 },
  { name: "Player C", runsScored: 64, wicketsTaken: 3, catches: 0 },
  { name: "Player D", runsScored: 91, wicketsTaken: 0, catches: 3 },
  { name: "Player E", runsScored: 85, wicketsTaken: 2, catches: 2 }
  ];

  // Function to calculate a combined score for each player and determine the player of the match
  findPlayerOfTheMatch(players) {
    let maxScore = -1; // Initialize maximum score to a very low number
    let playerOfTheMatch = '';

    // Iterate through players to calculate a combined score
  players.forEach(player => {
      // Define a combined score (you can adjust weights as needed)
    const combinedScore = player.runsScored * 0.5 + player.wicketsTaken * 10 + player.catches * 5;

      // Check if this player has a higher combined score
      if (combinedScore > maxScore) {
        maxScore = combinedScore;
        playerOfTheMatch = player.name;
      }
    });

    return playerOfTheMatch;
  }

}
