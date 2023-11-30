const express = require('express')
require('dotenv').config()
const app = express();
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KYE); 
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


const { MongoClient,ObjectId, ServerApiVersion } = require('mongodb');


// middleware
app.use(cors({
  origin:[
    'http://localhost:5173'
  ],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());


console.log(process.env.DB_USER)


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nliodki.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const shopCollection = client.db("inventoryMS").collection("shop")
    const usersCollection = client.db("inventoryMS").collection("users")
    const productsCollection = client.db("inventoryMS").collection("products")
    const checkOutCollection = client.db("inventoryMS").collection("checkOut")
    const saleCollection = client.db("inventoryMS").collection("sales")
    const paymentCollection = client.db("inventoryMS").collection("payment")



    app.post('/payment',async(req,res)=>{
      const id=req.body 
      const paymentResult =await paymentCollection.insertOne(id)
     res.send(paymentResult)
    })

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      console.log(price)
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe?.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
     console.log(paymentIntent.client_secret)
      res.send({
       clientSecret: paymentIntent?.client_secret,
      });
    })

    app.get('/create-payment-intent/:id', async(req,res) => {
      const id = req.params.id
      console.log(id)
      const query = { _id: new ObjectId(id) }
      const result = await checkOutCollection.findOne(query);
      res.send(result) 
  })



    // const verifyToken = async(req,res,next) => {
    //   const token = req.cookies?.token;
    //   console.log('value of token in middleware', token)
    //   if(!token){
    //     return res.status(403).send({message : 'not authorized'})
    //   }
    //   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,decoded) =>{
    //     if (err) {
    //       console.log(err)
    //       return res.status(401).send({message : ' unauthorized'})
    //     }
    //     console.log('value in the token', decoded)
    //     req.user = decoded;
    //     next()
    //   })
      
    // }


    const verifyToken = (req,res,next) =>{
      console.log('inside verifyToken',req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({message:  'unauthorized access'})
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded)=>{
        if (err) {
          return res.status(401).send({message:  'unauthorized access'})
        }
        req.decoded = decoded;
        next();
      })
    }



       //jwt related api
       app.post('/jwt', async(req,res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '10h'})

        res.cookie('token',token ,{
          httpOnly:true,
          secure:true,
          sameSite:'none'
        })
        res.send({token})
      }) 


    app.post('/products',async(req,res) =>{
      const products = req.body;
      const result = await productsCollection.insertOne(products);
      res.send(result);
    })

    app.get('/products/:email', async(req,res) => {
      const email = req.params.email;
    const query = {userEmail:email}
      const result = await productsCollection.find(query).toArray();
      res.send(result)
  })

    app.get('/allProduct', async(req,res) => {
      const result = await productsCollection.find().toArray();
      res.send(result)
  })

    app.get('/singleProduct/:id',async(req,res) => {
      const id = req.params.id
      console.log(id)
      const query = { _id: new ObjectId(id) }
      const result = await productsCollection.findOne(query);
      res.send(result) 
  })




  app.put("/products/:id",async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    console.log("id", id, data);
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updatedUSer = {
      $set: {
        quantity: data.quantity,
        productPhoto: data.productPhoto,
        productName: data.productName,
        location: data.location,
        cost: data.cost,
        profit: data.profit,
        discount: data.discount,
        description: data.description,
        
      },
    };
    const result = await productsCollection.updateOne(
      filter,
      updatedUSer,
      options
    );
    res.send(result);
  });


  app.patch('/products/:id',async(req,res) =>{
    const quantity = req.body.quantity;
    const count = req.body.quantity;
    const id = req.params.id;
    const query = {_id : new ObjectId(id)}
    console.log(query)
    const updateDoc = {
      $set : {
        quantity: parseInt(quantity) - 1,
        count: parseInt(count) + 1


      }
    }
    const result = await productsCollection.updateOne(query,updateDoc)
    res.send(result);
  })

  app.delete('/products/:id', async(req,res) =>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await productsCollection.deleteOne(query)
    res.send(result);
  })


    app.post('/users', async(req,res) =>{
        const user = req.body;
        const query = {email: user.email}
        const existingUser = await usersCollection.findOne(query);
        if ((existingUser)) {
          return res.send({message: 'user already exists ' , insertedId: null})
  
        }
        const result = await usersCollection.insertOne(user);
        res.send(result)
      })

      app.get('/users', async(req,res) => {
        const result = await usersCollection.find().toArray();
        res.send(result) 
    })

      app.patch('/users/:email', async(req,res) =>{
        const email = req.params.email;
        const shopManager = req.body;
        const query = {email: email};
        const options = { upsert : true};
        const updateDoc = {
            $set: {
                shopName: shopManager.shopName,
                shopLogo : shopManager.photo,
                shopId:shopManager.shopId,
                role: shopManager.role
            }
        }
        const result = await usersCollection.updateOne(query,updateDoc,options)
        res.send(result)
      })

      app.patch('/users/admin/:id', async(req,res) =>{
        const id = req.params.id;
        const shopManager = req.body;
        const filter = {_id : new ObjectId(id)};
        const updateDoc = {
            $set: {
                
                role: 'admin'
            }
        }
        const result = await usersCollection.updateOne(filter,updateDoc)
        res.send(result)
      })


    app.post('/shop', async(req,res) =>{
        const user = req.body;
        const query = {email: user.email}
        const existingUser = await shopCollection.findOne(query);
        if ((existingUser)) {
          return res.send({message: 'user already exists ' })
  
        }
        const result = await shopCollection.insertOne(user);
        res.send(result)
      })

      app.get('/shop', async(req,res) => {
        const result = await shopCollection.find().toArray();
        res.send(result) 
    })



    app.post('/checkOut', async(req, res)=>{
      const product = req.body
      const result = await checkOutCollection.insertOne(product)
      res.send(result)
  
  })



