var db=require('../config/connections')
var collection=require('../config/collections')
const { response } = require('../app')
var objectId=require('mongodb').ObjectId

module.exports={


    addProduct:(product,callback)=>{
     db.get().collection('product').insertOne(product).then((data)=>{
        console.log(data)
        callback(product._id)
     })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((response)=>{
                console.log(response)
                resolve(response)
            })
        })
    },
    getProductDetails:(proId)=>{
       return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
            resolve(product)
        })
       })
    },
    updateProduct:(proId,proDetails)=>{
   return new Promise((resolve,reject)=>{
    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
        $set:{
            Name:proDetails.Name,
            description:proDetails.description,
            price:proDetails.price,
            category:proDetails.category
        }
    }).then((response)=>{
        resolve()
    })
   })
    }
    }