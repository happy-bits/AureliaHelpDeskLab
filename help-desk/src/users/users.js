import {inject, singleton} from 'aurelia-framework';
import {Router, RedirectToRoute} from 'aurelia-router';
import {Server} from 'backend/server';
import {CommonDialogs} from 'resources/dialogs/common-dialogs';
import {EditUserController} from './edit-user-controller';

// instead of creating everything related to the users screen in one file, it is broken up in two classes Users and EditUserController.
// Where Users class is reponsible for he screen flow: activate, canActivate etc and EditUserController everything releated to editing the user
// like validation checks, save changes, revert changes etc.

@inject(Server, Router, CommonDialogs, EditUserController)
// by default components that the router navigates to are not singletons, they are transient, meaning the when you navigate to a screen the router will create the class
// and when navigation away the router will destroy the class - new instance every time. But here we want to keep the screen and all its properties if we navigate away and back again
// to be able to show the same information after navigation. We can do this be doecrating the class with the singleton decorator from aurelia dependency injection.
@singleton()
export class Users {
  constructor(server, router, commonDialogs, controller) {
    this.server = server;
    this.router = router;
    this.commonDialogs = commonDialogs;
    this.controller = controller;
    this.controller.onSave = user => this.onSave(user);
  }

  // same as before - we going to store the active user. activeId will be kept during navigation since this is a singleton.
  canActivate(params) {
    if (!params.id && this.activeId) {
      return new RedirectToRoute('user', { id: this.activeId });
    }

    return true;
  }

  activate(params) {
    // list users
    if (!this.users) {
      return Promise.all([
        this.load(params.id),
        this.server.getUserSummaries().then(users => this.users = users)
      ]);
    } else {
      // if we have already loaded the users we will only load the specific user
      return this.load(params.id);
    }
  }

  // will load the user little differently if it's new or has an id.
  load(id) {
    if (id == 'new') {
      this.activeId = 0;
      this.controller.startTracking(this.server.createUser());
    } else if (id) {
      this.activeId = parseInt(id);
      return this.server.getUser(this.activeId).then(user => {
        this.controller.startTracking(user);
      });
    } else {
      this.activeId = 0;
      this.controller.startTracking(null);
    }
  }

  // the controller will take care of the actual saving. But the screen needs to correspond, thus we have this callback functiion which will add the saved user to the list.
  // and we will update the navigation.
  onSave(user) {
    if (this.activeId == 0) {
      this.users.unshift(user);
      this.activeId = user.id;
      this.router.navigateToRoute('user', { id: user.id }, { replace: true, trigger: false });
    } else {
      let existing = this.users.find(c => c.id == user.id);
      let index = this.users.indexOf(existing);
      this.users.splice(index, 1, user);
    }
  }

  // this will prevent users from navigate from the screen without saved changes.
  canDeactivate() {
    if (this.controller.isDirty) {
      let message = 'You have made changes. If you leave now, these changes will be lost. Do you wish to continue?';

      return this.commonDialogs.showMessage(
        message,
        'User Has Changed',
        ['Yes', 'No']
      ).then(response => !response.wasCancelled);
    }

    return true;
  }

  deactivate() {
    // revert changes
    this.controller.revert();
    // stop tracking changes
    this.controller.stopTracking();
  }
}
