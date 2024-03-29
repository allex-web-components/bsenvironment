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