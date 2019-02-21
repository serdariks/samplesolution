var express = require('express');
var app = express();

var server = app.listen(8085, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
});


var socketserver = require('./socketserver');

socketserver.listen(server);

/*
var bodyParser = require('body-parser');
var request = require("request");

app.use(express.static('App'));
app.use(bodyParser.json());

app.get('/', function (req, res) {
   res.send('Hello World');
});

var callCenterSite = 'http://cc4skype-server.cc4skype.local:8081/api';

var sendRequest = function(requestData,target,responseHandler){

	request({
    	url: callCenterSite + target,
    	method: "POST",
    	json: requestData
	}

	,
	
	function (error, response, body) {
        
        if (!error && response.statusCode === 200) 
        {
            console.log(body);
        }
        else 
        {
            console.log("error: " + error);

            if(response!=undefined)
            {
            	console.log("response.statusCode: " + response.statusCode);
            	console.log("response.statusText: " + response.statusText);
        	}
        }

        responseHandler(error,response,body);
    }

	);
}


app.post('/SendPerson',function (req,res){

	var person = req.body;

	console.log('body: ' + person.personId);

	//res.end();

	var target = '/home/posttest';

	sendRequest(person,target,function(error,response,body){

		if(response!=undefined)
		{
			res.send(response.body);
		}

	});

	//res.send('You sent ' + person.personId);

});

app.post('/ClientMessageHandler',function (req,res){

	var requestDTO = req.body;

	console.log('body: ' + JSON.stringify(req.body));

	//res.end();

	var target = '/home/ClientMessageHandler';

	sendRequest(requestDTO,target,function(error,response,body){

		if(response!=undefined)
		{
			res.send(response.body);
		}

	});

	//res.send('You sent ' + person.personId);

});*/


/*app.get('/index.html', function (req, res) {
   res.sendFile(__dirname  + "/App/index.html" );
})*/

