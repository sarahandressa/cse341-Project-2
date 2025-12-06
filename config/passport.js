
const GitHubStrategy = require('passport-github2').Strategy;

module.exports = function (passport) {
  
  passport.serializeUser((user, done) => {
    if (!user || !user.id) return done(new Error('User id missing for session'));
    done(null, user.id);
  });

  
  passport.deserializeUser(async (id, done) => {
    try {
      
      done(null, { id });
    } catch (err) {
      done(err);
    }
  });

  const clientID = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackURL = process.env.CALLBACK_URL || 'http://localhost:3000/github/callback';

  if (!clientID || !clientSecret) {
    console.warn('GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not set — GitHub OAuth will not be available.');
    return;
  }

  passport.use(
    new GitHubStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = {
            id: profile.id,
            username: profile.username,
          };
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
};
