var db=require('../config/connections')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { USER_COLLECTION } = require('../config/collections')
const { Collection } = require('mongodb')
const { response } = require('../app')
var objectId=require('mongodb').ObjectId
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
     return new Promise((resolve,reject)=>{
        db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
        {
            $inc:{'products.$.quantity':details.count}
        }).then(()=>{
            resolve()
        })
     })
 }
}
