// config/passport.js

const GitHubStrategy = require('passport-github2').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User'); // IMPORTANT: Check the path
const bcrypt = require('bcryptjs'); 

module.exports = function (passport) {
  
  // --- SERIALIZE USER ---
  passport.serializeUser((user, done) => {
    // user.id will be the Mongoose _id for local users
    if (!user || !user.id) return done(new Error('User id missing for session'));
    done(null, user.id);
  });

  
  // --- DESERIALIZE USER ---
  passport.deserializeUser(async (id, done) => {
    try {
      // Fetch the user from the database by ID (Mongoose _id)
      const user = await User.findById(id).select('-password'); 
      done(null, user); 
    } catch (err) {
      done(err);
    }
  });


  // -------------------------------------------------------------------
  // 1. LOCAL STRATEGY (Username and Password)
  // -------------------------------------------------------------------
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await User.findOne({ email });

        if (!user) {
          return done(null, false, { message: 'Invalid credentials.' });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
          return done(null, user); // Success
        } else {
          return done(null, false, { message: 'Invalid credentials.' });
        }
      } catch (err) {
        return done(err);
      }
    })
  );
  
  // -------------------------------------------------------------------
  // 2. GITHUB STRATEGY (OAuth)
  // -------------------------------------------------------------------

  const clientID = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackURL = process.env.CALLBACK_URL || 'http://localhost:3000/auth/github/callback'; 

  if (!clientID || !clientSecret) {
    console.warn('GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not set — GitHub OAuth will not be available.');
  }

  if (clientID && clientSecret) {
    passport.use(
      new GitHubStrategy(
        {
          clientID,
          clientSecret,
          callbackURL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // --- IMPLEMENT YOUR GITHUB USER LOGIC HERE ---
            // 1. Check if a user with profile.id or profile.emails[0].value exists
            // 2. If yes, return the existing user (Mongoose object)
            // 3. If no, create a new user entry in your database and return it
            
            const user = {
                id: profile.id, // Placeholder ID
                username: profile.username,
            };
            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }
};