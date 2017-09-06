import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {RedirectToRoute, Router} from 'aurelia-router';
import {CommonDialogs} from 'resources/dialogs/common-dialogs';
import {TabOpened} from 'resources/messages/tab-opened';
import {Server, User} from 'backend/server';

// Server - to load up a ticket
// Router - we need to work with the navigation system
// CommonDialogs - to show prompts and message boxes
// EventAggregator - Pub/sub between shell and thread screen
// User - we need some information about current logged in user
@inject(Server, Router, CommonDialogs, EventAggregator, User)
export class Thread {
  constructor(server, router, commonDialogs, eventAggregator, user) {
    this.server = server;
    this.router = router;
    this.commonDialogs = commonDialogs;
    this.eventAggregator = eventAggregator;
    this.user = user;
  }

  getParticipant(id) {
    return this.ticket.participants.find(x => x.id == id);
  }

  save() {
    let isNew = this.ticket.id == 0;
    this.server.saveTicket(this.ticket).then(ticket => {
      this.ticket = ticket;

      if (isNew) {
        // if we have a new ticket we need to reflect the this in the address bar and update the URL
        this.router.navigateToRoute('thread', {id: ticket.id}); // { replace: true, trigger: false }?
        // publishing an event the we have opened a tab. Not opened at first because we don't have an id.
        this.eventAggregator.publish(new TabOpened(ticket.title, 'thread', { id: ticket.id }));
      }
    });
  }

  // submitting the status of the ticket - solved, in progress etc
  submit(status) {
    if (this.message) {
      // make sure its in the list
      if (!this.getParticipant(this.user.id)) {
        this.ticket.participants.push(this.user);
      }

      // push the message into the list of post and associate it with the current user
      this.ticket.posts.unshift({
        createdAt: new Date(),
        fromId: this.user.id,
        content: this.message
      });

      // clear out the message in the UI
      this.message = '';
    }

    // update status and save the ticket
    this.ticket.status = status;
    this.save();
  }

  // important and some advanced navigation handling
  canActivate(params) {

    // Anropas först (innan "activate" och innan vyn visas)

    // if its a new ticket we want to treat it little different - from query string
    if (params.id == 'new') {
      // we also want to check if its a title - from query string
      if (params.title) {
        // if there is a title we want to create a new ticket with that title
        this.ticket = this.server.createTicket(params.title);
        // associate the ticket with user
        this.from = this.getParticipant(this.ticket.fromId);
        // yes we can now activate the screen
        return true;
      }

      // if no title we want to prompt the user and the user tell us what the title should be
      return this.commonDialogs.prompt('What would you like to name the ticket?').whenClosed(response => {
        if (response.wasCancelled) {
          // no title - we can't activate the screen
          return false;
        }

        // however if we get a title we don't want to return true or false but a  RedirectToRoute result (coming from the router, check imports at top)
        // and provide with parameters id = new and the title. output is whatever you pass the input to the dialog.
        return new RedirectToRoute('thread', { id: 'new', title:  response.output});
      });
    }

    // if its not a new ticket we will need to parse the id and try to load the ticket from the server
    return this.server.getTicketDetails(parseInt(params.id)).then(ticket => {

      // När du tittar på en befintlig nyhet hamnar du här

      if (ticket) {
        // store ticket
        this.ticket = ticket;
        // get user
        this.from = this.getParticipant(ticket.fromId);
        // publish event that a tab opened

        // Öppna en ny tab

        this.eventAggregator.publish(new TabOpened(ticket.title, 'thread', { id: ticket.id }));
        return true;
      }

      // if invalid id is provided we will get null back from server and redirect the user back to the home route
      return new RedirectToRoute('home');
    });
  }

  activate(params) {

    // Anropas innan vyn visas

    this.message = '';
  }

  canDeactivate() {

    // Anropas när vi lämnar sidan

    // check if ticket has been posted without a status
    if (this.ticket.id === 0) {
      let message = 'You have created a ticket but have not yet posted it with a status. If you leave now, your work will be lost. Do you wish to continue?'

      // propmt the user and confirm if the want to continue or not
      return this.commonDialogs.showMessage(
        message,
        'Ticket Not Saved',
        ['Yes', 'No']
      ).whenClosed(response => !response.wasCancelled);
    }

    // all good - we can  deactivate the screen
    return true;
  }
}
