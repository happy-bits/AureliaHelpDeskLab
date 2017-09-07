import {bindable, bindingMode, inject, noView, TaskQueue} from 'aurelia-framework';

// We are using a 3:rd party rich text editor that is pretty popular. it's a legacy project
// without the notion of modules, thus we added it with a script tag in index.html. No need to import this project
// since it manipulates the global object and we can just use CKEDITOR. Not ideal to work with these legacy project
// but often in realy world applications you have to face 3:rd party libraries like this.
// Here we are configuring the skin.
CKEDITOR.config.skin = 'bootstrapck';

// Injecting Element - which is the actual rich text editor html element. You can inject the element on all custom element and custom attributes to get hold of the element
// that is the custom element or the attribute is placed on. This is a seperation of concerns, you don't have to query the dom to locate the element or anything. You can
// else replace Element with a fake object in a unit test. This is an example of "Composition over inheritance" which is a common principle in object-oriented programming.

// TaskQueue - Is a service in aurelia to easily handle varius asynchronous tasks. It can queu two types of tasks; microtasks and macrotasks.
// This library is used a lot by Aurelia internally in the data binding and a also a little in the templating. But it's also public meaning you get to
// use it in your own application when needed as you will see in this class.
// Read more on microtasks and macrotasks here: https://stackoverflow.com/a/25933985.
@inject(Element, TaskQueue)

// noView decorator - usually when create a custom element you have a view model and a view. But in this case we don't need a view since the CKEDITOR will provide the html.
@noView()
export class RichTextEditor {
  // by default custom elements attributes have one way binding mode. by that means data can only flow from outside of the element into the element.
  // since this is a form element we will need two way data binding.
  @bindable({ defaultBindingMode: bindingMode.twoWay }) value;

  constructor(element, taskQueue) {
    this.element = element;
    this.taskQueue = taskQueue;
    this.guard = false;
  }

  // when this view is destroyed we want to also destroy the CKEDITOR that we set up un the bind() method. Typically we destroy the editor in
  // a detached or unbind callback which is called when the element is detached from the dom. But the CKEDITOR for some strange reason needs to be in the dom
  // in order to be destroyed. So here is a little hack to handle that.
  // This will get called from the parent view, in our case the thread view, we will get pass along the view, locate the editor and call destroy() (which is a CKEDITOR API)
  // This is pretty uncommon code needed, and it is a hack of the framework. But sometimes you have these weird/old 3:rd party libraries and have to deal with them.
  created(owningView) {
    let original = owningView.removeNodes;
    let that = this;

    owningView.removeNodes = () => {
      this.editor.destroy();
      original.call(owningView);
    };
  }

  bind() {
    // initializing the CKEDITOR. This is where we need the injected element. Passing this.value wich is created a bindable property above
    this.editor = CKEDITOR.appendTo(this.element, { removePlugins: 'resize, elementspath' }, this.value);

    // this is some stuff releated to the CKEDITOR api. Where we subscribe to it's change event.
    this.editor.on('change', () => {
      // we are pulling the value out from the 3:rd party control.
      let newValue = this.editor.getData();

      // if value has not changed we return.
      // this can actually happen in a 3:rd party tool like this. Where a change can be fired multiple times.
      // we want to be efficient and handle that.
      if(this.value === newValue) {
        return;
      }

      // the guard propery is a little hack to prevent the binding system from calling it self again and again over and over again.
      // You only have to worry about this when you have a custom element that is binding two way and are subscribing to a 3:rd pary library async events
      // where the data need to syncronize between the 3:rd party library and Aurelia.
      this.guard = true;
      // syncronize the value. This is two way bound. And the data bining will queue this to the microtask queue. We can't simply set gurad to true right after this, then
      // the guard will be false before the update has been handled. We also need to queue, to make sure gurad is set to false in the right order.
      this.value = newValue; // <- This gets queued up.
      this.taskQueue.queueMicroTask(() => this.guard = false); // <- Then this gets queued up.
    });
  }

  valueChanged(newValue, oldValue) {
    // This is where guard comes in to place. Then we update the value, the data binding system will call valueChanged. We need to guard to not have it update it self over and over again.
    if (this.guard || !this.editor) {
      return;
    }

    // when end user updates the value we also need to update.
    this.editor.setData(newValue);
  }
}