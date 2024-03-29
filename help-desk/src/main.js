import environment from './environment';

export function configure(aurelia) {
  aurelia.use
    .standardConfiguration()
    .plugin('aurelia-dialog')
    .feature('resources');

  if (environment.debug) {
    aurelia.use.developmentLogging();
  }

  if (environment.testing) {
    aurelia.use.plugin('aurelia-testing');
  }

  aurelia.start().then(() => aurelia.setRoot('login/login'));
}
