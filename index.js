const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// MongoDB configuration
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); // Import ObjectId here
const uri = "mongodb+srv://DhruvDh:DHRUV5226W@cluster0.m2kmk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  ssl: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  tlsAllowInvalidCertificates: true,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    
    // Access the Books collection
    const bookCollections = client.db("BookInventory").collection("Books");

    // Insert a book to the database: POST Method
    app.post("/upload-book", async (req, res) => {
      const data = req.body;
      const result = await bookCollections.insertOne(data);
      res.send(result);
    });

    // Get all books & find by category from the database
    app.get("/all-books", async (req, res) => {
      let query = {};
      if (req.query?.category) {
        query = { category: req.query.category };
      }
      const result = await bookCollections.find(query).toArray();
      res.send(result);
    });

    // Update a book method
    app.patch("/book/:id", async (req, res) => {
      const id = req.params.id;
      const updateBookData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: { ...updateBookData }
      };
      const options = { upsert: true };

      const result = await bookCollections.updateOne(filter, updatedDoc, options);
      res.send(result);
    });

    // Delete an item from the database
    app.delete("/book/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await bookCollections.deleteOne(filter);
      res.send(result);
    });

   // Get a single book data
    app.get("/book/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await bookCollections.findOne(filter);
      res.send(result);
    });
  //  Get a single book data
// app.get("/book/:id", async (req, res) => {
//   const id = req.params.id;
//   const filter = { _id: new ObjectId(id) };
//   const result = await bookCollections.findOne(filter);
//   if (result) {
//     res.send(result);
//   } else {
//     res.status(404).send({ message: "Book not found" });
//   }
// });

 // Get the distinct categories and their counts
 app.get("/categories-count", async (req, res) => {
  const result = await bookCollections.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        category: "$_id",
        count: 1,
        _id: 0
      }
    }
  ]).toArray();
  res.send(result);
});

// Access the Users collection
const userCollection = client.db("BookInventory").collection("User");

// Register a new user (POST method)
app.post("/register-user", async (req, res) => {
    const { username, email, password } = req.body;
    
    // Check if the user already exists
    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
        return res.status(400).send({ message: "User already exists" });
    }

    // Hash the password before storing it (use a hashing library like bcrypt)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        username,
        email,
        password: hashedPassword,
        createdAt: new Date()
    };

    const result = await userCollection.insertOne(newUser);
    res.status(201).send(result);
});



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
