$(document).ready(function(){
	var app = {
		init: function(){
			app.multipleSelect();
			app.accordians();
		},
		multipleSelect: function(){
			var $multiSelect = $('select[data-js=multiple-select]');
			$multiSelect.multipleSelect({
				placeholder: "Here is the placeholder",
				filter: true,
				maxHeight: 200,
				// onBlur: function(){
				// 	console.log('Blur');
				// 	$multiSelect.multipleSelect('blur');
				// },
				onClose: function(){
					console.log('Closed');
				}
			});

			$('button[data-js=save-month]').on('click', function(){
				console.log( $multiSelect.multipleSelect("getSelects") );
			});

			// $('select[data-js=multiple-select]').on('change', function(){
			// 	console.log( $(this).val() );
			// });

			// $('select[data-js=multiple-select]').on('onBlur', function(){
			// 	console.log('Blurred');
			// });
		},
		accordians: function(){
			$("#accordion").accordion({
				heightStyle: 'content'
			});
		},
		test: function(){
			// Check if there are any already items selected
			// If there are display some names... and a count of items
			// If there are not, display a message

			// Create a list from the HTML
			// Disable items that have already been selected

			// When items are selected on 'Save',
				// Update player listing
				// Update total number of items in selected group
				// Update the DB > on success
					// Refresh the Custom Select to disable already selected items
				// > On failure
					// Show error message
		}
	};
	app.init();
});