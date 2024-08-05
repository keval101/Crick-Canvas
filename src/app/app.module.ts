import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Firebase Modules
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
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

import { AddMatchComponent } from './components/matches/add-match/add-match.component';
import { DatePipe } from '@angular/common';
import { MatchDetailComponent } from './components/matches/match-detail/match-detail.component';
import { CoinTossComponent } from './shared/components/coin-toss/coin-toss.component';
import { PlayerDetailComponent } from './components/players/player-detail/player-detail.component';
import { MessageService } from 'primeng/api';
import { ManOfTheMatchComponent } from './components/matches/man-of-the-match/man-of-the-match.component';

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
    ManOfTheMatchComponent
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
    ToastModule
    
  ],
  providers: [
    DatePipe,
    MessageService,
    {
      provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
