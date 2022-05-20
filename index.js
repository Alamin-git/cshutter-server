const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


// verify JWT
function verifyJWT (req,res,next){
  const authHeaders = req.headers.authorization;
  if(!authHeaders){
    return res.status(401).send({message:'unauthorized access'});
  }
  const token = authHeaders.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
      return res.status(403).send({message:'Forbidden access'});
    }
    console.log('decoded', decoded);
    req.decoded = decoded;
    next();
  })
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.buhg1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    // for server Collection
    const serviceCollection = client.db("cShutter").collection("service");
    //for order Collection
    const orderCollection = client.db("cShutter").collection("order");

    /** 
     * ----------------
     * service Collection API
     * ----------------
      */
    // for all services API
    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
    // service find by id API
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // post service API
    app.post("/service", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    // Delete service API
    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

     /** 
     * ----------------
     * order Collection API
     * ----------------
      */
    // order add from client to server API
    app.post('/order', async(req,res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    })
    // show orders for clients in client site API
    app.get('/orders', verifyJWT, async(req,res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        // key & value jodi same hoi taile just keta dilei hoi // "email : email"
        const query = {email};
        const cursor = orderCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
      }else{
        res.status(403).send({message:'Forbidden access'});
      }
    })

    /**
     * AUTH
     */

    app.post('/getToken', async(req,res) =>{
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d'
      });
      res.send(accessToken);
    })




  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("running cShutter server");
});
app.get("/hero", (req, res) => {
  res.send("Hero to Heroku");
});

app.listen(port, () => {
  console.log("Listening to port", port);
});
