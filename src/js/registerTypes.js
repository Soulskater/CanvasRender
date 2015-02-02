/**
 * Created by gmeszaros on 1/28/2015.
 */

//
//Register types
dependencyContainer.registerType("jQuery", jQuery);
dependencyContainer.registerType("linq", linq);


//In use
var canvas = injector("jQuery", "linq").class(function ($, linq) {
    debugger;
});