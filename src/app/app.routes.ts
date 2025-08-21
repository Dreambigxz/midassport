import { Routes } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { MainComponent } from './main/main.component';
import { BetslipComponent } from './betslip/betslip.component';
import { TicketsComponent } from './tickets/tickets.component';
import { SearchComponent } from './search/search.component';
import { PromotionsComponent } from './promotions/promotions.component';
import { PromotionUsersComponent } from './promotions/users/users.component';
import { DepositComponent } from './wallet/deposit/deposit.component';
import { WithdrawComponent } from './wallet/withdraw/withdraw.component';
import { TransactionsComponent } from './wallet/transactions/transactions.component';
import { LoginComponent } from "./auth/login/login.component";
import { RegisterComponent } from "./auth/register/register.component";
import { ForgetPasswordComponent } from "./auth/forget-password/forget-password.component";
import { ProfileComponent } from "./profile/profile.component";
import { InviteRewardsComponent } from "./promotions/invite-rewards/invite-rewards.component";
import {NotificationsComponent} from './notifications/notifications.component'
import {PaymentConfirmationComponent} from './payment-confirmation/payment-confirmation.component'
import { authGuard } from './reuseables/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'search',
    component: SearchComponent,
    title: 'Search'
  },
  {
    path: 'main',
    component: MainComponent,
    title: 'Main',
    canActivate: [authGuard]
  },
  {
    path: 'betslip/:id',
    component: BetslipComponent,
    title: 'Slip',
    canActivate: [authGuard]
  },
  {
    path: 'tickets',
    component: TicketsComponent,
    title: 'Manage-Tickets',
    canActivate: [authGuard],
  },
  {
    path: 'promotions',
    component: PromotionsComponent,
    title: 'Promotions',
    canActivate: [authGuard],
    children: [

    ]
  },
  {
    path: 'promotions/:level',
    component: PromotionUsersComponent,
    title: 'Level',
    canActivate: [authGuard]
  },

  {
    path: 'invite-rewards',
    component: InviteRewardsComponent,
    title: 'Invite-Rewards',
    canActivate: [authGuard]

  },

  // wallet
  {
    path: 'wallet',
    title: 'Wallet',
    canActivate: [authGuard],
    children: [
      {
        path: 'deposit',
        component: DepositComponent,
        title: 'Deposit',
      },
      {
        path: 'withdraw',
        component: WithdrawComponent,
        title: 'Withdraw',
      },
      {
        path: 'transactions',
        component: TransactionsComponent,
        title: 'Transactions'
      },
      {
        path: 'transactions/:filter',
        component: TransactionsComponent,
        title: 'Transactions'
      }
    ]
  },
  // Default route (root)
  {
    path: '',
    redirectTo: '/main',
    pathMatch: 'full'
  },
  {
    path: 'profile',
    component: ProfileComponent,
    title: 'Profile',
    canActivate: [authGuard]
  },

  {
    path:'notifications',
    component:NotificationsComponent,
    title:"Notification",
    canActivate: [authGuard]

  },
  {
    path: 'confirm-payment',
    component: PaymentConfirmationComponent,
    title: 'Confirmation',
    canActivate: [authGuard]

  },
  // AUTH
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login'
  },
  {
    path: 'register',
    component: RegisterComponent,
    title: 'Register'
  },
  {
    path: 'forgot-password',
    component: ForgetPasswordComponent,
    title: 'Reset Password'
  },

  // 404 fallback
  {
    path: '**',
    redirectTo: '/main',
    pathMatch: 'full'
  }
];
