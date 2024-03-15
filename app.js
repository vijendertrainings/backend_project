const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'lkjwklerjwlwkejrewlkrjjwerlwer'; // Change this to a strong random string
const MONGODB_URI = 'mongodb+srv://adminuser89:dell2525@cluster0.klvydtn.mongodb.net/main'; // Replace this with your MongoDB Atlas URI


// Middleware to parse JSON bodies
app.use(express.json());

// Middleware for token authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ error: 'Bearer token is missing' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired bearer token' });
    req.user = user;
    next();
  });
};

// Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Define user schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: {type:String},
  role: {type: String} 
}, { timestamps: true });

// Create User model
const User = mongoose.model('User', userSchema);

// Dummy user data
const users = [
  {
    id: 1,
    username: 'user1',
    password: 'password1',
    role: 'admin'
  },
  {
    id: 2,
    username: 'user2',
    password: 'password2',
    role: 'user'
  }
];

// Login endpoint
app.post('/login', (req, res) => {
  // In a real scenario, you would check the username and password against your database
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const accessToken = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY);
  res.json({ accessToken });
});

// Sample list of values (replace with your own data source)
const values = ['apple', 'banana', 'orange', 'grape', 'kiwi'];

// Endpoint to fetch a list of values
app.get('/api/values', (req, res) => {
  res.json(values);
});

// Endpoint to add a new user
app.post('/users', authenticateToken, async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create a new user
    const newUser = new User({ username, password, role });
    await newUser.save();
    
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Endpoint to fetch a list of users
app.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Define query schema
const querySchema = new mongoose.Schema({
  query_title: { type: String },
  query_description: { type: String},
  asked_by_userid: {type: String},
  count_of_replies:{type: Number},
  created_date: {
    type: Date,
    required: true,
    default: () => {
        const istOffset = 5.5 * 60 * 60 * 1000; // IST offset is UTC+5.5 hours
        const now = new Date();
        const istDatetime = new Date(now.getTime() + istOffset);
        return istDatetime;
    }
},
}, { versionKey: false });


// Create query model
const Query = mongoose.model('Query', querySchema);

// Endpoint to add a new query
app.post('/queries', authenticateToken, async (req, res) => {
  const {query_title, query_description, asked_by_userid, count_of_replies} = req.body;

  try {
    // Create a new query
    const newQuery = new Query({query_title, query_description, asked_by_userid, count_of_replies});
    console.log(newQuery);
    await newQuery.save();
    
    res.status(201).json(newQuery);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to create query' });
  }
});

// Endpoint to fetch a list of queries
app.get('/queries', authenticateToken, async (req, res) => {
  try {
    const queries = await Query.find();
    res.json(queries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
});

// Endpoint to update the count_of_replies field in a query
app.put('/queries/:id/updateCountOfReplies', authenticateToken, async (req, res) => {
  const queryId = req.params.id; // Get the query ID from the request parameters
  const newCount = req.body.count_of_replies; // Get the new count of replies from the request body

  try {
    // Update the count_of_replies field in the MongoDB document
    const updatedQuery = await Query.findByIdAndUpdate(queryId, { count_of_replies: newCount }, { new: true });

    if (!updatedQuery) {
      return res.status(404).json({ error: 'Query not found' });
    }

    // If the document is successfully updated, send a success response
    return res.status(200).json(updatedQuery);

  } catch (error) {
    // If an error occurs, send an error response
    console.error('Error updating count of replies:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Define a function to update the count_of_replies field
async function updateCountOfReplies(queryId, newCount) {
  try {
      // Find the document by its ID and update the count_of_replies field
      const query = await QueryModel.findByIdAndUpdate(queryId, { count_of_replies: newCount }, { new: true });

      if (!query) {
          console.log("Query not found!");
          return; // Handle case where query document with given ID doesn't exist
      }

      console.log("Count of replies updated successfully:", query);

  } catch (error) {
      console.error("Error updating count of replies:", error);
      // Handle error
  }
}

// Call the function to update the count_of_replies field
updateCountOfReplies('your_query_id_here', 10);

// Define reply schema
const replySchema = new mongoose.Schema({
  query_id: { type: String },
  reply_details: { type: String },
  replied_by_userid: { type: String},
  created_date: {
    type: Date,
    required: true,
    default: () => {
        const istOffset = 5.5 * 60 * 60 * 1000; // IST offset is UTC+5.5 hours
        const now = new Date();
        const istDatetime = new Date(now.getTime() + istOffset);
        return istDatetime;
    }
},
}, { versionKey: false });

// Create reply model
const Reply = mongoose.model('Reply', replySchema);

// Endpoint to add a new reply
app.post('/replies/:query_id', authenticateToken, async (req, res) => {
  const {query_id} = req.params; // Get the query ID from the request parameters
  const {reply_details, replied_by_userid} = req.body;

  try {
    // Create a new reply
    const newReply = new Reply({query_id, reply_details, replied_by_userid});
    console.log(newReply);
    await newReply.save();
    
    res.status(201).json(newReply);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to create reply' });
  }
});

// Endpoint to fetch a list of replies
// app.get('/replies', authenticateToken, async (req, res) => {
//   try {
//     const replies = await Reply.find();
//     res.json(replies);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch replies' });
//   }
// });

// Endpoint to fetch replies based on a specific query_id
app.get('/replies/:query_id', authenticateToken, async (req, res) => {
  const query_id = req.params.query_id; // Get the query ID from the request parameters

  try {
    // Find replies based on the specified query_id
    const replies = await Reply.find({ query_id });
    res.json(replies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});