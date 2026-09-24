import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ConnectionBannerComponent } from './core/ui/connection-banner.component';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, ConnectionBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class App {}
