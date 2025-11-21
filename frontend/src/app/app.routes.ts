import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ParentDashboardComponent } from './components/parent-dashboard/parent-dashboard.component';
import { KidBoardComponent } from './components/kid-board/kid-board.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'dashboard', component: ParentDashboardComponent },
  { path: 'board/:id', component: KidBoardComponent }
];
