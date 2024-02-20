(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function createConnectingWidget (execlib, applib) {
  'use strict';

  var lib = execlib.lib,
    lR = execlib.execSuite.libRegistry,
    bslib = lR.get('allex_bootstrapwebcomponent'),
    timerlib = lR.get('allex_timerlib'),
    templateslib = lR.get('allex_templateslitelib'),
    htmltemplateslib = lR.get('allex_htmltemplateslib'),
    ModalElement = applib.getElementType('BSModalDivElement'),
    o = templateslib.override,
    m = htmltemplateslib,
    bufferedlib = lR.get('allex_bufferedtriggerlib');

  function innerMarkup (options) {
    return [
      o(m.h5
        , 'CONTENTS', ['Connecting to the System', '<hr/>']
      ),
      o(m.div
        , 'CONTENTS', [
          o(m.span
            , 'ATTRS', 'connectingelement="Attempt"'
            , 'CLASS', 'connectionattempt'
            , 'CONTENTS', 'Attempt'
          ),
          o(m.span
            , 'ATTRS', 'connectingelement="Duration"'
            , 'CLASS', 'connectionattemptduration'
            , 'CONTENTS', ''
          )
        ]
      )
    ];
  }

  function markup (options) {
    return bslib.markups.modalMarkup(lib.extend({
      noheader: true,
      nofooter: true,
      class: 'connectingwidget',
      caption: innerMarkup(options)
    }, options));
  }

  function ModalConnectingWidgetElement (id, options) {
    options.default_markup = markup(options ? options.gui : null);
    options.elements = [{
      name: 'Attempt',
      type: 'WebElement',
      options: {
        actual: true,
        self_selector: 'attrib:connectingelement'
      }
    },{
      name: 'Duration',
      type: 'WebElement',
      options: {
        actual: true,
        self_selector: 'attrib:connectingelement'
      }
    }]
    ModalElement.call(this, id, options);
    this.waiter = new bufferedlib.BufferedWaiter(this.updateDuration.bind(this), 100);
    this.timer = null;
    this.counter = null;
    this.connectionAttempt = null;
  }
  lib.inherit(ModalConnectingWidgetElement, ModalElement);
  ModalConnectingWidgetElement.prototype.__cleanUp = function () {    
    this.connectionAttempt = null;
    this.counter = null;
    if (this.timer) {
      this.timer.destroy();
    }
    this.timer = null;
    if (this.waiter) {
      this.waiter.destroy();
    }
    this.waiter = null;
    ModalElement.prototype.__cleanUp.call(this);
  };
  ModalConnectingWidgetElement.prototype.set_connectionAttempt = function (ca) {
    var valid = lib.isNumber(ca);
    this.connectionAttempt = ca;
    this.set('actual', valid);
    console.log('connectionAttempt', ca, 'actual', this.get('actual'));
    if (this.timer) {
      this.timer.destroy();
    }
    this.timer = null;
    if (!valid) {
      return;
    }
    this.getElement('Attempt').set('text', ca ? 'Attempt #'+ca : 'Initial attempt');
    this.counter = 0;
    this.timer = new timerlib.Timer(this.onTimer.bind(this), lib.intervals.Second, true);
    return true;
  };
  ModalConnectingWidgetElement.prototype.onTimer = function () {
    this.waiter.trigger(this.counter++);
  };
  ModalConnectingWidgetElement.prototype.updateDuration = function (cnt) {
    this.getElement('Duration').set('text', (this.counter)+'s');
  };

  applib.registerElementType('ModalConnectingWidget', ModalConnectingWidgetElement);
}
module.exports = createConnectingWidget;
},{}],2:[function(require,module,exports){
function createExecLogElement (execlib, applib) {
  'use strict';

  var lib = execlib.lib,
    lR = execlib.execSuite.libRegistry,
    o = lR.get('allex_templateslitelib').override,
    m = lR.get('allex_htmltemplateslib');

  var browserlib = lR.get('allex_browserwebcomponent');

  var ClickableElement = applib.getElementType('ClickableElement');
  
  function ExecLogElement (id, options) {
    options = options || {};
    ClickableElement.call(this, id, options);
  }
  lib.inherit(ExecLogElement, ClickableElement);
  ExecLogElement.prototype.__cleanUp = function () {
    ClickableElement.prototype.__cleanUp.call(this);
  };
  ExecLogElement.prototype.staticEnvironmentDescriptor = function (myname) {
    return lib.extendWithConcat(ClickableElement.prototype.staticEnvironmentDescriptor.call(this, myname)||{}, {
      elements: [{
        name: myname+'.Display',
        type: 'ExecLogDisplay',
        options: {
          actual: false,
          force_dom_parent: 'body',
          self_selector: 'attrib:executionlog_element',
          environmentname: this.getConfigVal('environmentname')
        }
      }]
    });
  };
  ExecLogElement.prototype.actualEnvironmentDescriptor = function (myname) {
    if (browserlib.isInIFrame()) {
      window.addEventListener('message', onParentMessage.bind(this));
    }
    return lib.extendWithConcat(ClickableElement.prototype.actualEnvironmentDescriptor.call(this, myname)||{}, {
      logic: [{
        triggers: 'environment.'+this.getConfigVal('environmentname')+':executionLog',
        references: 'element.'+myname+'.Display.Grid',
        handler: this.onLog.bind(this)
      },{
        triggers: 'element.'+myname+'!clicked',
        references: 'element.'+myname+'.Display',
        handler: function (disp, clickignored) {
          disp.set('actual', true);
        }
      }]
    });
  };
  ExecLogElement.prototype.onLog = function (grid, log) {
    grid.set('data', log);
    var stats = (log||[]).reduce(stater, {calls: 0, active: 0, succeeded: 0, failed: 0, failednotseen: 0});
    this.set('tooltip', [
      'Calls: '+stats.calls,
      'Active: '+stats.active,
      'Succeeded: '+stats.succeeded,
      'Failed: '+stats.failed
    ].join('\n'));
    this.$element.css({
      'background-color': stats.active ? 'orange' : (stats.failednotseen ? 'red' : 'green')
    });
    if (browserlib.isInIFrame()) {
      window.parent.postMessage({execLogStats:stats}, '*');
    }
  };

  function stater (res, line) {
    res.calls++;
    if (!line.finished) {
      res.active++;
    } else {
      if (line.error) {
        res.failed++;
        if (!line.seen) {
          res.failednotseen++;
        }
      } else if (lib.defined(line.result)) {
        res.succeeded++
      }
    }
    return res;
  }

  //statics on ExecLogElement
  function onParentMessage (evnt) {
    if (!(evnt && evnt.data && evnt.data.request=='showExecLog')) {
      return;
    }
    if (!(this.$element && this.$element.length>0)) {
      return;
    }
    this.$element.trigger('click');
  }
  //endof statics on ExecLogElement
  
  applib.registerElementType('ExecLog', ExecLogElement);
}
module.exports = createExecLogElement;
},{}],3:[function(require,module,exports){
function createExecLogDisplayElement (execlib, applib) {
  'use strict';

  var lib = execlib.lib,
    lR = execlib.execSuite.libRegistry,
    o = lR.get('allex_templateslitelib').override,
    m = lR.get('allex_htmltemplateslib');

  var browserlib = lR.get('allex_browserwebcomponent');
  var OffCanvasElement = applib.getElementType('OffCanvasElement');

  function timeRenderer (params) {
    if (!params.value) {return null;}
    return moment(params.value).format('HH:mm:ss')
  }
  function complexContentsRenderer (params) {
    var val = params.value;
    if (lib.isString(val)) return val;
    if (lib.isNumber(val)) return val;
    if (lib.isBoolean(val)) return val;
    if (!val) return val;
    if (lib.isArray(val)) {
      return 'Array('+val.length+')';
    }
    return '<Complex Object>';
  }
  function complexContentTooltipValueGetter (params) {
    var val = params.value;
    if (lib.isString(val)) return null;
    if (lib.isNumber(val)) return null;
    if (lib.isBoolean(val)) return null;
    if (lib.isArray(val) && val.length<1) return null;
    if (!val) return null;
    return val;
  }

  function ComplexContentsTooltip () {
    this.gui = null;
  }
  ComplexContentsTooltip.prototype.init = function (params) {
    var val = params.value;
    this.gui = document.createElement('div');
    this.gui.style['background-color'] = 'beige';
    this.gui.style['overflow-y'] = 'auto';
    this.gui.innerHTML = '<pre>'+JSON.stringify(val, undefined, 2)+'</pre>';
  };
  ComplexContentsTooltip.prototype.getGui = function () {
    return this.gui;
  };

  function errorRenderer (params) {
    if (!params.value) return null;
    var code = params.value.code;
    var msg = params.value.message;
    if (msg && code) {
      return msg+' ('+code+')';
    }
    if (code) {
      return code;
    }
    return msg ;
  }
  function ErrorTooltip () {
    this.gui = null;
  }
  ErrorTooltip.prototype.init = function (params) {
    var val = params.value;
    this.gui = document.createElement('div');
    this.gui.style['background-color'] = 'beige';
    this.gui.style['overflow-y'] = 'auto';
    this.gui.innerHTML = '<pre>'+val+'</pre>';
  };
  ErrorTooltip.prototype.getGui = function () {
    return this.gui;
  };

  function ExecLogDisplayElement (id, options) {
    OffCanvasElement.call(this, id, options);
    this.shouldMarkErrorSeen = this.createBufferableHookCollection();
  }
  lib.inherit(ExecLogDisplayElement, OffCanvasElement);
  ExecLogDisplayElement.prototype.__cleanUp = function () {
    if(this.shouldMarkErrorSeen) {
       this.shouldMarkErrorSeen.destroy();
    }
    this.shouldMarkErrorSeen = null;
    OffCanvasElement.prototype.__cleanUp.call(this);
  };
  ExecLogDisplayElement.prototype.staticEnvironmentDescriptor = function (myname) {
    return lib.extendWithConcat(OffCanvasElement.prototype.staticEnvironmentDescriptor.call(this, myname)||{}, {
      elements: [{
        name: myname+'.ClearAllExceptErrors',
        type: 'ClickableElement',
        options: {
          actual: true,
          self_selector: 'attrib:execlogdisplayelement',
        }
      },{
        name: myname+'.ClearAll',
        type: 'ClickableElement',
        options: {
          actual: true,
          self_selector: 'attrib:execlogdisplayelement',
        }
      },{
        name: myname+'.Grid',
        type: 'AgGrid',
        options: {
          actual: true,
          self_selector: 'attrib:execlogdisplayelement',
          contextmenu: {
            class: 'dropdown-menu',
            item: {
              class: 'dropdown-item'
            },
            items: this.createCtxMenuDescriptor.bind(this)
          },
          aggrid: {
            tooltipShowDelay: 0,
            rowClassRules: {
              'error-seen': function (params) {return params.data.error && params.data.seen},
              'error-unseen': function (params) {return params.data.error && !params.data.seen}
            },
            columnDefs: [{
              field: 'name',
              resizable: true
            },{
              field: 'started',
              valueFormatter: timeRenderer
            },{
              field: 'finished',
              valueFormatter: timeRenderer
            },{
              field: 'result',
              valueFormatter: complexContentsRenderer,
              tooltipComponent: ComplexContentsTooltip,
              tooltipValueGetter: complexContentTooltipValueGetter
            },{
              field: 'error',
              resizable: true,
              valueFormatter: errorRenderer,
              tooltipComponent: ErrorTooltip,
              tooltipValueGetter: errorRenderer
            }]
          }
        }
      }]
    });
  };
  ExecLogDisplayElement.prototype.actualEnvironmentDescriptor = function (myname) {
    return lib.extendWithConcat(OffCanvasElement.prototype.actualEnvironmentDescriptor.call(this, myname)||{}, {
      logic: [{
        triggers: 'element.'+myname+'.ClearAllExceptErrors!clicked',
        references: 'environment.'+this.getConfigVal('environmentname')+'>clearExecutionLog',
        handler: function (clearer) {
          clearer({keeperrors: true});
        }
      },{
        triggers: 'element.'+myname+'.ClearAll!clicked',
        references: 'environment.'+this.getConfigVal('environmentname')+'>clearExecutionLog',
        handler: function (clearer) {
          clearer();
        }
      },{
        triggers: 'element.'+myname+'!shouldMarkErrorSeen',
        references: 'environment.'+this.getConfigVal('environmentname')+'>markErrorSeen',
        handler: function (marker, record) {
          if (!record) {
            return;
          }
          record.seen = true;
          marker(record);
        }
      }]
    });
  };
  ExecLogDisplayElement.prototype.createCtxMenuDescriptor = function (params) {
    var rownode = params.rowNode,
      rowval = rownode.data,
      cellval = rowval[params.column.colId],
      gridval = this.getElement('Grid').get('data');
    var ret = [{
      caption: 'Copy Cell Contents to Clipboard',
      action: plainCopier.bind(this, cellval)
    },{
      caption: 'Copy Row Contents to Clipboard',
      action: plainCopier.bind(this, rowval)
    }/*,{
      caption: 'Copy All Rows to Clipboard',
      action: arryCopier.bind(this, gridval)
    }*/];
    if (rowval.error && !rowval.seen) {
      ret.push({
        caption: 'Mark Error as Seen',
        action: errorSeeer.bind(this, rownode)
      });
    }
    rownode = null;
    rowval = null;
    cellval = null;
    gridval = null;
    return ret;
  };

  function plainCopier (val) {
    browserlib.copyToClipboard(JSON.stringify(val, null, 2), this.$element[0]);
  }
  function arryCopier (arry, index, str) {
    index = index || 0;
    if (index>=arry.length) {
      browserlib.copyToClipboard('[\n'+(str||'')+'\n]', this.$element[0]);
      return;
    }
    lib.runNext(arryCopier.bind(this, arry, index+1, lib.joinStringsWith(str, JSON.stringify(arry[index], null, 2), '\n')));
  }
  function errorSeeer (rownode) {
    rownode.data.seen = true;
    rownode.updateData(rownode.data);
    this.shouldMarkErrorSeen.fire(rownode.data);
  }
  
  applib.registerElementType('ExecLogDisplay', ExecLogDisplayElement);
}
module.exports = createExecLogDisplayElement;
},{}],4:[function(require,module,exports){
function createExecLogSharedWithParentWindowElement (execlib, applib) {
  'use strict';

  var lib = execlib.lib,
    lR = execlib.execSuite.libRegistry,
    o = lR.get('allex_templateslitelib').override,
    m = lR.get('allex_htmltemplateslib');

  var browserlib = lR.get('allex_browserwebcomponent');

  var BasicElement = applib.BasicElement;
  
  function ExecLogSharedWithParentWindowElement (id, options) {
    options = options || {};
    BasicElement.call(this, id, options);
  }
  lib.inherit(ExecLogSharedWithParentWindowElement, BasicElement);
  ExecLogSharedWithParentWindowElement.prototype.__cleanUp = function () {
    BasicElement.prototype.__cleanUp.call(this);
  };
  ExecLogSharedWithParentWindowElement.prototype.staticEnvironmentDescriptor = function (myname) {
    return lib.extendWithConcat(BasicElement.prototype.staticEnvironmentDescriptor.call(this, myname)||{}, {
      elements: [{
        name: myname+'.Display',
        type: 'ExecLogDisplay',
        options: {
          actual: false,
          force_dom_parent: 'body',
          nocontroller: true,
          self_selector: 'attrib:executionlog_element',
          environmentname: this.getConfigVal('environmentname')
        }
      }]
    });
  };
  ExecLogSharedWithParentWindowElement.prototype.actualEnvironmentDescriptor = function (myname) {
    if (browserlib.isInIFrame()) {
      window.addEventListener('message', onParentMessage.bind(this));
    }
    return lib.extendWithConcat(BasicElement.prototype.actualEnvironmentDescriptor.call(this, myname)||{}, {
      logic: [{
        triggers: 'environment.'+this.getConfigVal('environmentname')+':executionLog',
        references: 'element.'+myname+'.Display.Grid',
        handler: this.onLog.bind(this)
      }]
    });
  };
  ExecLogSharedWithParentWindowElement.prototype.onLog = function (grid, log) {
    grid.set('data', log);
    var stats = (log||[]).reduce(stater, {calls: 0, active: 0, succeeded: 0, failed: 0, failednotseen: 0});
    if (browserlib.isInIFrame()) {
      window.parent.postMessage({execLogStats:stats}, '*');
    }
  };

  function stater (res, line) {
    res.calls++;
    if (!line.finished) {
      res.active++;
    } else {
      if (line.error) {
        res.failed++;
        if (!line.seen) {
          res.failednotseen++;
        }
      } else if (lib.defined(line.result)) {
        res.succeeded++
      }
    }
    return res;
  }

  //statics on ExecLogSharedWithParentWindowElement
  function onParentMessage (evnt) {
    var disp;
    if (!(evnt && evnt.data && evnt.data.request=='showExecLog')) {
      return;
    }
    try {
      disp = this.getElement('Display');
      disp.set('actual', false);
      disp.set('actual', true);
    } catch(e) {
      var a = e;
    }
  }
  //endof statics on ExecLogSharedWithParentWindowElement
  
  applib.registerElementType('ExecLogSharedWithParentWindow', ExecLogSharedWithParentWindowElement);
}
module.exports = createExecLogSharedWithParentWindowElement;
},{}],5:[function(require,module,exports){
function createElements (execlib, applib, mylib) {
  'use strict';

  require('./connectingwidgetcreator')(execlib, applib);
  require('./execlogdisplaycreator')(execlib, applib);
  require('./execlogcreator')(execlib, applib);
  require('./execlogsharedwithparentwindowcreator')(execlib, applib);
}
module.exports = createElements;
},{"./connectingwidgetcreator":1,"./execlogcreator":2,"./execlogdisplaycreator":3,"./execlogsharedwithparentwindowcreator":4}],6:[function(require,module,exports){
(function (execlib) {
  var lib = execlib.lib,
    lR = execlib.execSuite.libRegistry,
    applib = lR.get('allex_applib'),
    mylib = {};

  //mylib.mixins = require('./mixins')(execlib);
  mylib.markups = require('./markup')(execlib);
  //mylib.jobs = require('./jobs')(execlib);
  require('./elements')(execlib, applib, mylib);

  lR.register('allex_bsenvironmentwebcomponent', mylib);
})(ALLEX)

},{"./elements":5,"./markup":8}],7:[function(require,module,exports){
function createExecLogButtonMarkup (o, m, bsmarkuplib, mylib) {
  'use strict';

  function execLogPaneMarkup (options) {
    return o(m.div
      , 'CLASS', 'd-flex flex-column w-100 h-100'
      , 'CONTENTS', [
        o(m.div
          , 'CLASS', 'd-flex flex-row justify-content-end'
          , 'CONTENTS', [
            o(m.button
              , 'CLASS', 'btn btn-primary icon-bell squareButton me-2'
              , 'ATTRS', 'data-bs-toggle="tooltip" title="Clear All Except Errors" execlogdisplayelement="ClearAllExceptErrors"'
            ),
            o(m.button
              , 'CLASS', 'btn btn-primary icon-cancel-circle squareButton'
              , 'ATTRS', 'data-bs-toggle="tooltip" title="Clear All" execlogdisplayelement="ClearAll"'
            )
          ]
        ),
        o(m.div
          , 'ATTRS', 'execlogdisplayelement="Grid"'
          , 'CLASS', 'flex-grow-1 ag-theme-balham'
        )
      ]
    );
  }

  mylib.execLogPane = function execLogButtonAndPane (options) {
    return bsmarkuplib.offCanvasPane({
      split: true,
      class: '',
      offcanvas: {
        orientation: 'end',
        title: 'Execution Log',
        class: 'collapsepane',
        attrs: 'style="width:80%; margin-top:0; max-heigth:100vh;" executionlog_element="Display"'
      },
      pane: execLogPaneMarkup(options)
    });
  };

  mylib.execLogButtonAndPane = function execLogButtonAndPane (options) {
    return bsmarkuplib.offCanvasButton({
      split: true,
      class: '',
      buttontext: '',
      buttonclass: 'btn-circle ms-4',
      buttonattrs: 'data-bs-toggle="tooltip" title="Execution Log" appelement="ExecLog"',
      offcanvas: {
        orientation: 'end',
        title: 'Execution Log',
        class: 'collapsepane',
        attrs: 'style="width:80%; margin-top:0; max-heigth:100vh;" executionlog_element="Display"'
      },
      pane: execLogPaneMarkup(options)
    });
  };
}
module.exports = createExecLogButtonMarkup;
},{}],8:[function(require,module,exports){
function createMarkup (execlib) {
  'use strict';
  
  var execSuite = execlib.execSuite,
    libRegistry = execSuite.libRegistry,
    applib = libRegistry.get('allex_applib'),
    templateslib = libRegistry.get('allex_templateslitelib'),
    o = templateslib.override,
    m = libRegistry.get('allex_htmltemplateslib'),
    bsmarkuplib = libRegistry.get('allex_bootstrapmarkuplib');

  var markuplib = {};

  require('./execlogbuttoncreator')(o, m, bsmarkuplib, markuplib);

  return markuplib;
}
module.exports = createMarkup;
},{"./execlogbuttoncreator":7}]},{},[6]);
