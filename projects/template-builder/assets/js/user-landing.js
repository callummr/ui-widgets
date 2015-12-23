var app = app || {};

// Required to use _$ instead of $ to do a multiple versions of jquery being loaded.
// jQueryConflict is set in the utils file

_$(document).ready(function () {
    // ul = USER LANDING
    app.ul = {
        init: function () {
            app.ul.xxx();
        },
        xxx: function(){
            ....
        }
    };

    if(xxx){
        app.ul.init();   
    }    
});