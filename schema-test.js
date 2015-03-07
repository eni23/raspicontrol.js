var config = require('./src/confignew');

config.init();

//config.device.remove("id","QyMkeHhd");

res=config.device.update( { id: "X17ylBhu", name: 'newname', icon:'fa-newicon' } )
console.log(res)

console.log(config.data)
