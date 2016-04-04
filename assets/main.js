 var app = angular.module('angular-poll', [
    'firebase',
    'ui.router',
    'ngSanitize'
]);
app.config([
    '$stateProvider',
    '$urlRouterProvider',
    Config
]);
function Config($stateProvider, $urlRouterProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'templates/home.html',
        controller: 'HomeCtrl'
    }).state('voting', {
        url: '/poll/:pollid',
        templateUrl: 'templates/voting.html',
        controller: 'VotingCtrl'
    }).state('results', {
        url: '/poll/:pollid/results',
        templateUrl: 'templates/results.html',
        controller: 'ResultsCtrl'
    });
    $urlRouterProvider.otherwise('/');
}
app.controller('AppCtrl', [
    '$scope',
    AppCtrl
]);
function AppCtrl($scope) {
    $scope.AppTitle = 'Poll | Сервис онлайн опросов';
}
app.controller('HomeCtrl', [
    '$scope',
    '$state',
    'Poll',
    HomeCtrl
]);
function HomeCtrl($scope, $state, Poll) {
    function InitNewPoll() {
        $scope.Poll = {
            Question: '',
            Answers: [
                {},
                {},
                {},
                {}
            ]
        };
    }
    $scope.AddAnswer = function () {
        $scope.Poll.Answers.push({});
    };
    $scope.ClearAnswer = function (Answer) {
        delete Answer.label;
    };
    $scope.CreatePoll = function () {
        Poll.create($scope.Poll).then(function (ref) {
            var PollID = ref.key();
            $state.go('voting', { 'pollid': PollID });
        });
        InitNewPoll();
    };
    $scope.RemoveAnswer = function (key) {
        if ($scope.Poll.Answers.length > 2) {
            $scope.Poll.Answers.splice(key, 1);
        } else {
            alert('Необходимо хотя бы 2 вопроса ');
        }
    };
    InitNewPoll();
}
app.controller('VotingCtrl', [
    '$location',
    '$scope',
    '$state',
    '$stateParams',
    'Poll',
    VotingCtrl
]);
function VotingCtrl($location, $scope, $state, $stateParams, Poll) {
    $scope.Poll = Poll.get($stateParams.pollid);
    $scope.MyVote = {};
    $scope.PollUrl = $location.absUrl();
    $scope.Vote = function () {
        var Answer = $scope.MyVote.Answer;
        if (Answer.value) {
            Answer.value++;
        } else {
            Answer.value = 1;
        }
        $scope.Poll.$save().then(function (ref) {
            var PollID = ref.key();
            $state.go('results', { 'pollid': PollID });
        });
    };
}
app.controller('ResultsCtrl', [
    '$location',
    '$scope',
    '$stateParams',
    'Poll',
    ResultsCtrl
]);
function ResultsCtrl($location, $scope, $stateParams, Poll) {
    $scope.Poll = Poll.get($stateParams.pollid);
    $scope.PollUrl = $location.absUrl();
    ChartColours = [
        'AliceBlue',
        'AntiqueWhite',
        'Aqua',
        'AquaMarine',
        'Azure',
        'Beige',
        'Bisque',
        'BlanchedAlmond',
        'Blue',
        'BlueViolet',
        'Brown',
        'BurlyWood',
        'CadetBlue',
        'Chartreuse',
        'Chocolate',
        'Coral',
        'CornflowerBlue',
        'Cornsilk',
        'Crimson',
        'Cyan',
        'DarkBlue',
        'DarkCyan',
        'DarkGoldenRod',
        'DarkSlateBlue',
        'DeepPink',
        'Gold',
        'LightSalmon',
        'LightSkyBlue',
        'Tomato',
        'YellowGreen'
    ];
    var canvas = document.getElementById('ResultsChart').getContext('2d');
    var ResultsChart = new Chart(canvas);
    function CalcVotes() {
        $scope.TotalVotes = 0;
        angular.forEach($scope.Poll.Answers, function (data) {
            $scope.TotalVotes += data.value || 0;
        });
    }
    function RenderChart() {
        var PickedColours = [];
        angular.forEach($scope.Poll.Answers, function (data) {
            var RandVal = Math.floor(Math.random() * (ChartColours.length - 1));
            var colour = ChartColours[RandVal];
            data.color = colour;
            PickedColours.push(colour);
            if (!data.value) {
                data.value = 0;
            }
        });
        ResultsChart = ResultsChart.Doughnut($scope.Poll.Answers);
        CalcVotes();
    }
    function UpdateChart() {
        if (ResultsChart.update) {
            angular.forEach(ResultsChart.segments, function (segment, i) {
                ResultsChart.segments[i].value = $scope.Poll.Answers[i].value || 0;
            });
            ResultsChart.update();
        }
        CalcVotes();
    }
    $scope.Poll.$loaded().then(function () {
        RenderChart();
    });
    $scope.Poll.$watch(function () {
        UpdateChart();
    });
}
app.service('Poll', [
    '$firebaseArray',
    '$firebaseObject',
    Poll
]);
function Poll($firebaseArray, $firebaseObject) {
    var ref = new Firebase('https://angular-poll.firebaseio.com/');
    var Polls = $firebaseArray(ref);
    return {
        'Polls': Polls,
        'create': function (PollData) {
            return this.Polls.$add(PollData);
        },
        'get': function (PollID) {
            return $firebaseObject(ref.child(PollID));
        }
    };
}