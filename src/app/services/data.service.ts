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
            console.log(data)
            const object = {
              name: data.name,
              bowl: data.bowl,
              email: data.email,
              type: data.type,
              bat: data.bat,
              uid: data.uid,
              id: data.id,
            }
            return { ...object, id };
          });
        })
      );
  }

  // --------------------------------------- Trade API ---------------------------------------
  // getTrades(): Observable<any> {
  //   this.setUserId();

  //   return this.firestore
  //     .collection(`${this.api}/trades`)
  //     .snapshotChanges()
  //     .pipe(
  //       map((actions) => {
  //         return actions.map((a) => {
  //           const data: any = a.payload.doc.data();
  //           const id = a.payload.doc.id;
  //           return { ...data, id };
  //         });
  //       })
  //     );
  // }

  async createTeam(payload: any) {
    this.setUserId();
    const response = await this.firestore.collection(`${this.api}/teams`).add(payload);
    return response
  }

  async createMatch(payload: any) {
    const response = await this.firestore.collection(`matches`).add(payload);
    return response
  }

  // updateTrade(tradeId: string, payload: any) {
  //   this.setUserId();
  //   return this.firestore
  //     .collection(`${this.api}/trades`)
  //     .doc(tradeId)
  //     .set(payload, { merge: true });
  // }

  // deleteTrade(tradeId: string) {
  //   this.setUserId();
  //   return this.firestore.collection(`${this.api}/trades`).doc(tradeId).delete();
  // }

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

  setUserId() {
    const userId = localStorage.getItem('userId');
    this.api = `users/${userId}`
  }

}