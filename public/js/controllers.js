
var randomNameControllers = angular.module('randomNameControllers', []);
 
randomNameControllers.controller('NameListCtrl', function ($scope, $http) {
	$http.get('api/names').success(function(data) {
		$scope.names = data;
	});

	$scope.generate = function() {
		$http.get('api/names').success(function(data) {
			$scope.names = data;
		});
	};
});