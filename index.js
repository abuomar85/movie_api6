 const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;
const express = require('express'),
    
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

     // mongoose.connect('mongodb://localhost:27017/moviesDB2', {useNewUrlParser: true, useUnifiedTopology: true});
       mongoose.connect(process.env.CONNECTION_URI, {useNewUrlParser: true, useUnifiedTopology: true});



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
app.get('/Movies/:Title', (req, res) => {
   Movies.findOne({Title: req.params.Title})
  .then((movie) => {
    res.json(movie);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err)
  });
}); 

// add a new movie
app.post("/movies",  (req, res)=> {
  Movies.findOne({Title: req.body.Title})
  .then((movie)=> {
    if(movie) {
      return res.status(400).send(req.body.Title + " already exists")
    } else {
      Movies.create( {
        Title: req.body.Title,
        Description: req.body.Description,
        Genre: req.body.Genre,
        Director: req.body.Director,
        Actors: req.body.Actors,
        ImagePath: req.body.ImagePath,
        Featured: req.body.Featured,
        Rating: req.body.Rating,
        ReleaseYear: req.body.ReleaseYear
      })
      .then((movie) => {
        res.status(201).json(movie);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error " + error);
      })
    }
  })
 })


//update movie
app.put('/movies/:Title', async (req, res) => {
  await Movies.findOneAndUpdate({Title: req.params.Title },
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
    ).then((updateMovie) => {
      res.json(updateMovie);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err)
    });
});

// delete a movie from our list by Id 
app.delete('/movies/:id', (req, res) => {
  Movies.findOneAndDelete({
    _id: req.params.id
  })
  .then((movie) => {
    if(!movie){
      res.status(400).send(req.params.id + ' was not found '); 
    } else {
      res.status(200).send(req.params.id + ' was deleted.'); 
    }
  }).catch((err) => {
    console.error(err); 
    res.status(500).send('Error: ' + err); 
  }); 
});


// Get all users

app.get('/users', (req,res) => {
   Users.find()
  .then((users) => {
    res.status(201).json(users);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err)
  });
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

  // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
      .then((user) => {
        if (user) {
          //If the user is found, send a response that it already exists
          return res.status(400).send(req.body.Username + ' already exists');
        } else {
          Users
            .create({
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) => { res.status(201).json(user) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });
  // Get a user by username 

  app.get('/users/:Username', (req, res) => {
     Users.findOne({Username: req.params.Username})
    .then((user)=> {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err)
    });
  });

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
    app.get('/movies/directors/:Name', (req, res) => {
     Movies.find({'Director.Name' : req.params.Name})
     .then((movies) => {
      res.status(200).json(movies);
     })
     .catch((err) => {
      res.status(500).send('Error: ' + err);
     });
   });

   app.get('/movies/actors/:ActorName', (req, res) => {
    Movies.find({ Actors: req.params.ActorName })
      .then((movies) => {
        if (!movies || movies.length === 0) {
          return res.status(404).json({ message: 'No movies found for this actor' });
        }
        res.status(200).json(movies);
      })
      .catch((err) => {
        res.status(500).send('Error: ' + err);
      });
  });


  //get information about director
   app.get('/directors/:DirectorName', (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.DirectorName })
      .then((movie) => {

        if(!movie || !movie.Director) {
          return res.status(404).json({message: 'Director not found'})
        }
        res.status(200).json(movie.Director);
      })
      .catch((err) => {
        res.status(500).send('Error: ' + err);
      });
  });
  
  // get information about genre 
  app.get('/genres/:GenreName', (req, res) => {
    Movies.findOne({'Genre.Name': req.params.GenreName})
    .then((genre) => {
      res.status(200).json(genre.Genre);
    })
    .catch((err) => {
      res.status(500).send('Error: ' + err )
    })
  })


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
    app.put('/users/:Username', passport.authenticate('jwt', {session:false}), async(req, res) => {
      // check if the user is authenticated 
      if(req.user.Username !== req.params.Username) {
        return res.status(400).send('Pesrmission denied');

      }
      
      await Users.findOneAndUpdate({Username: req.params.Username},
        {$set: 
          {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          }
        },
        {new : true}
        ).then((updatedUser) => {
          res.json(updatedUser);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
        })
    }); 

    //Add a movie to users's list of favorites

    app.post('/users/:Username/:movies/:MovieID', ( req, res)=> {
       Users.findOneAndUpdate({Username: req.params.Username}, {
        $push: {
          FavoriteMovies: req.params.MovieID
        }
      }, {new: true})
      .then((updatedUser) => {
        res.json(updatedUser);
      }).catch((err) => {
        console.error(err);
        res.status(500).send( 'Error: ' + err)
      })
    } )

    // delete a movie form user's favorite list 
    app.delete('/users/:Username/movies/:movieId', (req, res) => {
      Users.findOneAndUpdate(
        {Username: req.params.Username},
        {$pull: {FavoriteMovies: req.params.movieId}},
        {new: true}
      )
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
    }); 
    


    // Delete user by username 

    app.delete('/users/:Username', (req, res) => {
  Users.findOneAndDelete({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//handle the error 
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke');
})

/* app.listen(8080, () => {
  console.log('Your app is listening on port 8080');
});  */

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});