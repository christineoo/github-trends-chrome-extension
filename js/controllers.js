(function(angular) {
  'use strict';
  var controllers = angular.module('githubTrend.controllers', ['githubTrend.services']);

  controllers.controller('MainController', [
      '$scope', '$log', 'githubTrendService', '$mdSidenav', '$timeout', '$mdMedia',
      function($scope, $log, githubTrendService, $mdSidenav, $timeout, $mdMedia){

      $scope.extension_name = "GitHub Trending";
      var RSS_BASE_URL = 'http://github-trends.ryotarai.info/rss/github_trends_';

      var languagesObj = {
        'All Languages': 'all',
        'Unknown': 'unknown',
        'Boo': 'boo',
        'Brightscript': 'brightscript',
        'Bro': 'bro',
        'C': 'c',
        'C#': 'csharp',
        'C++': 'cpp',
        'Clojure': 'clojure',
        'CoffeeScript': 'coffeescript',
        'CSS': 'css',
        'D': 'd',
        'Dart': 'dart',
        'E': 'e',
        'Eiffel': 'eiffel',
        'Elixir': 'elixir',
        'Elm': 'elm',
        'Erlang': 'erlang',
        'F#': 'fsharp',
        'Factor': 'factor',
        'Fancy': 'fancy',
        'Fantom': 'fantom',
        'FLUX': 'flux',
        'FORTRAN': 'fortran',
        'Game Maker Language': 'game-maker-language',
        'Go': 'go',
        'Groovy': 'groovy',
        'Haskell': 'haskell',
        'J': 'j',
        'Java': 'java',
        'JavaScript': 'javascript',
        'Kotlin': 'kotlin',
        'Lasso': 'lasso',
        'LiveScript' : 'livescript',
        'Logos': 'logos',
        'Logtalk': 'logtalk',
        'Lua': 'lua',
        'M': 'm',
        'Mathematica': 'mathematica',
        'Matlab': 'matlab',
        'Mercury': 'mercury',
        'Monkey': 'monkey',
        'MoonScript': 'moonscript',
        'Objective-C': 'objective-c',
        'Objective-J': 'objective-j',
        'Perl': 'perl',
        'PHP': 'php',
        'Pike': 'pike',
        'Python': 'python',
        'Ruby': 'ruby',
        'SAS': 'sas',
        'Scala': 'scala',
        'Shell': 'bash',
        'SQL': 'sql',
        'Squirrel': 'squirrel',
        'Swift': 'swift',
        'TypeScript': 'typescript',
        'VHDL': 'vhdl',
        'ActionScript': 'as3'
      }

      $scope.selectedLanguage = [];
      
      $scope.columnNumber = [0, 1];
      $scope.feeds = [];

      $scope.groups = {};
      $scope.loading = [false, false];
      $scope.feedTimeSpand = ["daily", "daily"];
      $scope.since = [];
      $scope.settings = [];

      $scope.$watch(function() { return $mdMedia('md') ||  $mdMedia('gt-md') || $mdMedia('gt-lg'); }, function(size) {
        if (size) {
          $scope.columnNumber = [0, 1];
          $scope.selectedLanguage = $scope.selectedLanguage.splice(0, 2);
          populateSelectedLanguage(2);
        }
      });

      $scope.$watch(function() { return $mdMedia('sm'); }, function(size) {
        if (size) {
          $scope.columnNumber = [0];
          $scope.selectedLanguage = $scope.selectedLanguage.splice(0, 1);
        }
      });
      
      chrome.storage.sync.get({settings: []}, function (result) {
        $scope.settings = result.settings;
        if (result.settings.length == 0){
          populateAllLanguages($scope.settings);
          for (var data in $scope.groups ){
            for (var i=0; i < $scope.groups[data].length; i++ ){
              $scope.settings.push($scope.groups[data][i])
              chrome.storage.sync.set({settings: $scope.settings}, function() {
              // Notify that we saved.
                console.log('Settings saved' + $scope.settings);
             });
            }
          }
        }
        else {
          populateAllLanguages($scope.settings);
        }
      });

      function populateSelectedLanguage(length){
        if ($scope.selectedLanguage.length < length){
            angular.forEach($scope.settings, function(item){
            if (item.selected && ($scope.selectedLanguage.indexOf(item.display) == -1)) {
              $scope.selectedLanguage.push(item.display);
            }
          })
        }
      }

      function populateAllLanguages(settings) {
        if (settings.length == 0){
          for (var data in languagesObj ){
            var item = {};
            item.display = data;
            item.selected = true;
            var firstChar = item.display.charAt( 0 );

            $scope.groups[ firstChar ] = $scope.groups[ firstChar ] || [];
            $scope.groups[ firstChar ].push( item );

            if ($scope.selectedLanguage.length < 2){
              if (item.selected && ($scope.selectedLanguage.indexOf(item.display) == -1)) {
                $scope.selectedLanguage.push(item.display);
                $scope.save(($scope.selectedLanguage.length-1), item.display);
              }
            }
          }
        }
        else {
          angular.forEach(settings, function(setting, index){
            var item = {};
            item.display = setting.display;
            item.selected = setting.selected;
            var firstChar = setting.display.charAt(0);

            $scope.groups[ firstChar ] = $scope.groups[ firstChar ] || [];
            $scope.groups[ firstChar ].push( item );

            if ($scope.selectedLanguage.length < 2){
              if (item.selected && ($scope.selectedLanguage.indexOf(item.display) == -1)) {
                $scope.selectedLanguage.push(item.display);
                $scope.save(($scope.selectedLanguage.length-1), item.display);
              }
            }
          })
        }
      }

      function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      function feedTitleCleanUp(feeds) {
        angular.forEach(feeds, function(feed){
          feed.title = feed.title.substr(0, feed.title.indexOf(' '));
        });
        return feeds;
      }

      function getFeedColumn(title) {
        var feed_language = title.split(' - ')[1];
        return $scope.selectedLanguage.indexOf(feed_language);
      }

      //----------------------------------------------------------------------------
      $scope.checkSelectedLanguage = function(language){
        if ($scope.selectedLanguage.indexOf(language) !== -1) {
          return true;
        }
        else {
          return false;
        }
      }

      $scope.toggleRight = buildToggler('left');

      function buildToggler(navID) {
        return function() {
          $mdSidenav(navID)
            .toggle()
            .then(function () {
              $log.debug("toggle " + navID + " is done");
            });
        }
      }

      $scope.getRandomLanguage = function(index){
        $scope.loading[index] = true;
        var randomIndex = getRandomInt(0, Object.keys(languagesObj).length-1);
        console.log('randomIndex: ' + randomIndex);
        $scope.selectedLanguage[index] = Object.keys(languagesObj)[randomIndex];
        console.log('$scope.selectedLanguage[index]' + $scope.selectedLanguage[index]);
        for (var data in $scope.groups ){
          if (data === $scope.selectedLanguage[index].charAt(0)){
            for (var i=0; i < $scope.groups[data].length; i++ ){
              if ($scope.groups[data][i].selected == true){
                $scope.save(index, $scope.selectedLanguage[index]);
              }
              else {
                $scope.getRandomLanguage(index);
              }
            }
          }
        }
      }

      $scope.togglefeed = function (index) {
        var language_type = languagesObj[$scope.selectedLanguage[index]];
        var rss_url = RSS_BASE_URL + language_type;
        $scope.loading[index] = true;

        if ($scope.feedTimeSpand[index] == "daily") {
          $scope.feedTimeSpand[index] = "weekly"
          githubTrendService.weekly({ q: rss_url + '_weekly.rss'}).$promise.then(function(data) {
            var index = getFeedColumn(data.responseData.feed.title);
            $scope.since[index] = data.responseData.feed.title.split(' - ')[2];
            $scope.feeds[index] = feedTitleCleanUp(data.responseData.feed.entries);
            $timeout(function() {
              $scope.loading[index] = false;
            }, 1000);

          })
        }
        else if ($scope.feedTimeSpand[index] == "weekly") {
          $scope.feedTimeSpand[index] = "monthly"
          githubTrendService.monthly({ q: rss_url + '_monthly.rss'}).$promise.then(function(data) {
            var index = getFeedColumn(data.responseData.feed.title);
            $scope.since[index] = data.responseData.feed.title.split(' - ')[2];
            $scope.feeds[index] = feedTitleCleanUp(data.responseData.feed.entries);
            $timeout(function() {
              $scope.loading[index] = false;
            }, 1000);
          })
        }
        else if ($scope.feedTimeSpand[index] == "monthly") {
          $scope.feedTimeSpand[index] = "daily"
          githubTrendService.daily({ q: rss_url + '_daily.rss'}).$promise.then(function(data) {
            var index = getFeedColumn(data.responseData.feed.title);
            $scope.since[index] = data.responseData.feed.title.split(' - ')[2];
            $scope.feeds[index] = feedTitleCleanUp(data.responseData.feed.entries);
            $timeout(function() {
              $scope.loading[index] = false;
            }, 1000);
          })
        }
      }
      $scope.save = function(index, selectedLanguage){
        var language_type = languagesObj[selectedLanguage];
        var rss_url = RSS_BASE_URL + language_type;

        $scope.selectedLanguage[index] = selectedLanguage
        $scope.loading[index] = true;

        if ($scope.feedTimeSpand[index] == "daily") {
          githubTrendService.daily({ q: rss_url + '_daily.rss'}).$promise.then(function(data) {
            var index = getFeedColumn(data.responseData.feed.title);
            $scope.since[index] = data.responseData.feed.title.split(' - ')[2];
            $scope.feeds[index] = feedTitleCleanUp(data.responseData.feed.entries);
            $timeout(function() {
              $scope.loading[index] = false;
            }, 1000);
          })
        }
        else if ($scope.feedTimeSpand[index] == "weekly") {
          githubTrendService.weekly({ q: rss_url + '_weekly.rss'}).$promise.then(function(data) {
            var index = getFeedColumn(data.responseData.feed.title);
            $scope.since[index] = data.responseData.feed.title.split(' - ')[2];
            $scope.feeds[index] = feedTitleCleanUp(data.responseData.feed.entries);
            $timeout(function() {
              $scope.loading[index] = false;
            }, 1000);
          })
        }
        else if ($scope.feedTimeSpand[index] == "monthly") {
          githubTrendService.monthly({ q: rss_url + '_monthly.rss'}).$promise.then(function(data) {
            var index = getFeedColumn(data.responseData.feed.title);
            $scope.since[index] = data.responseData.feed.title.split(' - ')[2];
            $scope.feeds[index] = feedTitleCleanUp(data.responseData.feed.entries);
            $timeout(function() {
              $scope.loading[index] = false;
            }, 1000);
          })
        }
      }

      $scope.saveSettings = function(language){
        angular.forEach($scope.settings, function(item){
          if (item.display === language.display){
            item.selected = !language.selected;
          }
        })
        chrome.storage.sync.set({settings: $scope.settings}, function() {
          // Notify that we saved.
          console.log('Settings saved');
        });
      }

  }]);

})(angular);
