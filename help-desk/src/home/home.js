import { inject } from 'aurelia-framework';
import { Server } from 'backend/server';

@inject(Server)
export class Home {
    constructor(server) {
        this.server = server;
        this.activity = null;
    }

    activate() {
        return Promise.all([
            this.server.getRecentActivity().then(activity => this.activity = activity),
        ]);
    }
}