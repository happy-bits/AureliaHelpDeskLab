export class TabOpened {
  constructor(title, route, params) {
    this.title = title;
    this.route = route;
    this.params = params || {};
    this.isActive = true;
  }

  updateActivation(instruction) {
    // if this tabs route does not match the provided route name, it is not active - return - we are deactivating it so it doesn't get highlighted.
    if (this.route !== instruction.config.name) {
      this.isActive = false;
      return;
    }

    let params = instruction.params;

    // loop through all the params of this tab, if no match we are going to deactivate this tab.
    for(let key in params) {
      if (params[key] !== this.params[key].toString()) {
        this.isActive = false;
        return;
      }
    }
    // if we reach this far we have a match. Activate this tab.
    this.isActive = true;
  }

  matches(other) {
    if (this.route !== other.route) {
      return false;
    }

    for(let key in other.params) {
      if (other.params[key] !== this.params[key]) {
        return false;
      }
    }

    return true;
  }
}