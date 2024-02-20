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