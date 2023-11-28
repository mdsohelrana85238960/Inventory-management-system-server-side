const express = require('express')
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config()
const { MongoClient,ObjectId, ServerApiVersion } = require('mongodb');


// middleware
app.use(cors());
app.use(express.json());


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



    app.post('/products' , async(req,res) =>{
      const products = req.body;
      const result = await productsCollection.insertOne(products);
      res.send(result);
    })

    app.get('/products', async(req,res) => {
      const result = await productsCollection.find().toArray();
      res.send(result)
  })

    app.get('/singleProduct/:id', async(req,res) => {
      const id = req.params.id
      console.log(id)
      const query = { _id: new ObjectId(id) }
      const result = await productsCollection.findOne(query);
      res.send(result) 
  })




  app.put("/products/:id", async (req, res) => {
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


  app.patch('/products/:id', async(req,res) =>{
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
    const result = await bookCollection.updateOne(query,updateDoc)
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


    app.post('/shop', async(req,res) =>{
        const user = req.body;
        const query = {email: user.email}
        const existingUser = await shopCollection.findOne(query);
        if ((existingUser)) {
          return res.send({message: 'user already exists ' , insertedId: null})
  
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

  app.get('/checkOut', async(req,res) => {
    const result = await checkOutCollection.find().toArray();
    res.send(result)
})


    app.delete('/sold-product-delete/:id', async(req, res)=>{
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await checkOutCollection.deleteOne(query)
      res.send(result)
  })


  app.post('/sales', async(req, res)=>{
    const salesProduct = req.body
    console.log("salesProduct", salesProduct)
    const result = await saleCollection.insertOne(salesProduct)
    res.send(result)
})


  app.patch('/products/:id', async(req, res)=>{
    const id = req.params.id
    const data = req.body
    const query = { _id: new ObjectId(id) }
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            Quantity: data?.quantity ,
            Count: data?.count 
        }
    }

    

  app.get('/sales', async(req,res) => {
    const result = await saleCollection.find().toArray();
    res.send(result)
})

    

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