import { Component } from '@angular/core';

import { AuthPage } from './auth/pages/auth-page/auth-page';

@Component({
  selector: 'app-root',
  imports: [AuthPage],
  template: '<app-auth-page />',
})
export class App {}
