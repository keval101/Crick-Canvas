import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TeamsComponent } from './components/teams/teams.component';
import { PlayersComponent } from './components/players/players.component';
import { MatchesComponent } from './components/matches/matches.component';
import { AuthGuard } from './guard/auth.guard';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { MatchDetailComponent } from './components/matches/match-detail/match-detail.component';
import { PlayerDetailComponent } from './components/players/player-detail/player-detail.component';
import { LeaguesComponent } from './components/leagues/leagues.component';
import { LeagueDetailComponent } from './components/leagues/league-detail/league-detail.component';
import { ProfileComponent } from './components/profile/profile.component';
import { StatsComponent } from './components/stats/stats.component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignUpComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'teams',
    component: TeamsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'players',
    component: PlayersComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'players/:playerId',
    component: PlayerDetailComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'matches',
    component: MatchesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'stats/:userId',
    component: StatsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'leagues',
    component: LeaguesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'leagues/:id',
    component: LeagueDetailComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'matches/:matchId',
    component: MatchDetailComponent,
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
