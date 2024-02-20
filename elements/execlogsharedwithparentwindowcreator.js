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