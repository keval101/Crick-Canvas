import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Firebase Modules
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { AngularFirestoreModule, SETTINGS } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { LoginComponent } from './components/login/login.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './interceptor/auth.interceptor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PlayersComponent } from './components/players/players.component';
import { TeamsComponent } from './components/teams/teams.component';
import { MatchesComponent } from './components/matches/matches.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AddTeamComponent } from './components/teams/add-team/add-team.component'

import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { AddMatchComponent } from './components/matches/add-match/add-match.component';
import { DatePipe } from '@angular/common';
import { MatchDetailComponent } from './components/matches/match-detail/match-detail.component';
import { CoinTossComponent } from './shared/components/coin-toss/coin-toss.component';
import { PlayerDetailComponent } from './components/players/player-detail/player-detail.component';
import { MessageService } from 'primeng/api';
import { ManOfTheMatchComponent } from './components/matches/man-of-the-match/man-of-the-match.component';
import { LeaguesComponent } from './components/leagues/leagues.component';
import { AddLeagueComponent } from './components/leagues/add-league/add-league.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { LeagueDetailComponent } from './components/leagues/league-detail/league-detail.component';
import { SetupTeamComponent } from './components/leagues/setup-team/setup-team.component';
import { JoinCodeComponent } from './shared/components/join-code/join-code.component';
import { ProfileComponent } from './components/profile/profile.component';
import { StatsComponent } from './components/stats/stats.component';
import { MatchResultComponent } from './components/leagues/match-result/match-result.component';
import { LeagueWinnerComponent } from './components/leagues/league-winner/league-winner.component';
import { RankingsComponent } from './components/rankings/rankings.component';
import { HeadToHeadComponent } from './components/head-to-head/head-to-head.component';
import { AddHeadToHeadComponent } from './components/head-to-head/add-head-to-head/add-head-to-head.component';
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle.component';

const firebaseConfig = {
  apiKey: "AIzaSyDmmEU-rEfzLSY0mYcXe-QsF4iFVRs0osE",
  authDomain: "cricketscore-562db.firebaseapp.com",
  projectId: "cricketscore-562db",
  storageBucket: "cricketscore-562db.appspot.com",
  messagingSenderId: "1075722823123",
  appId: "1:1075722823123:web:0fc3151132abf5cbb67b26",
  measurementId: "G-TT5BV1P99M"
};

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    PlayersComponent,
    TeamsComponent,
    MatchesComponent,
    SidebarComponent,
    SignUpComponent,
    AddTeamComponent,
    AddMatchComponent,
    MatchDetailComponent,
    CoinTossComponent,
    PlayerDetailComponent,
    ManOfTheMatchComponent,
    LeaguesComponent,
    AddLeagueComponent,
    SpinnerComponent,
    LeagueDetailComponent,
    SetupTeamComponent,
    JoinCodeComponent,
    ProfileComponent,
    StatsComponent,
    MatchResultComponent,
    LeagueWinnerComponent,
    RankingsComponent,
    HeadToHeadComponent,
    AddHeadToHeadComponent,
    ThemeToggleComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    //Firebase
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFirestoreModule,
    AngularFireStorageModule,

    FormsModule,
    ReactiveFormsModule,

    DialogModule,
    DropdownModule,
    CalendarModule,
    ToastModule,
    TooltipModule
    
  ],
  providers: [
    DatePipe,
    MessageService,
    {
      provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true
    },
    {
      provide: SETTINGS,
      useValue: {
        experimentalForceLongPolling: true // Enable Firestore long polling
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
