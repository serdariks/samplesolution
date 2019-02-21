
console.log('socker server module imported');

var socketio = require('socket.io');
var io;

var serviceSockets = {};
var socketServiceNames = {};

exports.listen = function(server){

	console.log('socket server listen invoked');

	io = socketio.listen(server);

	console.log('socket io listen invoked');

	var findNextSocketForTarget = function(target){

		var serviceSocketsForTarget = serviceSockets[target];

		var result = null;

		if(serviceSocketsForTarget){

			var sockets = serviceSocketsForTarget.sockets;

			var nextSocketIndex = serviceSocketsForTarget.lastSocketIndex + 1;

			if(sockets.length >= nextSocketIndex + 1){

				serviceSocketsForTarget.lastSocketIndex = nextSocketIndex;

				result = sockets[nextSocketIndex];
			}else
			{
				if(sockets.length > 0)
				{
					serviceSocketsForTarget.lastSocketIndex = 0;

					result = sockets[0];
				}else{

					serviceSocketsForTarget.lastSocketIndex = -1;
				}

			}

		}

		return result;


	}

	var removeServiceSocket = function(socket,serviceName){

		//serviceRegisterRequest.serviceName;

		try
		{

			console.log('will try to remove service socket. socket.id: (' + socket.id + ') serviceName:'+ serviceName);

			if(!serviceName)
			{
				serviceName = socketServiceNames[socket.id];			
			}

			if(!serviceName){
				console.log('service name cannot be found for the socket connection');
				return;
			}

			console.log('unregistering service. socket.id: (' + socket.id + ') serviceName:' +  serviceName);

			var socketsForTheSameServiceToRemove = serviceSockets[serviceName];

			if(socketsForTheSameServiceToRemove)
			{
				//console.log('socketsForTheSameServiceToRemove.findIndex: ' + socketsForTheSameServiceToRemove.findIndex);				

				var socketIndex = socketsForTheSameServiceToRemove.sockets.findIndex(function(s){ return s.id == socket.id;});

				if(socketIndex>-1){

					//remove socket for the same service instance
					socketsForTheSameServiceToRemove.sockets.splice(socketIndex,1);

					delete socketServiceNames[socket.id];

					if(socketsForTheSameServiceToRemove.sockets.length==0){

						//if there are no more service instances left for the same service name, also delete the service entry completely
						delete serviceSockets[serviceName];

					}

					logAllSockets();

				}

			}

		}
		catch(error){
			console.log('error on removing socket with id:' + socket.id + ' Error:' + error);
		}

	};

	var logAllSockets = function () 
	{
		console.log('LOG ALL SOCKETS');

		for(var serviceName in serviceSockets){
		
			var serviceSocketsForAService = serviceSockets[serviceName];

			serviceSocketsForAService.sockets.forEach(function(socket){
				console.log('ServiceName:(' + serviceName + ') last:' + serviceSocketsForAService.lastSocketIndex + ' socket:(' + socket.id +')');
			});

		}
	}

	var logAllJoinedRooms = function(socket){

		var rooms = Object.keys(socket.rooms).join(',');

		console.log('joined rooms for socket:' + socket.id +  ' rooms :' + rooms);
	}


	io.sockets.on('connection',function(socket){

		console.log('socket.handshake.address:' + socket.handshake.address);

		socket.on('receivedConnectedFeedback',function(value){

			//console.log('Client sent a message: ' + value.message);
			//console.log('Client sent a message detailed: ' + JSON.stringify(value));
		});

		socket.on('disconnect',function(){

			console.log('Socket disconnected: ' + socket.id);
			removeServiceSocket(socket);
			logAllSockets();
			setTimeout(function(){logAllJoinedRooms(socket);},3000);
		});

		socket.emit('mySocketConnected',{socketId:socket.id,dummyText:'asdf123',handshakeAddress:socket.handshake.address});

		//console.log(process.env);
		
		console.log('Socket connection established. SocketId: ' + socket.id);


		socket.on('registerService',function(serviceRegisterRequest){

			console.log('service registered, serviceName: ' + serviceRegisterRequest.serviceName);


			if(!serviceSockets[serviceRegisterRequest.serviceName])
			{				
				serviceSockets[serviceRegisterRequest.serviceName] = {lastSocketIndex:-1,sockets:[]};

				console.log('created new service registration for service name ' + serviceRegisterRequest.serviceName);
			}

			var socketsForTheSameService = serviceSockets[serviceRegisterRequest.serviceName];

			var alreadyExists = socketsForTheSameService.sockets.findIndex(function(s){ return s.id == socket.id }) > -1;

			if(!alreadyExists)
			{
				socketsForTheSameService.sockets.push(socket);
				socketServiceNames[socket.id]=serviceRegisterRequest.serviceName;
			}


			logAllSockets();

		});

		socket.on('unRegisterService',function(serviceRegisterRequest){

			
			removeServiceSocket(socket,serviceRegisterRequest.serviceName);

		});



		socket.on('join',function(room){

			socket.join(room);

			//console.log('socket with id:' + socket.id + ' joined room: ' + room);
			//logAllJoinedRooms(socket);
			setTimeout(function(){logAllJoinedRooms(socket);},3000);

		});						

		socket.on('leave',function(room){

			console.log('will leave room socket with id:' + socket.id + ' room: ' + room);

			socket.leave(room);

			setTimeout(function(){logAllJoinedRooms(socket);},3000);

			//console.log('socket with id:' + socket.id + ' left room: ' + room);

		});					
		

		socket.on('invokeService',function(serviceCallPackage){

			//console.log('on invokeService. serviceCallPackage: ' + JSON.stringify(serviceCallPackage));

			serviceCallPackage.originSocketId = socket.id;

			if(serviceCallPackage.Target)
			{

				var target = serviceCallPackage.Target;

				/*var serviceSocketsForTarget = serviceSockets[target];

				if(serviceSocketsForTarget && serviceSocketsForTarget.sockets.length > 0)
				{									
					var serviceSocket = serviceSocketsForTarget.sockets[0];

					console.log('will invoke service with identity: ' + target + ' on socket: ' + serviceSocket.id);
					serviceCallPackage.originSocketId = socket.id;

					serviceSocket.emit('invokeService',serviceCallPackage);
				}else
				{
					console.log('service socket undefined for target: ' + target);
				}*/

				var nextSocket = findNextSocketForTarget(target);

				if(nextSocket){

					//console.log('will invoke service with identity: ' + target + ' on socket: ' + nextSocket.id);
					
					nextSocket.emit('invokeService',serviceCallPackage);
				}
				else{

					//console.log('service socket undefined for target: ' + target);
				}

			}
			
			if(serviceCallPackage.TargetRooms)
			{

				serviceCallPackage.TargetRooms.forEach(function(room){

					//console.log('will invoke service with room: ' + room);

					socket.broadcast.to(room).emit('invokeService',serviceCallPackage);

				});	

			}

		});


		socket.on('invokeServiceResponse',function(serviceResponsePackage){

			//console.log('invokeServiceResponse received. serviceReponsePackage: ' + JSON.stringify(serviceResponsePackage));

			var originSocketId = serviceResponsePackage.OriginSocketId;

			//console.log('originSocketId:' + originSocketId)

			var originSocket = io.sockets.connected[originSocketId];

			//console.log('after getting originSocket');

			//console.log('originSocketId:' + originSocketId + 'originSocket!=undefined ? ' + originSocket!=undefined);

			if(originSocket)
			{
				//console.log('will emit invokeServiceResult');

				originSocket.emit('invokeServiceResult',serviceResponsePackage);
			}

		});


	});


}