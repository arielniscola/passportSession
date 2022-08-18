const { Router } = require('express')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const LocalStrategy = require("passport-local").Strategy;
const {Schema} = require('mongoose')
const ProductosAleatorios = require('../contenedor/productosAleatorios')
const router = Router();
const products = new ProductosAleatorios();
const ContenedorUsuario = require('../contenedor/contenedorUsuarios')
const PRIVATE_KEY = "pasapalabra"
const contUsuarios = new ContenedorUsuario('usuario', Schema({email: String, password: String}));

router.get('/productos-test', async (req, res) => {
   products.dataCreate()
   return res.render('productoTabla', { productos: products.productos})

})

router.get('/', authMiddleware, (req, res) => {
   res.sendFile(path.join(__dirname, '../public/home.html'))
})

router.get('/login', loginMiddleware,(req, res) => {
   res.sendFile(path.join(__dirname, '../public/login.html'))
})

router.get('/register', (req, res) => {
   res.sendFile(path.join(__dirname, '../public/register.html'))
})

router.post('/api/register', loginMiddleware, async (req, res) => {
   const { email, password } = req.body;
   password = hashPassword(password)
   await contUsuarios.save({email, password});

   res.redirect('/login')
})

router.get('/api/login', (req, res) => {
   try {
      req.session.username = req.query.username;
      res.redirect("/")
   } catch (error) {
     res.redirect('/login')
   }
})

router.get('/logout', authMiddleware , (req, res) => {
   let session = req.session.username 
   req.session.username = null
   return res.render('logout', {name: session})
})


function authMiddleware(req, res, next){
   if(req.session.username){
       next();
   }else {
       res.redirect("/login")
   }
}

function loginMiddleware(req, res, next){
   if(req.session.username){
      res.redirect('/');
   }else{
      next()
   }
}

function generateToken(user){
   const token = jwt.sign({data: user}, PRIVATE_KEY, { expiresIn: '10m'})
}


function hashPassword(password) {
   return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
 }
 
 function isValidPassword(reqPassword, hashedPassword) {
   return bcrypt.compareSync(reqPassword, hashedPassword);
 }


//strategies

const signupStrategy = new LocalStrategy(
   { passReqToCallback: true },
   async (req, username, password, done) => {
     try {
       const existingUser = await User.findOne({ username });
 
       if (existingUser) {
         return done("User already exists", false);
       }
 
       const newUser = {
         username: username,
         password: hashPassword(password),
         email: req.body.email,
         firstName: req.body.firstName,
         lastName: req.body.lastName,
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
   const user = await User.findOne({ username });
 
   if (!user || !isValidPassword(password, user.password)) {
     return done("Invalid credentials", null);
   }
 
   return done(null, user);
 });

passport.use("register", signupStrategy);
passport.use("login", loginStrategy);

passport.serializeUser((user, done) => {
   done(null, user._id);
 });
 
 passport.deserializeUser((id, done) => {
   User.findById(id, done);
 });

module.exports = router