app.get('/checkOut/:email',verifyToken, async(req,res) => {
  const email = req.params.email;
const query = {userEmail:email}
  const result = await checkOutCollection.find(query).toArray();
  res.send(result)
}) 


  app.delete('/checkOut/:id',verifyToken, async(req,res) =>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await saleCollection.deleteOne(query)
    res.send(result);
  })


  app.post('/sales',  async(req, res)=>{
    const salesProduct = req.body
    // const query = {productId: (salesProduct.id)}
    const query = {_id:new ObjectId(salesProduct.id)}
    console.log(query)
    const productId = {_id:new ObjectId(salesProduct.productId)}
    const result = await saleCollection.insertOne(salesProduct)
    const findId = await checkOutCollection.deleteOne(query)
    console.log(findId)
    const options = {
      upsert:true
    }
    const updateDoc = {
      $inc:{
        saleCount: 1,
        quantity: -1
      }
    }
    const updateProduct = await productsCollection.updateOne(productId, updateDoc, options)
    res.send(result)
})



  app.get('/sales/:email',async(req,res) => {
    const email = req.params.email;
    const query = {userEmail:email}
    const result = await saleCollection.find(query).toArray();
    res.send(result)
})

  app.get('/AdminSales',  async(req,res) => {
    const result = await saleCollection.find().toArray();
    res.send(result)
})


app.patch('/products/:id',  async(req, res)=>{
  const id = req.params.id
  const data = req.body
  const query = { _id: new ObjectId(id) }
  const options = { upsert: true };
  const updateDoc = {
      $set: {
          Quantity: data?.quantity,
          Count: data?.count 
      }
  }
    const result = await productsCollection.updateOne(query, updateDoc, options)
    res.send(result)
  })
  


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res) => {
    res.send('inventory is running')
})

app.listen(port, () => {
    console.log(`management server is running on port ${port}`)  
})