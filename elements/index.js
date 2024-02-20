function createElements (execlib, applib, mylib) {
  'use strict';

  require('./connectingwidgetcreator')(execlib, applib);
  require('./execlogdisplaycreator')(execlib, applib);
  require('./execlogcreator')(execlib, applib);
  require('./execlogsharedwithparentwindowcreator')(execlib, applib);
}
module.exports = createElements;