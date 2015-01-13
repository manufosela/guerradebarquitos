//  partidasDB = new Meteor.Collection( "partidas" );
//  usersOnlineDB = new Meteor.Collection( "usersonline" );

  $( window ).on( "beforeunload", function(){
    Meteor.call( "offline", Meteor.userId() );
  });


  /**  FUNCTIONS **/

  var getXYPos = function( xC, yC, boardPos ){
    var xIni = boardPos.left + shipSizeOffset, 
        yIni = boardPos.top + shipSizeOffset - hShipSize + 2,
        x = xC * wShipSize + xIni,
        y = yC * hShipSize + yIni;
    return { x:x, y:y };
  };

  var drawBoard = function( id ) {
    if ( document.getElementById( id ) !== null ) {
      var ctx = document.getElementById( id ).getContext( "2d" ),
          i=0,
          l=10,
          s = absSize / l,
          size = absSize + spaceIni;
      ctx.clearRect ( 0 ,0 , 346, 346 );
      ctx.fillStyle = "#dbdbdb";
      ctx.fillRect( spaceIni, spaceIni, absSize, absSize );
      ctx.textBaseline = "top";

      ctx.beginPath();
      ctx.fillStyle = "#311010";
      ctx.font = "bold 12px sans-serif";

      for ( ; i<l; i++ ) {
        ctx.moveTo( spaceIni, i*s+spaceIni );
        ctx.lineTo( size, i*s+spaceIni );
        ctx.fillText( i+1, 10, i*s+spaceIni*1.35 );
        ctx.moveTo( i*s+spaceIni, spaceIni );
        ctx.lineTo( i*s+spaceIni, size );
        ctx.fillText( String.fromCharCode( 65+i ), i*s+spaceIni*1.25, 15 );
      }
      ctx.stroke();
    }
  };

  var putShots = function() {
    var idPartidaActiva = Session.get( "idPartidaActiva" );
    Meteor.call( "getShotsPosition", idPartidaActiva, function( err, shotsPosition ) {
      if ( !err ) {
        var tmp, xyPos, 
            offset = $( "#myboard" ).offset(), el,
            numUser = Session.get( "numUser" ), otherUser = ( numUser==1 )?2:1,
            shotsByOther = shotsPosition[otherUser], shotsByMe = shotsPosition[numUser];
        for( el in shotsByMe ) {
          tmp = el.split( "_" );
          xyPos = getXYPos( tmp[0], tmp[1], offset );
          $( "#enemyboard" ).prepend( '<div id="enemyship_'+tmp[0]+'_'+tmp[1]+'" style="background:'+bg[shotsByMe[el]]+'; position:absolute; top:'+xyPos.y+'px; left:'+xyPos.x+'px; width:25px; height:25px;"></div>' );
        }
        for( el in shotsByOther ) {
          tmp = el.split( "_" );
          xyPos = getXYPos( tmp[0], tmp[1], offset );
          if ( shotsByOther[el] !== "A" && shotsByOther[el] !== "R" ) {
            //console.log( "#imgMyShip_"+tmp[0]+"_"+tmp[1]+"_"+shotsByOther );
            $( "img[data-pos='"+el+"']" ).css( {background:"#F00"} );
          } else {
            $( "#myboard" ).prepend( '<div id="myshot_'+tmp[0]+'_'+tmp[1]+'" class="myshot" style="background:'+bg[shotsPosition[numUser][el]]+'; position:absolute; top:'+xyPos.y+'px; left:'+xyPos.x+'px; width:25px; height:25px;"></div>' );
          }
        }
      } else {
        console.error( "Error en putShots " + err );
      }
    });
  };

  var putShips = function() { 
    var boardPos = $( "#myboard" ).offset(), 
        idPartidaActiva = Session.get( "idPartidaActiva" );
    //console.log( "Put ships en partida "+ idPartidaActiva );
    Meteor.call( "getShipsPosition", idPartidaActiva, boardPos, function( err, shipPosition ) {
      if ( !err ) {
        var i,j,k,xC;
        for( i in shipPosition ) {
          for( j in shipPosition[i] ) {
            $( "#myship_"+i+"_"+j ).css( { position:"absolute", top:shipPosition[i][j].y, left:shipPosition[i][j].x } );
            for( k=0; k<shipPosition[i][j].l; k++ ) {
              xC = shipPosition[i][j].xC+k;
              $( "#myship_"+i+"_"+j+" img[id$="+(k+1)+"]" ).attr( "data-pos", xC+"_"+shipPosition[i][j].yC );
            }
          }
        }
        putShots();
        var pA = partidasDB.find( {_id:idPartidaActiva } ).fetch();
        if ( pA.length == 1 && Meteor.user() ) {
          Session.set( "numUser", ( pA[0].usuario1 == Meteor.user().username )?1:2 );
          //console.log( pA[0].usuario1 + " es " + Meteor.user().username + "? entonces soy usuario " + Session.get( "numUser" ) );
        }
      } else {
        console.log( "ERROR by PutShips. " + err );
      }
    });
  };

  var playGame = function() {
    $( "#info" ).html( "" );
    $( "#boats" ).show();
    $( "#opponents" ).hide();
    $( "#playing" ).hide();
    $( "#peticiones" ).hide();
    $( "#botonera" ).show();
    $( "#message" ).show();
    $( "#mysquare" ).show();
    $( ".myshot" ).show();
    $( "#enemyboard" ).show();
    drawBoard( "mysquare" );
    drawBoard( "enemysquare" );
    putShips();
  };

  var pausedGame = function(){
      $( "#boats" ).hide();
      $( "#botonera" ).hide();
      $( "#peticiones" ).show();
      $( "#message" ).hide();
      $( "#mysquare" ).hide();
      $( ".myshot" ).hide();
      $( "#enemyboard" ).hide();
  };

  var cancelGame = function( idGame ){
    Meteor.call( 'cancelPlay', idGame, function() {
      console.log( "Canceled game "+ idGame );
      Session.set( "idPartidaActiva", null );
      pausedGame();
      $( "#opponents" ).show();
      $( "#playing" ).show();
      $( ".myshot" ).remove();
      $( "#info" ).html( "" );
      $( "[data-pos]" ).css({background:"transparent"});
    });
  };

  var aQuienLeToca = function(){
    var turno = null;
    if ( Session.get( "idPartidaActiva" ) !== null ) {
      var pA = partidasDB.find({_id:Session.get("idPartidaActiva") }).fetch();
      if ( pA.length == 1 ) {
        turno = pA[0].turno;
      }
    }
    return turno;
  };

  Meteor.startup(function () {
    Session.set( "idPartidaActiva", null );
    Session.set( "numUser", null );
    Session.set( "turno", null );

    usersOnlineDB.find({}).observe({
      changed:function(){
        console.log ( "Change users online" );
        // COMPROBAR PARTIDAS ACTIVAS:

        // Actualizar lista de usuarios "Online" que pueden jugar

        //    si está jugando y el oponente se desconecta, sacar de la partida y avisar.

        //    si se acaba de logar y tiene partida activa y el oponente esta online ejecutar PlayGame.
        if ( Meteor.user() ) {
          var me = Meteor.user().username,
              pA = partidasDB.findOne( { $and:[ { $or:[ {usuario1:me}, {usuario2:me } ] }, { accept:true } ] } );
          if ( pA ) {
            var userNum = ( pA.usuario1 == me )?1:2,
                otherNum = ( userNum == 1 )?2:1,
                uO = usersOnlineDB.findOne( { $and:[ { user:pA["usuario"+otherNum] }, { online:true } ] } );
            console.log( userNum + " , " + otherNum + " - " + pA["usuario"+otherNum] );
            console.dir( uO );
            Session.set( "idPartidaActiva", pA._id );
            if ( uO ) {
              playGame();
            } else {
              $( "#info" ).html( "Juego en pausa por logout de su oponente" );
              pausedGame();
              $( "#botonera" ).show();
            }
          }
        }
      }
    });
  });

  /** TEMPLATES **/

  /*  botonera */
  Template.botonera.events({
    'click BUTTON.cancelar': function() {
      var idPartidaActiva = Session.get( "idPartidaActiva" );
      cancelGame( idPartidaActiva );
    }
  });
  Template.botonera.helpers({
    turno: function() {
      var msg = "",
          turno = aQuienLeToca();
      if ( Meteor.user() && Session.get( "idPartidaActiva" ) !== null ) {
        if ( turno == Session.get( "numUser" ) ) {
          msg = "Mi turno";
          $( ".goleft" ).trigger( "click" );
        } else {
          msg = "Turno de su oponente";
          $( ".goright" ).trigger( "click" );
        }
      }
      return msg;
    }
  });

  /*   myboard    */
  Template.myboard.rendered = function() {
    renderedMyBoard = true;
    if ( Meteor.user() ) {
      var me = Meteor.user().username;

      //** TODO: pasar a metodo del servidor **//
      partidaActiva = partidasDB.find({
        $and:[
          { $or: [ { usuario1: me }, { usuario2:me } ] },
          { accept: true }
        ]
      }).fetch();
      if ( partidaActiva.length === 1 ) {
        if ( Session.get( "idPartidaActiva" ) === null ) {
          var idPartidaActiva = partidaActiva[0]._id;
          if ( idPartidaActiva ) {
            Session.set( "idPartidaActiva", idPartidaActiva );
            playGame();
          }
        }
      } else {
        if ( Session.get( "idPartidaActiva" ) !== null ) {
          cancelGame( Session.get( "idPartidaActiva" ) );
          Session.set( "idPartidaActiva", null );
        }
      }
    }
  };

  Template.myboard.events({
    'click i.goleft': function(){
      //$( "#myboard" ).animate( {left:"-100%"}, 1000 );
      $( "#enemyboard" ).animate( {left:0}, 1000 );
    }
  });

  Template.myboard.helpers({
    isLogged: function() {
      if ( Meteor.userId() ) {
        Meteor.call( "online", Meteor.userId() );    
      }
      return Meteor.userId();
    }
  });

  /*   enemyboard  */
  Template.enemyboard.events({
    'click i.goright': function(){
      $( "#enemyboard" ).animate( {left:"-100%"}, 1000 );
      $( "#myboard" ).css( {left:0} );
    },
    'click #enemysquare': function( e ){
      if ( aQuienLeToca() == Session.get( "numUser") ) {
        var xM = e.pageX - 30, yM = e.pageY - 160,
            xC = parseInt( xM / wShipSize) + 1, yC = parseInt( yM / hShipSize ) + 1, 
            params = [ Session.get( "idPartidaActiva" ), Session.get( "numUser" ), xC, yC ];
        Meteor.apply( "shot", params, function( err, data ) {
          if ( !err ) {
            switch( data.response ) {
              case "1": case "2": case "3": case "4":
                $( "#enemyboard" ).prepend( '<div id="enemyship_'+data.el.l+'_'+data.el.n+'" style="background:#F00; position:absolute; top:'+data.el.y+'px; left:'+data.el.x+'px; width:25px; height:25px;"></div>' );
                break;
              case "A":
                var offset = $( "#enemyboard" ).offset(),
                    xyPos = getXYPos( xC, yC, offset );
                $( "#enemyboard" ).prepend( '<div id="enemyship_'+xC+'_'+yC+'" style="background:#00F; position:absolute; top:'+xyPos.y+'px; left:'+xyPos.x+'px; width:25px; height:25px;"></div>' );
                break;
            }
            console.log( String.fromCharCode( 64 + xC ) + ", " + yC + ": " + data.response );
          }
        });
      } else {
        // ALERT: Turno de su oponente, espere por favor.
      }
    }
  });

  /*  ships */  
  Template.ships.helpers({
    data:function(){
      return _.extend( { wShipSize:wShipSize , hShipSize:hShipSize, boats1:boats[1], boats2:boats[2], boats3:boats[3], boats4:boats[4] }, this );
    }
  });

  /*  opponents  */
  Template.opponents.events({
    'click UL LI A':function(){
      Meteor.call( "wantPlayWith", this.user, function( err, data ) {
        if ( !err ) {
          console.log( data );  
        } else {
          console.error( "ERROR en 'click UL LI A': " + err );
        }
      });
    }
  });

  Template.opponents.helpers({
    users: function() {
      var usersOnline = null, andWhere = [];
      if ( Meteor.userId() ) {
        andWhere.push( { _id:{ $ne:Meteor.userId() } } );    
        andWhere.push( { online:true } );       
        var i, j,
            pA = partidasDB.find( { accept:true } ).fetch(),
            uO = usersOnlineDB.find( { $and:[ { _id:{ $ne:Meteor.userId() } }, { online:true } ] } ).fetch(),
        usersKeyLength = Object.keys( uO ).length;
        if ( usersKeyLength > 0 && pA.length > 0 ) {
          for ( j=0; j<pA.length; j++ ) {
            for ( i=0; i<usersKeyLength; i++ ) {
              if ( uO[i].user === pA[j].usuario1 || uO[i].user === pA[j].usuario2 ) {
                andWhere.push( { _id:{ $ne:uO[i]._id } } );
              }
            }
          }
        }
        //console.dir( andWhere );
        console.log( "actualizada lista oponentes "+ new Date() );
        if ( usersOnlineDB.find( { $and: andWhere } ).count() ) {
          usersOnline = usersOnlineDB.find( { $and: andWhere } );
        }
      }
      return usersOnline;
    },      
    requestLaunched: function( username ){
      if ( Meteor.user() ) {
        var me = Meteor.user().username,
            requestLaunched = partidasDB.find( {$and:[ {usuario2:username}, {usuario1:me}, {accept:false} ] } ).count();
        return (requestLaunched)?"PENDIENTE":"";
      }
    }
  });

  /*  playing */
  Template.playing.helpers({
      partidas: function(){
      if ( Meteor.user() ) {
        var pA = partidasDB.find( { accept:true } );
        return pA;
      }
    },
    numpartidas:function(){
      if ( Meteor.user() ) {
        var npA = partidasDB.find( { accept:true } ).count();
        console.log( "num partidas: " + npA );
        return npA;
      }
    }
  });

  /*   peticiones    */
  Template.peticiones.events({
    'click BUTTON.aceptar': function(){
      Meteor.call( "acceptPlay", this._id, function( err, data ){
        if ( !err && data ) {
          playGame();
        }
      });
    },
    'click BUTTON.cancelar': function(){
      cancelGame( this._id );
    }
  });

  Template.peticiones.helpers({
    requestsToPlay:function(){
      if ( Meteor.user() ) {
        var me = Meteor.user().username,
            requestsToPlay = partidasDB.find( {$and:[ {usuario2:me}, {accept:false} ] } );
        return requestsToPlay;
      }
    },
    thereAreRequestsToPlay:function() {
      if ( Meteor.user() ) {
        var me = Meteor.user().username,
            thereAreRequestsToPlay = partidasDB.find( {$and:[ {usuario2:me}, {accept:false} ] } ).count();
        return thereAreRequestsToPlay;
      }
    }
  });

  /*   loginButtons    */
  Template._loginButtonsLoggedInDropdown.events({
    'click #login-buttons-logout':function(){
      Meteor.call( "offline", Meteor.userId() );
    }
  });

