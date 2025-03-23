import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  
  constructor(private firestore: AngularFirestore) {}

  // Convert image Blob to Base64 string and store it in Firestore
  convertBlobToBase64(blob: Blob): Observable<any> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        observer.next(base64String);
        observer.complete();
      };
      reader.onerror = (error) => {
        observer.error(error);
      };
      reader.readAsDataURL(blob);  // Convert the Blob to Base64 string
    });
  }

  // Save Base64 image data to Firestore
  saveImageDataToFirestore(collectionName: string, documentId: string, base64ImageData: string): Promise<void> {
    return this.firestore.collection(collectionName).doc(documentId).set({
      image: base64ImageData,
      timestamp: new Date()
    });
  }
}
