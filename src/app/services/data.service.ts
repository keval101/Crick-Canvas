import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, map } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class DataService {

  constructor(private firestore: AngularFirestore) {}
  api: string;

  // --------------------------------------- Players ---------------------------------------
  getPlayers(): Observable<any> {
    return this.firestore
      .collection(`/users`)
      .snapshotChanges()
      .pipe(
        map((actions) => {
          return actions.map((a) => {
            const data: any = a.payload.doc.data();
            const id = a.payload.doc.id;
            delete data.password
            const object = {
              name: data.name,
              bowl: data.bowl,
              email: data.email,
              type: data.type,
              bat: data.bat,
              uid: data.uid,
              id: data.id,
              matches: data.matches,
            }
            return { ...object, id };
          });
        })
      );
  }

  // --------------------------------------- Trade API ---------------------------------------

  async createTeam(payload: any) {
    this.setUserId();
    const response = await this.firestore.collection(`${this.api}/teams`).add(payload);
    console.log(response)
    return response
  }

  async createMatch(payload: any) {
    const response = await this.firestore.collection(`matches`).add(payload);
    return response
  }

  getMatch(matchId: string) {
    this.setUserId();
    return this.firestore.collection(`matches`).doc(matchId).snapshotChanges()
    .pipe(
      map((doc: any) => {
        if (doc.payload.exists) {
          const data = doc.payload.data();
          const id = doc.payload.id;
          return { id, ...data };
        } else {
          return null;
        }
      })
    );
  }

  getTeams(): Observable<any> {
    this.setUserId();

    return this.firestore
      .collection(`${this.api}/teams`)
      .snapshotChanges()
      .pipe(
        map((actions) => {
          return actions.map((a) => {
            const data: any = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { ...data, id };
          });
        })
      );
  }

  getMatches(): Observable<any> {
    this.setUserId();

    return this.firestore
      .collection(`/matches`)
      .snapshotChanges()
      .pipe(
        map((actions) => {
          return actions.map((a) => {
            const data: any = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { ...data, id };
          });
        })
      );
  }

  updateMatch(payload: any) {
    console.log(payload)
    return this.firestore.collection(`/matches`).doc(payload.id).set(payload, {merge: true});
  }

  updatePlayer(payload: any) {
    return this.firestore.collection(`/users`).doc(payload.id).set(payload, {merge: true});
  }

  updateTeam(payload: any) {
    this.setUserId();
    return this.firestore.collection(`${this.api}/teams`).doc(payload.id).set(payload, {merge: true});
  }

  getPlayer(playerId: any) {
      return this.firestore.collection(`/users`).doc(playerId).snapshotChanges()
      .pipe(
        map((doc: any) => {
          if (doc.payload.exists) {
            const data = doc.payload.data();
            const id = doc.payload.id;
            return { id, ...data };
          } else {
            return null;
          }
        })
      );
    }

  async deleteMatch(matchId: string) {
    return await this.firestore.collection(`/matches`).doc(matchId).delete();
  }

  async deleteTeam(teamId: string) {
    this.setUserId();
    const response = await this.firestore.collection(`${this.api}/teams`).doc(teamId).delete();
    return response;
  }
  
  setUserId() {
    const userId = localStorage.getItem('userId');
    this.api = `users/${userId}`
  }

}