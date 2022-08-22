const { Router } = require('express')
const path = require('path')
const bcrypt = require('bcrypt')
const ProductosAleatorios = require('../contenedor/productosAleatorios')
const router = Router();
const products = new ProductosAleatorios();




router.get('/productos-test', authMiddleware, async (req, res) => {
   products.dataCreate()
   return res.render('productoTabla', { productos: products.productos})

})

// router.get('/', authMiddleware, (req, res) => {
//    res.sendFile(path.join(__dirname, '../public/home.html'))
// })

router.get('/login',(req, res) => {
   res.sendFile(path.join(__dirname, '../public/login.html'))
})

router.get('/register', (req, res) => {
   res.sendFile(path.join(__dirname, '../public/register.html'))
})


router.get('/failsignup', (req, res) => {
   res.sendFile(path.join(__dirname, '../public/signupError.html'))
})
router.get('/faillogin', (req, res) => {
   res.sendFile(path.join(__dirname, '../public/loginError.html'))
})

router.get('/', authMiddleware, (req, res) => {
  // res.sendFile(path.join(__dirname, '../public/home.html'))
  res.render('home', {name: req.user.username})
})
// router.get('/api/login', (req, res) => {
//    try {
//       req.session.username = req.query.username;
//       res.redirect("/")
//    } catch (error) {
//      res.redirect('/login')
//    }
// })

router.get('/logout', (req, res) => {
   const username = req.user.username;
   req.logout(() => {
      res.render('logout', {name: username})
   });
    
})

function authMiddleware(req, res, next){
   if(req.isAuthenticated()){
       next();
   }else {
       res.redirect("/login")
   }
}
module.exports = router