import {inject} from 'aurelia-dependency-injection';
import {Aurelia} from 'aurelia-framework';
import {Server, User} from 'backend/server';

@inject(Aurelia, Server)
export class Login {
  constructor(aurelia, server) {
    this.aurelia = aurelia;
    this.server = server;
    this.username = '';
    this.password = '';
    this.message = '';
  }

  login() {
    this.server.login(this.username, this.password).then(result => {
      if (result) {
        this.message = 'Login Succeeded';
        this.aurelia.setRoot('shell/shell');
        this.aurelia.use.instance(User, result);
      } else {
        this.message = 'Incorrect Username or Password!';
      }
    });
  }
}
