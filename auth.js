const jwtSecret = 'your_jwt_secret';

const jwt = require('jsonwebtoken'),
    passport = require('passport');

    require('./passport');

    let genereateJWTToken = (user) => {
        return jwt.sign(user, jwtSecret, {
            subject: user.Username, 
            expiresIn: '7d',
            algorithm: 'HS256'
        })
    }

    //POST Login

    module.exports = (router) => {
        router.post('/login', (req, res) => {
          passport.authenticate('local', { session: false }, (error, user, info) => {
            if (error) {
              return res.status(500).json({ message: 'Internal server error' });
            }
            if (!user) {
              // Incorrect username or password
              return res.status(401).json({ message: 'Invalid username or password' });
            }
      
            req.login(user, { session: false }, (error) => {
              if (error) {
                return res.status(500).json({ message: 'Internal server error' });
              }
              let token = genereateJWTToken(user.toJSON());
              return res.json({ user, token });
            });
          })(req, res);
        });
      };
      