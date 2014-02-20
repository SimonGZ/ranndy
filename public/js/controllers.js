
var randomNameApp = angular.module('randomNameApp', []);
 
randomNameApp.controller('NameListCtrl', function ($scope) {
  $scope.firstNames = [
    {
    	'name'   : 'Simon',
     	'gender' : 'Male'
    },
    {
		'name'   : 'Anna',
	 	'gender' : 'Female'	
    }
  ];
  $scope.surnames = [
    {
    	'name'   : 'Ganz'
    },
    {
		'name'   : 'Almendrala'
    }
  ];
});