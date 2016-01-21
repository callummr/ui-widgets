module.exports = function(grunt){
	'use strict';

	grunt.initConfig({
		dirs: {
			jsFile: './assets/js/',
			jsLibs: './assets/js/libs/'
		},
		babel: {
			options: {
				sourceMaps: true
			},
			dist: {
				files: [{
					    src: [
					    		'./assets/js/libs/jquery-1.11.3',
					    		'./assets/js/libs/xml2json',
					    		'./assets/js/libs/jquery-rotate',
					    		'./assets/js/utils',
					    		'./assets/js/user-create-product'
					    	 ],
					    dest: './assets/js/main',
					    ext: '.js'
					}]
				}
		}
	});

	grunt.loadNpmTasks('grunt-babel');
	grunt.registerTask('default', ['babel']);
};