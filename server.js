/**
 * Created by Harsh on 17/05/18.
 */

const Hapi = require('hapi'),
    path = require('path')

let mongoose = require('mongoose');
var Models = require('./Models');
mongoose.Promise = Promise;


//Connect to MongoDB
mongoose.connect('mongodb://localhost/mongomart',{}).then(success => {
    console.log('MongoDB Connected');
    }).catch(err => {
    console.log(err);
    process.exit(1);
});

// Create Server
let server = new Hapi.Server({
    app: {
        name: "DEMO APP"
    },
    port: 8000
});

(async initServer => {


    // Default Routes
    server.route({
        method: 'GET',
        path: '/',
        handler: (request, reply)=> {

            return loginAdmin()
                .then(response => {
                    return response
                })
                .catch(error => {
                });

     async function loginAdmin () {

            var questions = await mongoose.connection.db.collection('Session'); // name of the collection from where you want to fetch the data

            await questions.aggregate([
                 {
                     $group: {
                         _id: '_id',
                         data: {$push: '$$ROOT'}
                     }
                 }
                 ,
                 {
                     $out: 'arrayOutput'
                 }
             ]
             ).toArray();

                var questions1 = await mongoose.connection.db.collection('arrayOutput');
                await questions1.mapReduce(
                    function () {
                        var item = [];
                        var status1 = 0;
                        var count = 0;
                        var key = 0;
                        for (var i = 0; i < this.data.length; i++) {
                            if (i == this.data.length - 1) {
                                if (count > 0) {
                                    for (var j = 0; j <= count; j++) {
                                        item.push(this.data[i - count + j])
                                    }

                                    key = key + 1;
                                    emit(key, item)
                                    count = 0;
                                    status1 = 0;
                                    item = []
                                } else {
                                    key = key + 1;

                                    emit(key, [this.data[i]])
                                }
                            } else {
                                if ((new Date(this.data[i + 1].startDate) - new Date(this.data[i].endDate)) < 3 * 60 * 1000 * 60) {
                                    count = count + 1
                                } else {
                                    status1 = 1
                                }
                            }
                            if (status1 == 1) {
                                if (count > 0) {
                                    for (var j = 0; j <= count; j++) {
                                        item.push(this.data[i - count + j])
                                    }

                                    key = key + 1;
                                    emit(key, item)
                                } else {
                                    key = key + 1;
                                    emit(key, [this.data[i]])
                                }

                                count = 0;
                                status1 = 0;
                                item = []
                            } else if (status1 == 1 && count == 0) {

                            }
                        }
                    },
                    function (key, reducedVal) {
                        return reducedVal
                    },
                    {
                        out:  'finalOutput'
                    });

         async function getResults() {
            return mongoose.connection.db.collection('finalOutput').find()
         }

         var results = await getResults();
         return results.toArray()

            }
        },
        config: {
            auth: false
        }
    });

    // Start Server
    try {
        await server.start();
        console.log("=========")
    } catch (error) {
        console.log("=========",error)
    }
})();