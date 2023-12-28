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