/*  Meteor.publish( "peticiones", function () {
    return partidas.find({
      $and:[
        { user: this.userId },
        { accept: false }
      ]
    });
  });
*/



  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

  Tracker.autorun( function() {
    if ( Meteor.user() ) {
      var me = Meteor.user().username;

      peticiones = partidasDB.find({$and:[{ usuario2: me },{ accept: false }]});

      partidaActiva = partidasDB.find({$and:[{ $or: [ { usuario1: me }, { usuario2:me } ] },{ accept: true }]}).fetch();
      if ( partidaActiva.length === 1 ) {
        var partida = partidaActiva[0],
            otherUser = ( partida.usuario1 == me )?2:1;

        if ( Session.get( "idPartidaActiva" ) === null ) {
          var idPartidaActiva = partida._id;
          if ( idPartidaActiva && renderedMyBoard ) {
            console.log ( "Iniciando partida activa" );
            Session.set( "idPartidaActiva", idPartidaActiva );
            playGame();
          }
        } else {
          console.log( "Recuperando partida activa" );

        }

        var shotsToMe = partida['shots_'+otherUser], tmp, xyPos, offset = $( "#myboard" ).offset(), isCanvas = $( "#mysquare" ).length, el;
        if ( typeof offset !== "undefined" && isCanvas ) {
          for( el in shotsToMe ) {
            tmp = el.split( "_" );
            xyPos = getXYPos( tmp[0], tmp[1], offset );
            if ( shotsToMe[el] !== "A" && shotsToMe[el] !== "R" ) {
              //console.log( "#imgMyShip_"+tmp[0]+"_"+tmp[1]+"_"+shotsPosition[el] );
              $( "img[data-pos="+el+"]" ).css( {background:"#F00"} );
            } else {
              if ( $( "#myshot_"+tmp[0]+"_"+tmp[1] ).length === 0 ) {
                $( "#myboard" ).prepend( '<div id="othershot_'+tmp[0]+'_'+tmp[1]+'" class="myshot" style="background:'+bg[shotsToMe[el]]+'; position:absolute; top:'+xyPos.y+'px; left:'+xyPos.x+'px; width:25px; height:25px;"></div>' );
              } else {
                $( "#myshot_"+tmp[0]+'_'+tmp[1] ).css( {background:bg[shotsToMe[el]], position:"absolute", top:xyPos.y+"px", left:xyPos.x+"px"} );
              }
            }
          }
        }
      } else {
        if ( Session.get( "idPartidaActiva" ) !== null ) {
          console.log ( "La partida fue cancelada" );
          cancelGame( Session.get( "idPartidaActiva" ) );
          Session.set( "idPartidaActiva", null );
        }
      }
      
/*      opponentName = partida["usuario"+otherUser];
      opponentIsOnline = usersOnlineDB.find( { user:opponentName } ).count();
      if ( !opponentIsOnline ) {
        console.log( "PAUSAR JUEGO. OPONENTE OFFLINE" );
        pausedGame();
        // ALERT O INFO
      }
*/      

      Session.set( "turno", partidaActiva.turno );
    } else {
      if ( Session.get( "idPartidaActiva" ) !== null ) {
        console.log ( "USUARIO DESLOGADO. PAUSAR JUEGO" );
        pausedGame();
      } else {
        //
      }
    }
  });