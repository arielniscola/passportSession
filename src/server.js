const express = require('express')
const { Server: IOServer } = require('socket.io')
const path = require('path');
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const app = express()
const LocalStrategy = require("passport-local").Strategy;
const route = require('./routes/index');
const session = require('express-session')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const  { engine } = require('express-handlebars')
//creo instancias de contenedores y busco las configuraciones de las BD
const Contenedor = require('./contenedor/contenedor');
const {configSqlite }= require('./connections/config');
const {configMariaDB } = require('./connections/config');

const mensajeContenedor = new Contenedor(configSqlite, 'Mensaje');
const productoContenedor = new Contenedor(configMariaDB, 'Producto');
const User = require('../src/models/user');


app.use(express.urlencoded({extended:true}));
app.use(express.json())
app.use(cookieParser())
app.use(
    session({
        secret: "pasapalabra",
        cookie: {
            httpOnly: false,
            secure: false,
            maxAge: 10000
        },
        rolling: true,
        resave: false,
        saveUninitialized: false
    }),
    );
app.use(passport.initialize())
app.use(passport.session())
    
    
    app.use(express.static(path.join(__dirname, './public')))
    
    app.engine('hbs', engine({
        extname: '.hbs',
        defaultLayout: path.join(__dirname, './public/views/layouts/index.hbs')
    }))
    app.set('views', path.join(__dirname, './public/views'));
    app.set('view engine', 'hbs');
    
    app.use('/', route);
  
     
    //passport and local strategies
    
const signupStrategy = new LocalStrategy(
    { passReqToCallback: true },
    async (req, username, password, done) => {
        try {
            const existingUser = await User.findOne({username: username})
            if (existingUser) {
                return done(null, false);
            }
            const newUser = {
                password: hashPassword(password),
                username: req.body.username
            };
           
            const createdUser = await User.create(newUser);        
            return done(null, createdUser);
        } catch (err) {
            console.log(err);
            done(err);
        }
    }
    );
    
    const loginStrategy = new LocalStrategy(async (username, password, done) => {
        const user = await User.findOne({username: username});
        if (!user || !isValidPassword(password, user.password)) {
            return done("Invalid credentials", null);
        }
        return done(null, user);
    });
    
    
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });
    
    passport.deserializeUser((id, done) => {
        User.findById(id, done);
    });
    

    passport.use("register", signupStrategy);
    passport.use("login", loginStrategy);
    
    
    //rutes passport
    
    app.post('/register', 
    passport.authenticate("register", { failureRedirect: "/failsignup" }),
    (req, res) => {  res.redirect('/login')}
    );
    
    app.post(
        "/login",
        passport.authenticate("login", { failureRedirect: "/faillogin" }),
        (req, res) => {  res.redirect('/')}
        );
         
    function hashPassword(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    }
          
    function isValidPassword(reqPassword, hashedPassword) {
        return bcrypt.compareSync(reqPassword, hashedPassword);
    }
            
        
//Inicio de servidores
mongoose.connect('mongodb://localhost:27017/coderMensajes', {}).then(()=>{
  console.log("La conexión a la bd se ha realizado correctamente!")

}).catch(err=>console.log(err));
const serverExpress = app.listen(8080, () => 

console.log('Servidor escuchando puerto 8080'))

const io = new IOServer(serverExpress)
        

//websockets

io.on('connection', async socket => {
    console.log(`Se conecto un usuario ${socket.id}`)
    let messagesData = await mensajeContenedor.getAll();
    let products = await productoContenedor.getAll();
    
    io.emit('server:message', messagesData)
    
    io.emit('server:products', products)
    
    socket.on('client:message', async messageInfo => {
        
        await mensajeContenedor.saveObject(messageInfo); 
        messagesData = await mensajeContenedor.getAll();
        io.emit('server:message', messagesData)
    })
    
    socket.on('client:product',async productForm => {
        await productoContenedor.saveObject(productForm);
        products = await productoContenedor.getAll();
        io.emit('server:products', products)
    })
})
