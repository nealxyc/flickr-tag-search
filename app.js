var port = 8080;
if(process.argv.length > 2){
	port = process.argv[2] ;
}
var connect = require('connect');
var serveStatic = require('serve-static');
console.log(new Date());
//console.error(new Date());
console.log("Static content server listening at port " + port);
connect().use(serveStatic(__dirname)).listen(port);