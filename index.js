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
