const mongoose = require('mongoose')
const { configMongodb } = require('../connections/config')

mongoose.connect(configMongodb.connectionString);

class ContenedorUsuario{
    
    constructor(nombreColeccion , esquema){
        const schema = mongoose.Schema(esquema)
        this.coleccion = mongoose.model(nombreColeccion, schema)
    }

    async get(email){
        try {
            const coleccion = await this.coleccion.findOne({"email": email});
            return coleccion
        } catch (error) {
            return error
        }
       
    }
    async save(data){
        try {
            const result = await this.coleccion.create(data)
            return result._id
          
        } catch (error) {
            console.log(error);
            if(error) return false
        }
      
    }

}
module.exports = ContenedorUsuario