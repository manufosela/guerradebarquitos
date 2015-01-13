//  partidasDB = new Meteor.Collection( "partidas" );
//  usersOnlineDB = new Meteor.Collection( "usersonline" );

  var counterOverlapTimes = 0;

  Meteor.startup(function () {
    // CADA VEZ QUE EL SERVIDOR SE REINICIA TODOS LOS USUARIOS QUEDAN OFFLINE
    usersOnlineDB.update( { online:true }, { $set:{online:false} } );
  });

  var overlap = function( shipPosition,x,y ) {
    var i, j, p;
    for( i in shipPosition ) {
      p = shipPosition[i];
      for( j in p ) {
        if ( y === p[j].yC ) {
          console.log ( "Y's iguales " + y + " = " + p[j].yC );
          if ( x >= p[j].xC-1 && x <= p[j].xC + p[j].l + 1 ) {
            console.log ( x + " está entre " + p[j].xC +" y " + ( p[j].xC + p[j].l ) );
            counterOverlapTimes++;
            return true;
          }
        }
      }
    }
    return false;
  };

  Meteor.methods({
    getShipsPosition: function( idPartidaActiva, boardPos ) {
      var shipPosition = {},
          pA = partidasDB.find( {_id:idPartidaActiva } ).fetch();

      if ( pA.length == 1 && Meteor.user() ) {
        var numUser = ( pA.length == 1 && pA[0].usuario1 == Meteor.user().username )?1:2;
        if ( pA[0]["shipsPosition_"+numUser] !== null ) {
          shipPosition = pA[0]["shipsPosition_"+numUser];
        } else {
          var maxNumShips = 4, 
              iShip, iLongShip = 1, maxLongShip = 4, 
              xPos, yPos,  
              xIni = boardPos.left + shipSizeOffset, yIni = boardPos.top + shipSizeOffset - hShipSize + 2 ,
              xCoord, yCoord;
          for ( ;iLongShip <= maxLongShip; iLongShip++ ) {
            maxVal = 11 - iLongShip;
            shipPosition[iLongShip] = {};
            for ( iShip = 1; iShip <= maxNumShips; iShip++ ) {
              yCoord = Math.floor( Math.random() * 10 ) + 1;
              console.log ( "yCoord: " + yCoord );
              do {
                xCoord = Math.floor( Math.random() * maxVal ) + 1;
                if ( counterOverlapTimes > 5 ) {  yCoord = Math.floor( Math.random() * 10 ) + 1; counterOverlapTimes = 0; }
                console.log ( "xCoord: " + xCoord );
              } while( overlap( shipPosition, xCoord, yCoord ) );
              console.log ( "--------------" );
              xPos = xCoord * wShipSize + xIni;
              yPos = yCoord * hShipSize + yIni;

              //console.log ( "Barco de longitud "+ iLongShip+ " numero " + iShip + " en " + xCoord+","+yCoord+" ("+xPos+","+yPos+")" );
              shipPosition[iLongShip][iShip] = { x:xPos, y:yPos, xC:xCoord, yC:yCoord, l:iLongShip, n:iShip };
            }
            maxNumShips--;
            //console.log( "------------------" );
          }
          //console.log( shipPosition );

          var objPos = {};
              objPos["shipsPosition_"+numUser] = shipPosition;
          console.log( "---->  " + idPartidaActiva + " soy " + numUser );
          //console.dir( objPos["shipsPosition_"+numUser] );          
          var result = partidasDB.update( {_id:idPartidaActiva}, { $set: objPos } );
          console.log( "shipsPostion updated: " + result );
        }
      }
      return shipPosition;
    },
    getShotsPosition: function( idPartidaActiva ) {
      var pA = partidasDB.find( {_id:idPartidaActiva } ).fetch(),
          shotsPosition = {};
      if ( pA.length == 1 && Meteor.user() ) {
        var numUser = ( pA.length == 1 && pA[0].usuario1 == Meteor.user().username )?1:2,
            otherUser = ( numUser==1 )?2:1;
        shotsPosition[numUser] = ( pA[0]["shots_"+numUser] !== null )?pA[0]["shots_"+numUser]:{};
        shotsPosition[otherUser] = ( pA[0]["shots_"+otherUser] !== null )?pA[0]["shots_"+otherUser]:{};
      }
      return shotsPosition;
    },
    wantPlayWith: function( user ) {
      var me = Meteor.user().username, msg = "";
      if ( partidasDB.find( { usuario1:me, usuario2:user }).count() === 0 && partidasDB.find( { usuario1:user, usuario2:me }).count() === 0 ) {
        gameID = partidasDB.insert({
          '_id':new Mongo.ObjectID()._str,
          'usuario1': me,
          'usuario2': user,
          'fecha': new Date(),
          'accept': false,
          'shipsPosition_1':null,
          'shipsPosition_2':null,
          'shots_1':null,
          'shots_2':null,
          'turno':1
        });
        msg = "Nueva partida creada con id " + gameID;
      } else {
        if ( partidasDB.find( { usuario1:me, usuario2:user, accept:false }).count() == 1 ) {
          msg = "Partida en curso pendiente de ser aceptada por " +user;
        } else if ( partidasDB.find( { usuario1:user, usuario2:me, accept:false } ).count() == 1 ) {
          msg = "Partida en curso pendiente de ser aceptada por ti";
        } else {
          msg = "Partida ya en curso";
        }
      }
      console.log( "Mensaje: " + msg );
      return msg;
    },
    acceptPlay: function( idGame ) {
      var result = partidasDB.update( {_id:idGame}, { $set:{ accept:true } } );
      return result;
    },
    cancelPlay: function( idGame ) {
      console.log( "Cancelando GAME id: " + idGame );
      partidasDB.remove( {_id:idGame} );
    },
    shot: function( idPartida, numUser, xC, yC ){
      // COMPROBAR SI ESE TIRO YA LO HIZO
      var response, element,
          otherUser = ( numUser==1 )?2:1,
          row = partidasDB.find( { _id:idPartida } ).fetch(),
          partida = row[0],
          shot = partida["shots_"+numUser],
          pos = partida["shipsPosition_"+otherUser];
      if ( shot === null ) {shot = {}; partida["shots_"+numUser] = {}; }
      //console.log( shot );

      if ( typeof( shot[xC+"_"+yC] ) == "undefined" ) {
        // COMPROBAR SI ACIERTA O NO
        var i,j;
        response = "A"; // Agua
        for( i in pos ) {
          for( j in pos[i] ) {
            for ( k=0;k<pos[i][j].l;k++) {
              if ( pos[i][j].xC+k == xC && pos[i][j].yC == yC ) {
                element = pos[i][j];
                element.x += wShipSize * k;
                response = ""+(k+1); // Tocado o hundido
                break;
              }
            }
          }
        }
        partida["shots_"+numUser][xC+"_"+yC] = response;
        var params = {}; 
        params["shots_"+numUser] = partida["shots_"+numUser];
        params.turno = otherUser;
        partidasDB.update( {_id:idPartida}, {$set:params } );
      } else {
        response = "R"; // Repetido
      }
      console.log ( "SHOT " + xC+","+yC+": " + response );
      return { response: response, el: element }; 
    },
    offline: function( userId ){
      if ( userId !== null ) {
        usersOnlineDB.update( { _id:userId }, { $set:{ online:false } } );
        console.log( "se pira " + userId );
      }
    },
    online: function( userId ){
      if ( Meteor.user() && usersOnlineDB.findOne( { _id:userId } ) ) {
        usersOnlineDB.update( { _id:userId }, { $set:{ user:Meteor.user().username, online:true } } );
      } else {
        usersOnlineDB.insert( { _id:userId, user:Meteor.user().username, online:true } );
      }
      console.log( "entra " + userId );
    },
    isEndOfGame: function( idPartida ){
      var result = 0,
          row = partidasDB.find( { _id:idPartida } ).fetch(),
          partida = row[0],
          shots_1 = partida.shots_1,
          shots_2 = partida.shots_2,
          s1 = _.filter( _.values( shots_1 ), function(n) { return (parseInt(n) == n ); }),
          s2 = _.filter( _.values( shots_2 ), function(n) { return (parseInt(n) == n ); });
      if ( s1.length == 20 ) { result = 1; }
      if ( s2.length == 20 ) { result = 2; }
      if ( result !== 0 ) { console.log( "Gano usuario " + result ); }
      console.log ( s1.length+", "+s2.length );
      return result;
    }
  });