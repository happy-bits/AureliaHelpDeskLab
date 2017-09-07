import {Login} from '../../../src/login/login';
import {User} from '../../../src/backend/server';

// we are using Jasmine as Unit Testing Framework here. It follows a BDD testing style
// where you can describe each section of the test in it's describe() method and each test is
// created by using the it() method.
describe('login/login', () => {
  let aurelia, server, login;
  beforeEach(() => {
    // creating a fake aurelia object to provide the Login class
    aurelia = {
      use: {
        instance: () => {}
      },
      setRoot: () => {}
    }

    // creating a fake server object to provide the Login class
    server = {
      login: (username, password) => {
        return Promise.resolve(undefined);
      }
    };

    // creating the actual system under test: Login.
    login = new Login(aurelia, server);

    // assigning username and password, these are coming from a view in a real application
    login.username = 'foo';
    login.password = 'bar1';
  });

  // the test should be self-explanatory
  it('should call login on the server with correct paramters', () => {
    // here we creating a spy. That will spy in a specific method. Later we can ask about what
    // happened to this method during the test.
    spyOn(server, 'login').and.callThrough();

    // acting
    login.login();

    // here we asserting that the server's login method was called with correct parameters.
    expect(server.login).toHaveBeenCalledWith('foo', 'bar1');
  });

  // here we are doing something little different. Since we are dealing with async code where
  // server.login() returns a promise, and we want to test what the code does after the promise has resolved
  // we need to tell Jasmin to not finish the testing before we tell it it's done. That is performed
  // by passing a done function to the test, and when the promise is resolved we do our assertions
  // and call done() by hand.
  it('should add error message when login fails', (done) => {
    login.login().then(() => {
      expect(login.message.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should have no error message when login succeeds', (done) => {
    // here we need to create a different fake server, that actually returns a result in order
    // to get into that truthy if branch.
    server = {
      login: (username, password) => {
        return Promise.resolve({});
      }
    };
    login = new Login(aurelia, server);

    login.login().then(() => {
      expect(login.message.length).toBe(0);
      done();
    });
  });

  it('should register logged in user with the DI', (done) => {
    let loggedInUser = {
      name: 'Foo'
    };
    server = {
      login: (username, password) => {
        return Promise.resolve(loggedInUser);
      }
    };
    login = new Login(aurelia, server);

    spyOn(aurelia.use, 'instance');

    login.login().then(() => {
      expect(aurelia.use.instance).toHaveBeenCalledWith(User, loggedInUser);
      done();
    });
  });

  it('should set shell as the application root on successful login', (done) => {
    server = {
      login: (username, password) => {
        return Promise.resolve({});
      }
    };
    login = new Login(aurelia, server);

    spyOn(aurelia, 'setRoot');

    login.login().then(() => {
      expect(aurelia.setRoot).toHaveBeenCalledWith('shell/shell');
      done();
    });
  });
});
