import {inject, Aurelia} from 'aurelia-framework';
import {User} from 'backend/server';
import {TabOpened} from 'resources/messages/tab-opened';
import routes from './routes';
import { CommonDialogs } from 'resources/dialogs/common-dialogs';

@inject(Aurelia, User, CommonDialogs)
export class Shell {
    constructor(aurelia, user, commonDialogs) {
    this.aurelia = aurelia;
    this.user = user;
    // represent the visual tabs
    this.tabs = [];
    this.commonDialogs = commonDialogs;
  }

  configureRouter(config, router) {
    this.router = router;
    config.map(routes);
  }

  // bind - available on every component and gets called right after data binding happens.
  bind() {
    // subscribe here - we are using the subscribe() method on the aurelia object here. We could also inject the EventAggregator and call subscribe.
    // Both are fine here. They are both pointing at the same object.

    // subscribing to navigation complete event. This is an event that the Aurelia Router publishes as soon as the router has finished navigating to a new screen.
    this.navigationCompleteSub = this.aurelia.subscribe('router:navigation:complete', msg => this.onNavigationComplete(msg));
    // subscribing to the event we are publishing from thread.js
    this.tabOpenedSub = this.aurelia.subscribe(TabOpened, msg => this.onTabOpened(msg));

    // both these subscriptions are stored in properties on the class in order to dispose these in the unbind method.
  }

  unbind() {
    this.navigationCompleteSub.dispose();
    this.tabOpenedSub.dispose();
  }

  closeTab(tab) {
    let index = this.tabs.indexOf(tab);

    // tab we are closing is for some reason not in the collection anymore - return.
    if (index === -1) {
      return;
    }

    // remove it from the array
    this.tabs.splice(index, 1);

    // if the tab we are closing is not the active one - return.
    if (!tab.isActive) {
      return;
    }

    // we need to make sure we leave the UI in a good state after closing the tab. Try to get the first array in the collection
    let next = this.tabs[0];

    if (next) {
      // if we have a first tab - navigate to it.
      this.router.navigateToRoute(next.route, next.params, true);
    } else {
      // if we don't have a first tab i.e we closed the first tab - navigate home.
      this.router.navigateToRoute('home', true);
    }
  }

  logout() {
      if (this.tabs.length > 0) {
          this.commonDialogs.showMessage(
              'Tabs are open, you you want to close?',
              'Logout',
              ['Yes', 'No']
          ).whenClosed(response => {
              if (!response.wasCancelled) {
                  this._doLogout()
              }

          });

      } else {
          this._doLogout();
      }
  }

  _doLogout() {
    this.aurelia.setRoot('login/login');
    this.aurelia.container.unregister(User);
    this.router.reset();
    this.router.deactivate();
    this.tabs = [];
  }

  // event handler that takes a tab as parameter, look in tap-opened.js how it is structured as a tab we can directely push in to the array of tabs.
  onTabOpened(tab) {
    // matches a helper methos in tab-opened.js to check if the provieded tab exists (is already open). Take a look in tab-opened.js.
    let existing = this.tabs.find(x => x.matches(tab));

    // if we don't have the tab in the array, we will push it to the array. This will make sure we don't get duplicates.
    if (!existing) {
      this.tabs.push(tab);
    }
  }

  // event handler for navigation complete.
  onNavigationComplete(msg) {
    // if navigation did not comple we don't want to proceed.
    if (!msg.result.completed) {
      return;
    }

    // if navigation completed we want to check to what tab we want to navigate to by calling updateActivate() on tab-opened.js and providing it with data from the router 'msg.instruction'.
    // look at updateActivate() in tab-opened.js
    this.tabs.forEach(x => x.updateActivation(msg.instruction));
  }
}