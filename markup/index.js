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