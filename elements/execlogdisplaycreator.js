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
    this.gui.style['background-color'] = 'var(--bs-warning-bg-subtle)';
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
    this.gui.style['background-color'] = 'var(--bs-warning-bg-subtle)';
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
          themingpath: 'Theming',
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