const express = require("express");
const app = express();
const Datastore = require('nedb');


app.listen(3000, () => console.log("listening on Port 3000"));
app.use(express.static("public"));
app.use(express.json()); // for parsing application/json

// configure pug
app.set('views', './templates');
app.set('view engine', 'pug');

// init database
const dbCollections = new Datastore("db/collections.db");
const dbBoxes       = new Datastore("db/boxes.db");
dbCollections.loadDatabase();
dbCollections.ensureIndex({ fieldName: "shareid", unique: true})
dbBoxes.loadDatabase();

// routing
const BOT_PATTERNS_REGEX = /Googlebot|bingbot|Slurp|DuckDuckBot|YandexBot|Sosospider/gm;

function itsabot(req, res, doc) {
    if(BOT_PATTERNS_REGEX.exec(req.headers['user-agent'])!= null) { // its a bot
        res.render('index_static', {doc: doc});
        return true;
    } else
        return false;    
}

app.route('/').get( (req, res) =>  {
        itsabot(req, res, [
            {"title":"everything","props":["",""]},
            {"title":"is a box","props":[]}
        ])  ||  res.render('new');
    }
);

app.route('/contact/').get( (req, res) =>  {
        res.render('index_static', {doc: [
            {"title":"everything is a box","props":["",""]},
            {"title":"124horst@gmail.com","props":[]},
            {"title":"Martin Gäbele, 52062 Aachen","props":[]}        
        ]});
    }
);

app.route(['/:shareid/','/:shareid/*']).get( (req, res) =>  {
        dbCollections.findOne({shareid: req.params.shareid}, (err, coldoc) => {
            if(coldoc) {
                dbBoxes.find({shareid: req.params.shareid}, (err,boxdoc) => {
                    if(boxdoc)
                        itsabot(req, res, boxdoc) || res.render('old', {collection: coldoc, boxes: boxdoc});
                    else
                        res.redirect('/');
                });
            }
            else
                res.redirect('/');
        });
    }
);




/*
*
*      A P I
*
*/
app.route('/api/collection/:shareid')
    // .get( (req, res) =>  {
    //     if(req.params.shareid.length != 3)
    //         res.sendStatus(403);
        
    //     dbCollections.findOne({shareid: req.params.shareid}, (err, doc) => {
    //         if(doc)
    //             res.send(doc);
    //         else
    //             res.sendStatus(404);
    //     });
    // })
    .put( (req, res) =>  {
        if(req.params.shareid.length != 4)
            res.sendStatus(403);
        else {
            res.sendStatus(200);
            data = req.body;        
            dbCollections.update({shareid: req.params.shareid},
                {$set: {defaultboxid : data.defaultboxid}}, {upsert:true}, (err, doc) => {
    
            });
        }
    })

app.route('/api/box/')
    .post( (req, res) => {
        const data = req.body;
        dbBoxes.insert(data, (err, newdoc) => {
            // console.log(newdoc);
            res.json(newdoc);

            //TODO update ids inside props (tmpid->id)
            // newdoc.forEach(doc => {
            //     dbBoxes.update({_id: doc.id},{$set: {
            //         title: doc.title,
            //         props: doc.props,
            //     }, $unset: {tmpid:true}}, (err, newdoc) => {
                    
            //     });
            // });
        });
    })
    .patch( (req, res) =>  {
        const data = req.body;
        data.forEach(date => {
            console.log(date);
            dbBoxes.update({_id: date._id},{$set: {
                title: date.title,
                props: date.props,
            }, $unset: {tmpid:true}}, (err, newdoc) => {
                
            });
        });
        res.send({});
    });

app.route('/api/box/:id')
    .get( (req, res) => {
        let key = (req.params.id[0] == "_") ? "tmpid" : "_id";
        dbBoxes.findOne({[key]: req.params.id}, (err, doc) => {
            if(doc)
                res.send(doc);
            else
                res.sendStatus(404);
        });
    })
    .put( (req, res) =>  {
        const data = req.body;
        dbBoxes.update({_id: data.id},{$set: {
            title: data.title,
            props: data.props,
        }, $unset: {tmpid:true}}, (err, newdoc) => {
            
        });
        res.send({});
    });

app.use(function(req, res, next) {
    res.status(404).redirect('/img/404.png');
});