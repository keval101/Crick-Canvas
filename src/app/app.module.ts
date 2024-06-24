import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Firebase Modules
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';

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
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    //Firebase
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
