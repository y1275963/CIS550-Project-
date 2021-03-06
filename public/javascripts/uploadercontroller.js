/**
 * Created by y1275963 on 11/14/16.
 */
app.controller('sqlform', [
    '$scope',
    '$http',
    '$timeout',
    function($scope, $http, $timeout) {
        var RightSqlAnswer = null;
        var AlternativeSqlAnswer = null;

        $scope.sqlform = {};

        $scope.reset = function() {
            $scope.sqlform = {};
            $scope.RightSqlShow = false;
            $scope.AlterSqlShow = false;
            $scope.alternativeData = {};
            RightSqlAnswer = null;
            AlternativeSqlAnswer = null;
            $scope.uploadReady = false;
            $scope.UploadSqlMessage = '';
            $scope.UploadSqlAlertType = '';
            $scope.uploaderMessage = '';
            $scope.pauseUpload = false;
        };


        $scope.validateRight = function(req_length) {
            console.log($scope.sqlform.rightsql);
            if(!$scope.sqlform.rightsql || $scope.sqlform.rightsql=== ' '){
                $scope.RightSqlWrongMessage = "Empty Input";
                $scope.RightSqlShow = true;
                $scope.RightSqlAlertType = "alert-danger";
                RightSqlAnswer = null;

                return;
            };

            $http({
                url: '/newquestion/validateRightSql',
                method: 'GET',
                params: {RightSql: $scope.sqlform.rightsql, Requiredlength:req_length}
            }).success(function(data) {
                RightSqlAnswer = data[0].answer;
                $scope.RightSqlWrongMessage = "SQL Success" + "\n" + "Given Result: ".concat(RightSqlAnswer);
                $scope.RightSqlShow = true;
                $scope.RightSqlAlertType = "alert-success";

                return;
            }).error(function(data, status, headers) {
                $scope.RightSqlWrongMessage = data;
                $scope.RightSqlShow = true;
                $scope.RightSqlAlertType = "alert-danger";
                RightSqlAnswer = null;

                return;
            })
        };

        $scope.validateAlter = function(req_length) {
            if(!$scope.sqlform.wrongsql || $scope.sqlform.wrongsql=== ' '){
                $scope.AlterSqlWrongMessage = "Empty Input";
                $scope.AlterSqlShow = true;
                $scope.AlterSqlAlertType = "alert-danger";
                $scope.alternativeData = {};
                AlternativeSqlAnswer = null;
                return;
            };

            $http({
                url: '/newquestion/validateRightSql',
                method: 'GET',
                params: {RightSql: $scope.sqlform.wrongsql, Requiredlength:req_length}
            }).success(function(data) {
                $scope.AlterSqlWrongMessage = "SQL Success Given Result: ";
                $scope.AlterSqlShow = true;
                $scope.AlterSqlAlertType = "alert-success";
                AlternativeSqlAnswer = data;

                $scope.alternativeData = AlternativeSqlAnswer;

            }).error(function(data, status, headers) {
                $scope.AlterSqlWrongMessage = data;
                $scope.AlterSqlShow = true;
                $scope.AlterSqlAlertType = "alert-danger";
                $scope.alternativeData = {};
                AlternativeSqlAnswer = null;

            })
        };

        $scope.sqldemo = function(sqlform) {
            if(!((RightSqlAnswer!=null) && (AlternativeSqlAnswer != null))) {
                $scope.uploadReady = false;
                $scope.UploadSqlMessage = "Please Pass each test First";
                $scope.UploadSqlAlertType = "alert-danger";
                $scope.questions = {};
            } else {
                $scope.uploadReady = true;

                $scope.UploadSqlMessage = '';
                $scope.UploadSqlAlertType = "alert-success"

                $scope.questions =
                {"question": $scope.sqlform.sqlquestion,
                    "correct_answer": RightSqlAnswer,
                    "options": [
                        {"answerText":RightSqlAnswer, "correct": true},
                        {"answerText":AlternativeSqlAnswer[0]['options'], "correct": false},
                        {"answerText":AlternativeSqlAnswer[1]['options'], "correct": false},
                        {"answerText":AlternativeSqlAnswer[2]['options'], "correct": false}
                    ]
                };
            }
        }

        $scope.pauseUpload = false;
        $scope.sqlUpload = function(sqlform) {
            if(!((RightSqlAnswer!=null) && (AlternativeSqlAnswer != null))) {
                $scope.uploaderMessage = "Data Not Ready";
                return;
            } else {
                var dataobject = {
                    options: sqlform.wrongsql,
                    question: sqlform.sqlquestion,
                    questionquery: sqlform.rightsql
                };
                $http.post('/newquestion/addquiz', dataobject).then(function(data) {
                    $scope.uploaderMessage = "Upload Success";
                });
                $scope.uploaderMessage = "Upload Success";
                $scope.pauseUpload = true;
                return;
            }
        }
    }
]);