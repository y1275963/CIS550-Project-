/**
 * Created by y1275963 on 12/15/16.
 */
app.controller('questionsCtrl',['$scope', '$http', '$timeout', 'myService', function($scope, $http, $timeout, myService){
    var recieved_data = myService.get();
    var no_of_questions = 10;

    if(angular.isDefined(recieved_data.username)) {
        $scope.username = recieved_data.username;
    }
    else {
        $scope.username = "Anonymous";
    }

    if(angular.isDefined(recieved_data.level)){
        if(recieved_data.level == 'easy'){
            $scope.hints_given = 5;
            $scope.level_display = "Easy";
        }
        else if(recieved_data.level == 'medium'){
            $scope.hints_given = 3;
            $scope.level_display = "Medium";
        }
        else if(recieved_data.level == 'hard'){
            $scope.hints_given = 1;
            $scope.level_display = "Hard";
        }
        else if(recieved_data.level == 'rapid_fire'){
            $scope.hints_given = 5;
            $scope.level_display = "Rapid Fire";
        }
    }
    else {
        $scope.hints_given = 5;
        $scope.level_display = "Practice Mode";
    }

    // var no_of_questions = 20;
    // var question_indices = [];
    // for(var i=0; i<no_of_questions; i++){
    // 	question_indices.push(i);
    // }
    // random_number(question_indices);

    function get_question_ids(){
        if(recieved_data.level == 'rapid_fire')  no_of_questions = 100;
        // else no_of_questions = 2;
        $http({
            url: '/quiz_list',
            method: 'GET',
            params: {total_questions: no_of_questions}
        }).success(function(data) {
            $scope.quiz_all = [];
            for(var i=0;i<data.length;i++){
                $scope.quiz_all[i] = data[i]['_id'];
            }
            console.log($scope.quiz_all)
        });
    }
    get_question_ids();
    // console.log(quiz_all)

    function random_number(question_indices) {
        for(var i=0;i<question_indices.length;i++){
            swap(question_indices, i);
        }
    }

    function swap(question_indices, i){
        var temp;
        random = Math.floor(Math.random()*question_indices.length);
        temp = question_indices[i];
        question_indices[i] = question_indices[random];
        question_indices[random] = temp;
    }
    $scope.user_answer = "";
    $scope.score = 0;
    $scope.correct_answers = 0;
    $scope.hints_remaining = $scope.hints_given;

    $scope.question = -1;
    $scope.questions = [];
    temp_question = [];

    if(recieved_data.level=="rapid_fire"){
        $scope.question_limit = 99999;
    }
    else {
        $scope.question_limit = no_of_questions - 1;
    }

    if(recieved_data.level == 'rapid_fire'){
        $scope.counter = 60;
        $scope.onTimeout = function(){
            $scope.counter--;
            if ($scope.counter > 0) {
                mytimeout = $timeout($scope.onTimeout,1000);
            }
            else {
                alert("Time is up!");
                $scope.submit_results_rapid();
            }
        }

    }
    $scope.loading = true;
    $scope.show_hint = false;

    $scope.show_plus_five = 0;

    $scope.get_next_question = function() {

        $scope.loading = true;
        $scope.show_hint = false;


        // console.log($scope.user_answer);
        if($scope.question != -1){
            if ($scope.user_answer.correct == true) {
                $scope.questions[$scope.question]['user_answer'] = true;
                $scope.correct_answers = $scope.correct_answers + 1;
                if(recieved_data.level == "rapid_fire"){
                    $scope.counter = $scope.counter + 5;
                    $scope.show_plus_five = 2;
                    var plus = $timeout(function(){
                        $scope.show_plus_five = 1;
                    }, 2000)
                }
                if($scope.questions[$scope.question]['hint_taken'] == false) {
                    $scope.score = $scope.score + 10;
                }
                else $scope.score = $scope.score + 5;
            }
            else {
                if(recieved_data.level == 'rapid_fire'){
                    $scope.show_plus_five = 1;
                }
            }
        }

        // console.log($scope.score);
        // console.log($scope.correct_answers);
        // console.log($scope.questions[$scope.question]);

        $scope.user_answer = "";
        $scope.question = $scope.question + 1;

        $http({
            url: '/test_http',
            method: "GET",
            params: {question_id: $scope.quiz_all[$scope.question]}
        })
            .success(function (data) {
                console.log(data);
                $scope.loading = false;

                if($scope.question==0 && recieved_data.level == 'rapid_fire'){
                    var timer = $timeout($scope.onTimeout, 1000);
                }

                temp_question[$scope.question] =
                {"question": data['question'],
                    "correct_answer": data['answer'][0]['answer'],
                    "hint_taken": false,
                    "user_answer": false,
                    "related_image": data['image_url'],
                    "options": [
                        {"answerText":data['answer'][0]['answer'], "correct": true, "disabled": false},
                        {"answerText":data['answer'][1]['options'], "correct": false, "disabled": false},
                        {"answerText":data['answer'][2]['options'], "correct": false, "disabled": false},
                        {"answerText":data['answer'][3]['options'], "correct": false, "disabled": false}
                    ]
                };
                random_number(temp_question[$scope.question]['options']);
                for(var i=0;i<temp_question[$scope.question]['options'].length;i++){
                    // console.log(temp_question[$scope.question]['options'].correct);
                    if(temp_question[$scope.question]['options'][i].correct == true){
                        temp_question[$scope.question]['correct_option'] = i;
                    }
                }
                console.log(temp_question);
                $scope.questions[$scope.question] = temp_question[$scope.question];
                console.log($scope.questions);
            })
            .error(function (data) {
                console.log('Error:'+data);
            });
    }
    var temp = $timeout(function(){
        $scope.get_next_question();
    }, 2000);

    // $scope.get_hint = function() {
    //     if($scope.hints_remaining > 0){
    //         $scope.questions[$scope.question]['hint_taken'] = true;
    //         $scope.hints_remaining = $scope.hints_remaining - 1;
    //
    //         var count = 0;
    //         answers = $scope.questions[$scope.question]['options'];
    //         for(var i=0;i<answers.length;i++){
    //             if(answers[i].correct == false && count < 2) {
    //                 answers[i].disabled = true;
    //                 count = count + 1;
    //                 // console.log(count);
    //             }
    //             // console.log($scope.questions[$scope.question]);
    //         }
    //     }
    // }
    $scope.get_hint = function() {
        if($scope.hints_remaining > 0){


            $scope.questions[$scope.question]['hint_taken'] = true;
            $scope.hints_remaining = $scope.hints_remaining - 1;
            $scope.current_hint = "";


            $http({
                url: '/ddg_hint',
                method: "GET",
                params: {correct_answer: $scope.questions[$scope.question]["correct_answer"]}
            }).success(function(data, status) {
                // console.log($scope.questions[$scope.question]["correct_answer"]);
                // console.log();
                $scope.current_hint = data;
                $scope.show_hint = true;
                // console.log(status);
            }).error(function(data, status) {
                $scope.user_answer = "";
                // cannot find in the database
                var count = 0;
                answers = $scope.questions[$scope.question]['options'];
                for(var i=0;i<answers.length;i++){
                    if(answers[i].correct == false && count < 2) {
                        answers[i].disabled = true;
                        count = count + 1;
                    }
                }
            });
        }
    }


    $scope.submit_results = function(){
        // console.log("here");
        // console.log($scope.user_answer);
        if ($scope.user_answer.correct == true) {
            $scope.questions[$scope.question]['user_answer'] = true;
            $scope.correct_answers = $scope.correct_answers + 1;
            if($scope.questions[$scope.question]['hint_taken'] == false) {
                $scope.score = $scope.score + 10;
            }
            else $scope.score = $scope.score + 5;
        }
        // console.log($scope.score);
        // console.log($scope.correct_answers);
        // console.log($scope.questions[$scope.question]);

        var sending_data = {
            "questions": $scope.questions,
            "correct_answers": $scope.correct_answers,
            "score": $scope.score,
            "hints_remaining": $scope.hints_remaining,
            "hints_given": $scope.hints_given,
            "username": $scope.username,
            "level": $scope.level_display
        }
        console.log(sending_data);
        myService.set(sending_data);
        window.location = '/#/result';
    }

    $scope.submit_results_rapid = function(){
        var sending_data = {
            "questions": $scope.questions,
            "correct_answers": $scope.correct_answers,
            "score": $scope.score,
            "hints_remaining": $scope.hints_remaining,
            "hints_given": $scope.hints_given,
            "username": $scope.username,
            "level": $scope.level_display
        }
        myService.set(sending_data);
        window.location = '/#/result';
    }

}]);