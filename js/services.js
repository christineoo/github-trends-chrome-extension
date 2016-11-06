(function(angular) {
  'use strict';
  var services = angular.module('githubTrend.services', []);

  services.factory('githubTrendService', ['$resource', function($resource){

    var feeds_base_url = 'http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&';
    var feeds = $resource(feeds_base_url, {}, {
      daily: {method: 'GET'},
      weekly: {method: 'GET'},
      monthly: {method: 'GET'}
    });
    return feeds;

  }]);

})(angular);
