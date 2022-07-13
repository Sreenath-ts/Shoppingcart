var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')
const userHelper=require('../helpers/user-helpers')
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else
  res.redirect('/login')
}

/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user
  let cartCount=null
  if(req.session.user){
  cartCount=await userHelper.getCartCount(req.session.user._id)
}
  productHelper.getAllProducts().then((products)=>{
    res.render('user/view-products', { products,admin:false,user,cartCount })
  })
   
  
});
 router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
  res.render('user/login',{LoginErr:req.session.loginErr})
  req.session.loginErr=false
  }
 });
 router.get('/signup',(req,res)=>{
  res.render('user/signup')

 });
 router.post('/signup',(req,res)=>{
  userHelper.doSignup(req.body).then((response)=>{
    console.log(response);
    req.session.loggedIn=true
    req.session.user=response
    res.redirect('/')
  })
  
 })
 router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.loginErr="invalid username or password"
      res.redirect('/login')
    }
  })
 })
 router.get('/logout',function(req,res){
  req.session.destroy()
  res.redirect('/')
 })
 router.get('/cart',verifyLogin,async function(req,res,next){
  let products=await userHelper.getCartProducts(req.session.user._id)
  console.log(products)
  res.render('user/cart',{products,user:req.session.user})
 })
 router.get('/add-to-cart/:id',function(req,res){
  
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
  res.json({status:true})
  })
 })
 router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body)
  userHelper.changeProductQuantity(req.body).then(()=>{

  })
 })

module.exports = router;
