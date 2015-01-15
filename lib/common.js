/* TODO
  *** MUST BE ***
  - Que los barcos no se solapen
  YES - Mostrar lista de usuarios conectados
  YES - De los usuarios conectados mostrar los que están jugando y que no sean seleccionables
  YES - Click para conectar usuarios y protocolo de aceptar, comenzar juego...
  YES - Botones de terminar/cancelar partida.
  YES - Guardar en recordset de partida las posiciones de los barcos
  YES - Al recuperar partidas pintar los barcos guardados en la bbdd
  YES - comprobar si acierta o es agua
  YES - Mostrar agua o tocado en tablero enemigo
  YES - Repintar agua o tocado en tablero enemigo cuando se recargue la pagina/juego
  YES - Mostrar agua o tocado en mi tablero
  YES - Repintar agua o tocado en mi tablero
  YES - Detectar Logout
  YES - Actualizar lista oponentes cuando hay un logout
  YES - Evitar que si 2 están jugando que un 3º solicita jugar con alguno de ellos...
  YES - Mostrar Logout del oponente en lista de oponentes
  YES - Detectar logout del oponente en partida y salir de ella ( sin cancelar, solo pausar ).
  YES - Detectar login de oponente en partida y entrar en ella.
  YES - Control de turnos
  YES - Evitar poder lanzar si no es tu turno.
  YES - Detectar final de partida (usuario que consigue hundir todos los barcos contrarios)
  YES - Sonidos de tocado, agua y hundido y paso de board al finalizar.
  - Comprobar que las coordenadas nunca quedan fuera del board.
  - Evitar que haga 2 disparos seguidos muy rapidos.
  - Añadir boton CANCEL al lado de PENDIENTE
  - Cuando se esté en una partida eliminar todas las peticiones pendientes y los avisos en los oponentes.
  - No poderse logar desde otra ventana con un usuario ya logado.
  - Crear una funcion para Popups-Alert
  - Identificar si es tocado o hundido
  - Mostrar el barco completo en el enemyboard cuando sea hundido
  - Quitar insecure y autopublish
  *** NIQUEL ***
  - A tamaño web no cambiar de board, mostrar los 2 (media-queries)
  - Mostrar lista de partidas activas y partidas jugandose (con ambos usuarios online)
  - Control de tiempo, si no dispara que dispare solo => Juego automatico si tiempo es 1seg
  - Usar sesiones para mantener el usuario que soy (me)
  - Colocar los barcos tu mismo con D&D
*/

boats = {
    1:"submarino", //40x40_1.png
    2:"fragata",
    3:"destructor",
    4:"portaviones"
};
shipSize = 30;
shipSizeOffset = 5;
absSize = 250;
spaceIni = shipSize;
wShipSize = shipSize - shipSizeOffset;
hShipSize = shipSize - shipSizeOffset;
bg = { "A":"#00F", "1":"#F00","2":"#F00","3":"#F00","4":"#F00" };
renderedMyBoard = false;
isEndOfGame = false;

partidasDB = new Meteor.Collection( "partidas" );
usersOnlineDB = new Meteor.Collection( "usersonline" );