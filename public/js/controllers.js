
var randomNameControllers = angular.module('randomNameControllers', []);
 
randomNameControllers.controller('NameListCtrl', function ($scope, $http) {
	$http.get('api/names').success(function(data) {
		$scope.names = data;
	});

	$scope.generate = function(query) {
		console.log(query.fRank);
		console.log(query.sRank);
		$http.get('api/names', {params: query}).success(function(data) {
			if ($scope.selected_first) {
				for (var i = data.length - 1; i >= 0; i--) {
					$scope.covered_firsts[i] = data[i].firstname.name
					data[i].firstname.name = $scope.selected_first;
				};
			}
			if ($scope.selected_last) {
				for (var i = data.length - 1; i >= 0; i--) {
					$scope.covered_lasts[i] = data[i].surname.name
					data[i].surname.name = $scope.selected_last;
				};
			}
			$scope.names = data;
		});
	};

	$scope.lockFirst = function(name) {
		if ($scope.selected_first === name) {
			$scope.selected_first = null;
			for (var i = $scope.names.length - 1; i >= 0; i--) {
				$scope.names[i].firstname.name = $scope.covered_firsts[i]
			};	
		}
		else {
			$scope.selected_first = name;
			for (var i = $scope.names.length - 1; i >= 0; i--) {
				$scope.covered_firsts[i] = $scope.names[i].firstname.name
				$scope.names[i].firstname.name = $scope.selected_first;
			};	
		}
		
	};

	$scope.lockLast = function(name) {
		if ($scope.selected_last === name) {
			$scope.selected_last = null;
			for (var i = $scope.names.length - 1; i >= 0; i--) {
				$scope.names[i].surname.name = $scope.covered_lasts[i]
			};	
		}
		else {
			$scope.selected_last = name;
			for (var i = $scope.names.length - 1; i >= 0; i--) {
				$scope.covered_lasts[i] = $scope.names[i].surname.name
				$scope.names[i].surname.name = $scope.selected_last;
			};	
		}
		
	};

	$scope.genders = [];
	$scope.covered_firsts = [];
	$scope.covered_lasts = [];
	$scope.races = [
	  {"text": "White",    "value": ["pctwhite",50]},
	  {"text": "Hispanic", "value": ["pcthispanic",50]},
	  {"text": "Black",    "value": ["pctblack",50]},
	  {"text": "Asian",    "value": ["pctasian",50]},
	  {"text": "Native",   "value": ["pctnative",50]}
	];
	$scope.sRanks = [
	  {"text": "All", "value": null},
	  {"text": "Common", "value": [0, 10000]},
	  {"text": "Rare", "value": [100000, 150000]}
	];
	$scope.fRanks = [
	  {"text": "All", "value": null},
	  {"text": "Common", "value": [0, 800]},
	  {"text": "Rare", "value": [800, 4275]}
	];
});