var express = require('express');
const { response } = require('../app');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')
/* GET users listing. */
router.get('/',function(req,res,next){
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products})
  })
})

  
 

router.get('/add-product',(req,res)=>{
  res.render('admin/add-product')
})
router.post('/add-product',(req,res)=>{
  console.log(req.body);
  console.log(req.files.image)
  
productHelper.addProduct(req.body,(id)=>{
  console.log(id)
  let image=req.files.image
  image.mv('./public/product-images/'+id+'.jpeg',(err)=>{
    if(!err){
      res.render('admin/add-product')}
      else
      console.log(err)
    
  })
  
})
})
router.get('/delete-product/:id',function(req,res){
   let proId=req.params.id
   productHelper.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
   })
})
router.get('/edit-product/:id',async(req,res)=>{
  let product=await productHelper.getProductDetails(req.params.id)
  
  res.render('admin/edit-product',{product})
})
router.post('/edit-product/:id',(req,res)=>{
  let id=req.params.id
  productHelper.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.image){
      let image=req.files.image
  image.mv('./public/product-images/'+id+'.jpeg')

    }
  })
})

module.exports = router;
