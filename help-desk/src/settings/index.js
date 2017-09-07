import routes from './routes';

export class SettingsIndex {
  configureRouter(config, router) {
    this.router = router;
    config.map(routes);
  }
}

// This is a third way of creating registering a value converter to simply put it in the same file as the view-model. It will get registered automatically and
// only anailable to this screen. Oppose to create it in the resoucre folder register it globally or requier it, this can become handy when you have
// a very spcific value converter for only that particular screen.
export class CategoriesValueConverter {
  toView(navModels) {
    let categories = new Map();

    for(let model of navModels) {
      let routes = categories.get(model.settings.category);

      if (!routes) {
        categories.set(model.settings.category, routes = []);
      }

      routes.push(model);
    }

    return categories;
  }
}