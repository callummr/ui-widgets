var app = app || {};

// Required to use _$ instead of $ to do a multiple versions of jquery being loaded.
// jQueryConflict is set in the utils file

_$(document).ready(function () {
    // ucp = USER CREATE PRODUCT
    app.ucp = {
        init: function () {
            init: function () {
            app.ucp.xxx();
        },
        xxx: function(){
            ....
        }
    };

    if(xxx){
        app.ucp.init();   
    }    
});