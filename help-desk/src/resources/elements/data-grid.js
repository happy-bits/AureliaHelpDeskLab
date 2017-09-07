import {processContent, bindable, inject} from 'aurelia-framework';

@inject(Element)
// with this decorator you can hook in to Aurelia's HTML compiler, and process the content before it is begin rendered out in the browser. In this case we
// hook up our parseColumns() function to pre process the content.
@processContent(parseColumns)
export class DataGrid {
  constructor(element) {
    this.element = element;
    // event handler to handle resize
    this.onResize = () => this.size();
  }

  bind() {
    // adding the resize event listner to the window and call onResize.
    window.addEventListener('resize', this.onResize);
  }

  attached() {
    this.headerCells = this.element.getElementsByClassName('header-row')[0].children;
    this.sizingCells = this.element.getElementsByClassName('sizing-row')[0].children;
    this.size();
  }

  unbind() {
    window.removeEventListener('resize', this.onResize);
  }

  size() {
    // matching the row cells with the header size when browser window size changes.
    for(let i = 0, ii = this.headerCells.length - 1; i < ii; ++i) {
      this.sizingCells[i].style.width = this.headerCells[i].offsetWidth + 'px';
    }
  }
}

// with this function we get provided with the compiler, resource, node and instructions.
// we will only use the node in this case but with the compiler and the instruction you can
// do some very powerful things.
function parseColumns(compiler, resources, node, instruction) {
  // here we will get all the content added to data-grid.html in the node parameter.
  // We will use that as a configuration and creating a standard HTML table and removing the data-grid markup.
  let columns = node.querySelectorAll('grid-column');
  let headerCells = '';
  let dataCells = '';
  let sizingCells = '';
  let itemsExpression = node.getAttribute('items.bind');

  node.removeAttribute('items.bind');

  for (let i = 0, ii = columns.length; i < ii; ++i) {
    let column = columns[i];
    let cellTemplate;

    headerCells += '<th>' + column.getAttribute('heading') + '</th>';
    sizingCells +='<td></td>'
    cellTemplate = column.innerHTML.trim();

    if (cellTemplate) {
      dataCells += '<td>' + cellTemplate + '</td>'
    } else {
      dataCells += '<td>${item.' + column.getAttribute('property') + '}</td>';
    }
  }

  node.innerHTML = `
  <table class="grid-header table">
    <thead>
      <tr class="header-row">${headerCells}</tr>
    </thead>
  </table>
  <div class="grid-container">
    <table class="grid-rows table table-striped">
      <tbody>
        <tr class="sizing-row">${sizingCells}</tr>
        <tr repeat.for="item of ${itemsExpression}" class="item-row">${dataCells}</tr>
      </tbody>
    </table>
  </div>
  `;

  return true;
}
