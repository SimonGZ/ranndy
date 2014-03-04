var randomNameApp = angular.module('randomNameApp', [
  'ngRoute',
  'randomNameControllers',
  'ngAnimate'
]);

randomNameApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'js/partials/full-name-list.html',
        controller: 'NameListCtrl'
      }).
      otherwise({
        redirectTo: '/'
      });
  }]);