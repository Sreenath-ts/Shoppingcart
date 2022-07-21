var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')
const userHelper=require('../helpers/user-helpers')
const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
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
  if(req.session.user){
    res.redirect('/')
  }else{
  res.render('user/login',{LoginErr:req.session.userLoginErr})
  req.session.userLoginErr=false
  }
 });
 router.get('/signup',(req,res)=>{
  res.render('user/signup')

 });
 router.post('/signup',(req,res)=>{
  userHelper.doSignup(req.body).then((response)=>{
    console.log(response);
    
    req.session.user=response
    req.session.userLoggedIn=true
    res.redirect('/')
  })
  
 })
 router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      
      req.session.user=response.user
      req.session.userLoggedIn=true
      res.redirect('/')
    }else{
      req.session.userLoginErr="invalid username or password"
      res.redirect('/login')
    }
  })
 })
 router.get('/logout',function(req,res){
  req.session.user=null
  res.redirect('/')
 })
 router.get('/cart',verifyLogin,async function(req,res,next){
  let products=await userHelper.getCartProducts(req.session.user._id)
  
  let totalValue=0
  if(products.length>0){
   totalValue=await userHelper.getTotalAmount(req.session.user._id)
  }
  
  console.log(products)
  res.render('user/cart',{products,'user':req.session.user._id,totalValue})
 })
 router.get('/add-to-cart/:id',function(req,res){
  
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
  res.json({status:true})
  })
 })
 router.post('/change-product-quantity',(req,res,next)=>{
  
  userHelper.changeProductQuantity(req.body).then(async(response)=>{
     response.total=await userHelper.getTotalAmount(req.body.user)
     console.log(response.total)
    
    res.json(response)
  })
 })
 router.post('/remove-cart',(req,res,next)=>{
  userHelper.removeCartAll(req.body).then(()=>{
    res.json({status:true})
  })
 })
 router.get('/place-order',verifyLogin,async(req,res)=>{
  let total=await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
 })
 router.post('/place-order',async(req,res)=>{

  let products=await userHelper.getCartProductList(req.body.userId)
  let totalPrice=await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    console.log(req.body['payment-method']);
    if(req.body['payment-method']==='COD'){
      res.json({success:true})
    }else{
      userHelper.generateRazorpay(orderId,totalPrice).then((response)=>{
          res.json(response)
      })
    }
      
  })
  console.log(req.body)
 })
 router.get('/order-success',(req,res)=>{
  res.render('user/order-success')
 })
 router.get('/order-list',verifyLogin,async(req,res)=>{
  let order=await userHelper.getDate(req.session.user._id)
  console.log(order)
  let proid =await userHelper.bringProId(req.session.user._id)
  let product=await userHelper.bringProDetils(proid)
 

    res.render('user/order-list',{order})
  
  
 })
 router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userHelper.verifyPayment(req.body).then(()=>{
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("payment successfull");
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json(({status:false,errMsg:''}))
  })
 })

module.exports = router;
