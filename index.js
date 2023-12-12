 const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;
const express = require('express');
const bcrypt = require('bcrypt');

      morgan = require('morgan');
      require('./passport')
      app = express();
      const {check, validationResult} = require('express-validator');
     const uuid = require('uuid');
     const bodyParser = require('body-parser');
     const cors = require('cors');
    app.use(cors());
    let auth = require('./auth')(app);
     const passport = require('passport');
     
      // use morgan to log the visited links 
      app.use(morgan('common'));
      app.use(bodyParser.json());

      mongoose.connect('mongodb://localhost:27017/moviesDB2', {useNewUrlParser: true, useUnifiedTopology: true});
       //mongoose.connect(process.env.CONNECTION_URI, {useNewUrlParser: true, useUnifiedTopology: true});



//the main page of app
/* app.get('/' ,(req, res) => {
  res.send('Welcome to my movie club');
}); */

app.get('/', (req, res) => {
  res.sendFile('index.html', {root: __dirname})
});
// get all movies 

app.get('/movies', passport.authenticate('jwt', {session: false}), async(req, res) => {
  await Movies.find()
  .then((movies)=> {
    res.status(201).json(movies);
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send('Error: ' + error)
  });
});
// get the documentation file
app.get('/documentation', (req, res) => {
  res.sendFile('public/documentation.html', {root: __dirname})
});
app.use(express.static('public'));

// Get the data about a single movie by name 
app.get('/Movies/:Title', passport.authenticate('jwt', {session: false}), async (req, res) => {
  try {
    const movie = await Movies.findOne({Title: req.params.Title});
    if(!movie) {
      return res.status(404).json({error: 'Movie not found'});
    }

    res.json(movie);
  } catch(err) {
    console.error(err);
    res.status.send('Error: ' + err)
  }
}); 

// add a new movie
app.post("/movies", passport.authenticate('jwt', {session: false}), async(req, res)=> {
  try {
    const existingMovie = await Movies.findOne({Title: req.body.Title});
    
    if(existingMovie) {
      return res.status(400).send(req.body.Title + " already exists");
    }
    const newMovie = await Movies.create({
        Title: req.body.Title,
        Description: req.body.Description,
        Genre: req.body.Genre,
        Director: req.body.Director,
        Actors: req.body.Actors,
        ImagePath: req.body.ImagePath,
        Featured: req.body.Featured,
        Rating: req.body.Rating,
        ReleaseYear: req.body.ReleaseYear
    });
    res.status(201).json(newMovie);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  }
  });

//update movie
app.put('/movies/:Title',passport.authenticate('jwt', {session: false}), async (req, res) => {
  try {
    const updateMovie = await Movies.findOneAndUpdate(
      {Title: req.params.Title},
      {
        $set: {
          Title: req.body.Title,
          Description: req.body.Description,
          ImagePath: req.body.ImagePath,
          Featured: req.body.Featured,
          Actors: req.body.Actors,
          Rating: req.body.Rating,
          ReleaseYear: req.body.ReleaseYear 
        }
      },
      {new: true}
      ); 
      if(!updateMovie) {
        return res.status(404).json({error: 'Movie not found'});
      }
      res.json(updateMovie);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err)
  }
});

// delete a movie from our list by Id 
app.delete('/movies/:id', passport.authenticate('jwt' , {session: false} ), async (req, res) => {
  try {
    const movie = await Movies.findOneAndDelete({  _id: req.params.id});
    
    if(!movie) {
      return res.status(404).json({error: req.params.id + ' was not found'});
    }

    return res.status(200).json({message: req.params.id + ' was deleted'});
  } catch(err) {
    console.error(err);
    return res.status(500).json({error: 'Error: ' + err});
  }
});


// Get all users 

