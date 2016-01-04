var app = app || {};

// Required to use _$ instead of $ to do a multiple versions of jquery being loaded.
// jQueryConflict is set in the utils file

_$(document).ready(function () {
    // ul = USER LANDING
    app.ul = {
        init: function () {
            console.log('initiated');
            app.ul.showHide();
            app.ul.jsonTest();
        },
        xxx: function(){

        },
        showHide: function () {

            _$('#accordion').find('.panel-title').click(function(e){

                e.preventDefault();

                var title = _$(this).children();

                //Expand or collapse this panel
                //_$(this).parent().next().slideToggle('fast');

                if( _$(this).parent().next().hasClass('in') ) {
                    _$(this).parent().next().removeClass('in');
                } else {
                    _$(this).parent().next().addClass('in');
                }

                if(title.attr('aria-expanded') === 'true' ) {
                    title.attr('aria-expanded', 'false');
                } else {
                    title.attr('aria-expanded', 'true');
                }

                //Hide the other panels
                //_$(".accordion-content").not(_$(this).next()).slideUp('fast');
            });
        },
        jsonTest: function() {

            var json = 'assets/js/example-product-list-data-json2.js';

            _$.getJSON( json, function( data ) {

                var categories = data[0].ProductList.Categories;


                console.log(categories);




            });






            // _$.getJSON( "assets/js/example-product-list-data-json2.js", function( data ) {

            //    console.log(data[0]);




            // });

                // var arr = _$.map(categories, function(el) { return el; })

                // console.log(arr);

                // _$.each( data, function( key, val ) {
                //     items.push( "<li id='" + key + "'>" + val + "</li>" );
                // });
                // _$( "<ul/>", {
                //     "class": "my-new-list",
                //     html: items.join( "" )
                // }).appendTo( "body" );

        }

    };

    if(_$('[data-template=user-landing]').length > 0){
        app.ul.init();
    }
});
