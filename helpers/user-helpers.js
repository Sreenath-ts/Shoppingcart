var db=require('../config/connections')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { USER_COLLECTION } = require('../config/collections')
const { Collection } = require('mongodb')
const { response } = require('../app')
var objectId=require('mongodb').ObjectId
const Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'rzp_test_0iQ1A2BuRQuqNn',
    
    key_secret: 'QXZ4CcKvPPTiWh5ezqIHyfIM'
    
  });
 
module.exports={

 doSignup:(userData)=>{
    return new Promise(async(resolve,reject)=>{
        userData.Password=await bcrypt.hash(userData.Password,10)
        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
            resolve(data)
        })
        
    })
   
 },
 doLogin:(userData)=>{
    return new Promise(async(resolve,reject)=>{
       let loginStatus=false
        let response={}

        
        let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
     if(user){
        bcrypt.compare(userData.Password,user.Password).then((status)=>{
            if(status){
                console.log('login success');
                response.user=user
                response.status=true
                resolve(response)
            }else{
                console.log('login failed');
                resolve({status:false})
            }
        })
     }else{
        console.log('email failed');
        resolve({status:false})
     }   

    })

 },
 addToCart:(proId,userId)=>{
    let proObj={
        item:objectId(proId),
        quantity:1
    }
    return new Promise(async(resolve,reject)=>{
        let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(userCart){
            let proExist=userCart.products.findIndex(products=> products.item==proId)
            console.log(proExist);
            if(proExist!=-1){
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId),'products.item':objectId(proId)},
                {
                    $inc:{'products.$.quantity':1}
                }).then(()=>{
                    resolve()
                })
            }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                {
                    $push:{products:proObj}
                }
                ).then((response)=>{
                    resolve()
                })
            }



            
        
        }else{
            let cartObj={
                user:objectId(userId),
                products:[proObj]
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                resolve()
            })
        }
    })
 },
 getCartProducts:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:objectId(userId)}
            },
              {
                $unwind:'$products'
              },
              {
                   $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                   }
              },
              {
               $lookup:{
                from:collection.PRODUCT_COLLECTION,
                localField:'item',
                foreignField:'_id',
                as:'product'
               } 
              },
              {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
              }
           


        ]).toArray()
        console.log(cartItems);
        resolve(cartItems)
    })
 },
 getCartCount:(userId)=>{
    let count=0;
    return new Promise(async(resolve,reject)=>{
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(cart){
            count=cart.products.length
        }
        resolve(count)
    })
 },
 changeProductQuantity:(details)=>{
    
    details.count=parseInt(details.count)
    details.quantity=parseInt(details.quantity)
     return new Promise((resolve,reject)=>{
        if(details.count==-1 && details.quantity==1){
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},
            {
                $pull:{products:{item:objectId(details.product)}}
            }).then((response)=>{
                resolve({removeProduct:true})
            })
        }else{
        db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
        {
            $inc:{'products.$.quantity':details.count}
        }).then((response)=>{
            resolve({status:true})
        })
    }
     })
    
 },
 removeCartAll:(details)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.CART_COLLECTION).updateOne(
            { _id:objectId(details.cart) }, 
            {$pull:{"products":{"item":objectId(details.product)}}},{multi:true}
        ).then(()=>{
            resolve()
        })
    })
        
    
 },
 getTotalAmount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:objectId(userId)}
            },
              {
                $unwind:'$products'
              },
              {
                   $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                   }
              },
              {
               $lookup:{
                from:collection.PRODUCT_COLLECTION,
                localField:'item',
                foreignField:'_id',
                as:'product'
               } 
              },
              {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
              },
              {
                $group:{
                        _id:null,
                    total:{$sum:{$multiply:[{$toInt: '$quantity'},{$toInt:'$product.price'}]}}
                }
              }
           


        ]).toArray()
        
        resolve(total[0].total)
    })

 },
 getCartProductList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        console.log(cart)
        
            resolve(cart.products)
        
        
    })
 },
 placeOrder:(order,products,total)=>{
    return new Promise((resolve,reject)=>{
        console.log(order,products,total);
        let status=order['payment-method']==='COD'?'placed':'pending'
        let orderObj={
            deliveryDetials:{
                mobile:order.mobile,
                address:order.address,
                pincode:order.pincode
            },
            userId:objectId(order.userId),
            paymentMethod:order['payment-method'],
            products:products,
            totalAmount:total,
            status:status,
            date:new Date()
        }
        db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
            db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                console.log(response.insertedId)
                resolve(response.insertedId)
            
          
        })
    })

 },
 
 getDate:(userId)=>{
    console.log(userId)
    return new Promise(async(resolve,reject)=>{
        let  order={}
         order=await db.get().collection(collection.ORDER_COLLECTION).findOne({userId:objectId(userId)})
        
            resolve(order)
        
        
    })
 },
bringProId:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let  order={}
        order=await db.get().collection(collection.ORDER_COLLECTION).findOne({userId:objectId(userId)})
        resolve(order.products[0].item)
    })

 },
 bringProDetils:(proId)=>{
    return new Promise(async(resolve,reject)=>{
        let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})
        resolve(product)
    })
 },
 generateRazorpay:(orderId,total)=>{
    console.log(orderId)
    return new Promise((resolve,reject)=>{
      var options={
        amount:total*100,
        currency:"INR",
        receipt:""+orderId

      };
      instance.orders.create(options,function(err,order){
        if(err){
            console.log(err);
        }else{
        console.log("huhudhhhh:"+order.receipt)
        resolve(order)
        }
      })
    })
 },
 verifyPayment:(details)=>{
   return new Promise(async(resolve,reject)=>{
   
    const crypto=require('crypto')
     
    
    let hmac =crypto.createHmac('sha256', 'QXZ4CcKvPPTiWh5ezqIHyfIM')
    hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
    hmac=hmac.digest('hex')
    if(hmac==details['payment[razorpay_signature]']){
        resolve()
    }else{
        reject()
    }
   })
 },
 changePaymentStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
        {
            $set:{
                status:'placed'
            }
        }).then(()=>{
            resolve()
        })
    })
 }


}