app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const users = await Users.find({}, 'Username Email Password Birthday FavoriteMovies'  );
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Add a user 
/*
  user will be expected in json format like this
  {
    ID: Integer,
    Username: String,
    Password: String,
    Email: String,
     Birthday: Date
  }
*/
app.post('/users',
  // Validation logic here for request
  //you can either use a chain of methods like .not().isEmpty()
  //which means "opposite of isEmpty" in plain english "is not empty"
  //or use .isLength({min: 5}) which means
  //minimum value of 5 characters are only allowed
  [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
      }

      const hashedPassword = Users.hashPassword(req.body.Password);
      const existingUser = await Users.findOne({Username: req.body.Username});

      if(existingUser) {
        return res.status(400).send(req.body.Username + ' already exists');
      }
      const newUser = await Users.create({
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      });
      res.status(201).json(newUser);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error: ' + error);
    }});

  // Get a user by username 
  app.get('/users/:Username', passport.authenticate('jwt' , {session: false}) , async (req, res) => {
    try {
      const user = await Users.findOne({Username: req.params.Username})
      if(!user) {
        return res.status(404).json({error: 'User not found'});
      }
      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error' + err);
    }});

  // find all movies with specific genre
  app.get('/movies/genres/:Name', (req, res) => {
    Movies.find({ 'Genre.Name': req.params.Name })
      .then((movies) => {
        res.status(200).json(movies);
      })
      .catch((err) => {
        res.status(500).send('Error: ' + err);
      });
  });

  // find all movies with specific Director 
  app.get('/movies/directors/:Name', async (req, res) => {
    try {
      const movies = await Movies.find({ 'Director.Name': req.params.Name });
  
      if (movies.length === 0) {
        return res.status(404).json({ message: 'No movies found for this director' });
      }
  
      res.status(200).json(movies);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    }
  });
  

  app.get('/movies/actors/:ActorName', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
      const movies = await Movies.find({ Actors: req.params.ActorName });
  
      if (!movies || movies.length === 0) {
        return res.status(404).json({ message: 'No movies found for this actor' });
      }
  
      res.status(200).json(movies);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    }
  });



  //get information about director
  app.get('/directors/:DirectorName',passport.authenticate('jwt', {session:false}), async (req, res) => {
    try {
      const movie = await Movies.findOne({'Director.Name': req.params.DirectorName})
      if(!movie || !movie.Director) {
        return res.status(404).json({message: 'Director not found'});
      }

      res.status(200).json(movie.Director);
    } catch(err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    }
  });
  

  // get information about genre 
  app.get('/genres/:GenreName', passport.authenticate('jwt', {session: false}), async (req, res) => {

    try {
      const movie = await Movies.findOne({'Genre.Name': req.params.GenreName})
      if(!movie || !movie.Genre) {
        return res.status(404).json({message: 'Genre not found '});
      }
      res.status(200).json(movie.Genre);
    } catch(err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    }
  }); 


  // Update a user's info by username
  /*We'll expect JSON in this format 
    {
      Username: String,
      (required)
      Password: String,
      (required)
      Email: String,
      (required)
      Birthday: Date
    }
  */

    // allow authenticated users to update their informations

 
    app.put('/users/:Username', passport.authenticate('jwt', { session: false }), [
      // Validation checks here
  ], async (req, res) => {
      // check the permession
      if (req.user.Username !== req.params.Username) {
          return res.status(400).send('Permission denied');
      }
  
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }
  
      try {
          const updateFields = {};
          if (req.body.Username) updateFields.Username = req.body.Username;
          if (req.body.Email) updateFields.Email = req.body.Email;
          if (req.body.Birthday) updateFields.Birthday = req.body.Birthday;
  
          // Separate logic for updating the password if provided
          if (req.body.Password) {
              const hashedPassword = await bcrypt.hash(req.body.Password, 10);
              updateFields.Password = hashedPassword;
          }
  
          // Update user with the modified fields
          const updatedUser = await Users.findOneAndUpdate(
              { Username: req.params.Username },
              { $set: updateFields },
              { new: true }
          );
  
          res.json(updatedUser);
      } catch (err) {
          console.error(err);
          res.status(500).send('Error: ' + err);
      }
  });
  

    //Add a movie to users's list of favorites

    app.post('/users/:Username/:movies/:MovieID', passport.authenticate('jwt', {session: false}), async( req, res)=> {

      try {
        if(req.user.Username !== req.params.Username) {
          return res.status(401).send('Permission deneid: You can only update your own favorite list.')
        }
        const updatedUser = await Users.findOneAndUpdate(
          {Username: req.params.Username},
          {$addToSet: {FavoriteMovies: req.params.MovieID}},
          {new: true}
        );

        if(!updatedUser) {
          return res.status(404).send('User not found');
        }
        res.json(updatedUser); 
      } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      }
    } )

    // delete a movie form user's favorite list 
    app.delete('/users/:Username/movies/:movieId', passport.authenticate('jwt', {session: false}) , async (req, res) => {
      try {
        if(req.user.Username !== req.params.Username) {
          return res.status(401).send('Permission deneid: You can only update your own favorite list.')
      }
      const updatedUser = await Users.findOneAndUpdate (
        {Username: req.params.Username},
        {$pull: {FavoriteMovies: req.params.movieId}},
        {new: true}
      ); 
      if(!updatedUser) {
        return res.status(404).send('User not found');
      }
      res.json(updatedUser); }
      catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      }
    }); 
    


    // Delete user by username 

    app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
      try {
        // Check if the user to delete exists
        const userToDelete = await Users.findOne({ Username: req.params.Username });
    
        if (!userToDelete) {
          return res.status(404).send(req.params.Username + ' was not found');
        }
    
        if (req.user.Username !== req.params.Username) {
          return res.status(403).send('Forbidden: You can only delete your own account');
        }
    
        const deletedUser = await Users.findOneAndDelete({ Username: req.params.Username });
    
        if (!deletedUser) {
          return res.status(404).send(req.params.Username + ' was not found');
        }
    
        return res.status(200).send(req.params.Username + ' was deleted');
      } catch (err) {
        console.error(err);
        return res.status(500).send('Error: ' + err.message);
      }
    });
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).send('Something broke');
    });
    
/* app.listen(8080, () => {
  console.log('Your app is listening on port 8080');
});  */

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});