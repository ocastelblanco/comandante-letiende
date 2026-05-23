import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="products">
          <ion-icon name="cube-outline" />
          <ion-label>Productos</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="users">
          <ion-icon name="people-outline" />
          <ion-label>Usuarios</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class AdminComponent {}
