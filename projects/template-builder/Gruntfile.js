module.export = function(grunt){
	'use strict';

	grunt.initConfig({
		dirs: {
			asset: '/assets/',
			jsFile: '/js/',
			jsLibs: asset + jsFile + 'libs/'
		},
		babel: {
			options: {
				sourceMaps: true
			},
			dist : {
				 files: [{
				    src: [
				    		'<%= dirs.jsLibs %>/jquery-1.11.3.js',
				    		'<%= dirs.jsLibs %>/xml2json.js',
				    		'<%= dirs.jsLibs %>/jquery-rotate.js',
				    		'<%= dirs.jsFile %>/utils.js',
				    		'<%= dirs.jsFile %>/user-create-product.js'
				    	 ],
				    dest: 'assets/js/main.js',
				}]
			}
		}
	});

	grunt.loadNpmTasks('grunt-babel');
	grunt.registerTask('es6', ['babel']);
};