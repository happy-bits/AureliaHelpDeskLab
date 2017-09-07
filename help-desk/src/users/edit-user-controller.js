import { transient, inject, NewInstance } from 'aurelia-framework';
import { ValidationRules, ValidationController, validateTrigger } from 'aurelia-validation';
import { BootstrapFormRenderer } from 'resources/bootstrap-form-renderer';
import { Server } from 'backend/server';

// tell dependeny injection that this is should be a new instance everytime.
@transient()
// the dependency injection will use resolvers to resolve an instance in a particular way. Either default one or the one that the type is registered with.
// but there is also a third way at the injection level override whatever is configured. In this case we want to have a new instance of Validation Controller
// everytime no matter of how the ValidationController is registered. You can read documentation on all resolvers that come with Aurelia. You can also
// create your own custom resolvers.
@inject(Server, NewInstance.of(ValidationController))
export class EditUserController {
  constructor(server, validationController) {
    this.server = server;
    this.validationController = validationController;
    // validate property everytime input changes, default is on blur.
    this.validationController.validateTrigger = validateTrigger.change;
    // here we are bringing in our bootstrap renderer
    this.validationController.addRenderer(new BootstrapFormRenderer());
    this.onSave = function () { };
  }

  get isValid() {
    return this.validationController.errors.length === 0;
  }

  startTracking(original) {
    if (original) {
      this.stopTracking();
      this.original = original;
      this.originalJSON = JSON.stringify(original);
      this.isDirty = false;
      this.editable = original.clone();
      // we only editing a copy, and storing the original in order to revert changes and check if the form is dirty (has any changes)

      // creating validation rules for each field
      ValidationRules
        .ensure('firstName').displayName('First Name')
        .required()
        .minLength(3)
        .maxLength(10)
        .ensure('lastName').displayName('Last Name')
        .required()
        .minLength(3)
        .maxLength(10)
        .ensure('email').displayName('Email')
        .required()
        .email()
        .on(this.editable); // apply the rules on the copy object

      this.validationController.reset();

      // here we checking if form is dirty every halv second by comparing the original and copy object.
      this._timer = setInterval(() => {
        var currentJSON = JSON.stringify(this.editable);
        if (currentJSON !== this.originalJSON) {
          this.isDirty = true;
        } else if (this.isDirty) {
          this.isDirty = false;
        }
      }, 500);
    } else {
      this.original = this.editable = null;
    }
  };

  stopTracking() {
    clearInterval(this._timer);
  }

  validate() {
    return this.validationController.validate();
  }

  toggleActiveStatus() {
    this.editable.isActive = !this.editable.isActive;
  }

  commit(other) {
    this.stopTracking();
    Object.assign(this.original, other || this.editable);
    this.startTracking(this.original);
  }

  revert() {
    this.startTracking(this.original);
  }

  // validate before save
  save() {
    return this.validate().then(result => {
      if (!result.valid) {
        return;
      }

      return this.server.saveUser(this.editable).then(user => {
        this.commit(user);
        this.onSave(user);
      });
    });
  }
}
