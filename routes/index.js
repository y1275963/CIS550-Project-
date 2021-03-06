var express = require('express');
var router = express.Router();
var events = require('events');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose');
require('../models/Quiz');
require('../models/leaderboard');

var MongoClinet = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'localhost:59237/sqlympics' // local mongodb address

var Quiz = mongoose.model('Quiz');
var mongo_question = "Demo_questions";

var leaderboard = mongoose.model('leaderboard');
var number_of_leaderboard = 100;

var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user     : 'username',
    password : 'password',
    port     : '3306',
    database : 'olympic_quiz'
});

router.get('/get_leaders', function(req, res) {
    leaderboard.find({"mode": "Easy"}, function (err, Easy) {
        if (err) {
            console.log("Mongo Error");
            console.log(err);
        }
        leaderboard.find({"mode": "Medium"}, function (err, Medium) {
            if (err) {
                console.log("Mongo Error");
                console.log(err);
            }
            leaderboard.find({"mode": "Hard"}, function (err, Hard) {
                leaderboard.find({"mode": "Rapid Fire"}, function (err, Rapid) {
                    if (err) {
                        console.log("Mongo Error");
                        console.log(err);
                    }
                    // console.log({"Easy":Easy,"Medium":Medium,"Hard":Hard,"Rapid":Rapid});
                    res.json({"Easy": Easy, "Medium": Medium, "Hard": Hard, "Rapid": Rapid});
                }).sort({"score": -1}).limit(number_of_leaderboard);
            }).sort({"score": -1}).limit(number_of_leaderboard);
        }).sort({"score": -1}).limit(number_of_leaderboard);
    }).sort({"score": -1}).limit(number_of_leaderboard);
})

router.get('/question_count', function(req, res, next) {
    MongoClinet.connect(url, function(err, db) {
        if (err) throw err;

        var Questions = db.collection(mongo_question);
        Questions.find().count(function(err, count) {
            res.json(count);
        })
    })
});

router.get('/update_leaders', function(req, res) {
  console.log(req.query['username'])
  console.log(req.query['score'])
  console.log(req.query['level'])

  leaderboard.collection.insertOne({
    user_id: req.query['username'],
    score: parseInt(req.query['score']),
    mode: req.query['level']
  }, function(err, data) {
    if(err) {
      console.log("Mongo error")
    }
    if(data) {
      console.log(data)
    }
  });
})

var ddg = require('ddg');

// Remove str2 from str1
var removestr2 = function(str1, str2) {
    var str_list = String(str2).split(" ");
    for (var i = 0; i < str_list.length; i++) {
        str1 = str1.replace(new RegExp(str_list[i], 'ig'), " ");
    }
    return str1.trim();
}

router.get('/ddg_abstract_url', function(req, res, next) {
    ddg.query(req.query["correct_answer"], function(err, data) {
        res.send(data.AbstractURL);
    })
});

router.get('/ddg_hint', function(req, res, next) {
    // console.log(req.query["correct_answer"]);
    if (!isNaN(req.query["correct_answer"])) {
        res.status(404).send("");
     return;
    } else {
        ddg.query(req.query["correct_answer"], function(err, data) {
            results = data.RelatedTopics; //related topics is a list of 'related answers'
            // console.log(results);

            var text;
            if (data.AbstractText) {
                text = data.AbstractText;
            } else if (results[0] != null && results[0].text != ""){
                text = results[0].Text;
            } else {
                res.status(404).send("");
                return;
            }
            text = removestr2(text, req.query["correct_answer"]);
            res.send(text);
        });
    }
});

router.get('/quiz_list', function(req, res, next) {
  MongoClinet.connect(url, function(err, db) {
    if (err) throw err;

    // console.log(req.query['total_questions']);
    var questions = db.collection(mongo_question);
    questions.aggregate([ { $sample: { size: parseInt(req.query['total_questions'])} }, {$project:{_id: 1}}]).toArray(function (err, docs) {
          // console.log(docs);
        res.json(docs);
        db.close();
    });
  });
});

router.get('/test_http', function(req, res, next) {
  var EventEmitter = events.EventEmitter;
  var flowController = new EventEmitter();
  console.log(req.query.question_id);

  flowController.on('dowork', function(obj) {
    connection.query(obj["questionquery"], function (err, row) {
      connection.query(obj['options'], function (err, options) {
          if (err) console.log(err);

          var name = row[0]["answer"]
          var name_array = String(name).split(' ');
          var image_url = "";

          // if (name_array.length == 2) {
          //     var first_name = name_array[0];
          //     var last_name = name_array[1];
          // }
          connection.query("SELECT image FROM Athlete WHERE first_name = ? AND last_name = ?", name_array, function(error, result) {
            if (error) {
                image_url = "";
            } else {
                if (result && result[0] && result[0]["image"] != "None") {
                    console.log(result[0]["image"]);
                    image_url = result[0]["image"];
                }
            }

            res.json({"question":obj['question'],
                  "answer":[row[0], options[0],options[1],options[2]],
                  "image_url": image_url});
          });


      });
    });
  });

  MongoClinet.connect(url, function(err, db) {
    var questions = db.collection(mongo_question);
      console.log(req.query);
    questions.findOne({_id: ObjectId(req.query.question_id)}, function(err, obj) {
        if(err) {
            console.log("Mongo Error");
            console.log(err);
        }
        if (obj) {
            flowController.emit('dowork', obj);
        } else {
            console.log("No Result");
            // flowController.emit('dowork', obj);
        }
    })
  })

  flowController.on('finished', function () {
    console.log('finished');
  });
});

router.get('/newquestion/validateRightSql', function(req, res){
    connection.query(req.query['RightSql'], function(err, row) {
        if(err) {
            res.status(500).send(err);
            return;
        }
        if(row.length != req.query['Requiredlength']) {
            res.status(500).send("There Should be ".concat(req.query['Requiredlength']) + " Correct Answer whereas \n I got: ".concat(row.length.toString()).concat(" answers"));
            return;
        }
        console.log(row);
        res.status(201).send(row);
    })
});

router.post('/newquestion/addquiz', function(req, res, next) {
    MongoClinet.connect(url, function(err, db) {
        db.collection(mongo_question).insertOne(req.body, function(err, result) {
            // console.log(err);
            db.close();
        });
    });
});

router.get('/ngtable/test', function(req, res, next) {
   connection.query(req.query["SQL"], function(err, row) {
       if(err) {
           res.status(500).send(err);
           return;
       }
       res.status(201).json(row);
   })
});

module.exports = router;