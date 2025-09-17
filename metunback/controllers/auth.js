const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res, next) => {
  console.log(req.session.isLoggedIn);
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  // Walidacja hasła
  if (password !== confirmPassword) {
    console.log('Hasła się nie zgadzają!');
    return res.redirect('/signup');
  }

  User.findOne({ where: { email: email } })
    .then(userDoc => {
      if (userDoc) {
        console.log('Użytkownik z takim mailem już istnieje!');
        return res.redirect('/signup');
      }
      return bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          return User.create({
            email: email,
            password: hashedPassword
          });
      });
    })
    .then(user => {
      if (!user) return; 
      return user.createCart();
    })
    .then(cart => {
      if (!cart) return;
      console.log('Utworzono użytkownika i koszyk!');
      res.redirect('/login');
    })
    .catch(err => {
      console.log(err);
    });
};
exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ where: { email: email } })
    .then(user => {
      if (!user) {
        console.log('Użytkownik o tym emailu nie istnieje!');
        return res.redirect('/login');
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (!doMatch) {
            console.log('Hasło nie zgadza się!');
            return res.redirect('/login');
          }
          req.session.isLoggedIn = true;
          req.session.user = { id: user.id };
          req.session.save(err => {
            if (err) console.log(err);
          res.redirect('/');
          });
        })
        .catch(err => console.log(err));
      })
    .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};