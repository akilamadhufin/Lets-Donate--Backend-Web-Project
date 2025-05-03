const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
require('dotenv').config();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

const app = express();

// for external files like, css
app.use(express.static('public'));

// for handlebars
app.engine('handlebars',exphbs.engine({
    defaultLayout: 'main'

}));
app.set('view engine', 'handlebars');
app.use(express.urlencoded({extended: false}));

// sessions for logins
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// for passport
app.use(passport.initialize());
app.use(passport.session());

// keep the user session once login
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// multer for save images, Images are saved in uploads folder, then the url string will be saved to mongodb
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

//had to change the dns server to google dns as DNA ISP is not supporting srv
const dbURI = 'mongodb+srv://'+process.env.DBUSERNAME+':'+process.env.DBPASSWORD+'@'+process.env.CLUSTER+'.mongodb.net/'+process.env.DB+'?retryWrites=true&w=majority&appName='+process.env.CLUSTER;
console.log(dbURI);

// this is promise function
mongoose.connect(dbURI)
// if it connects do the below
.then ((result)=>
    {
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log("listening on "+ PORT));
        console.log('Connected to db');
    })
    // if does not connect, do the below
    .catch((err)=>{
        console.log(err);
    });
    // we need schema to make the structure of our document


//loading the schema
const Users = require('./models/Users');
const Donations = require('./models/Donations');

// passport configuration
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const user = await Users.findOne({ email });
        if (!user) return done(null, false, { message: 'Incorrect email.' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return done(null, false, { message: 'Incorrect password.' });

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await Users.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});


app.get('/api/users', async (req,res) => {
    try{
        const result = await Users.find();
        res.json(result);
    }
    catch (error){
        console.log(error);
    }
  })

app.get('/api/users/:id', async(req,res) =>{
    const id = req.params.id;
    const users = await Users.findById(id);
    res.json(users);
})

app.get('/users', async (req,res) => {
    try{
        const users = await Users.find();
        //res.json(result);
        res.render('users',
            {
                title: 'Our users',
                users: users.map(users => users.toJSON())
            }
        );
    }
    catch (error){
        res.status(404).render('users', {
            title: 'Something wrong'
        })
        console.log(error);
    }
  })

  //user registration
// get user-registration page
app.get('/user-registration', (req, res) => {
    res.render('user-registration');
});

// POST to create new user
app.post('/users',
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters'),
    body('firstname').notEmpty().withMessage('First name is required'),
    body('lastname').notEmpty().withMessage('Last name is required'),
    body('contactnumber').notEmpty().withMessage('Contact number is required'),
    body('address').notEmpty().withMessage('Address is required'),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('user-registration', {
                errors: errors.array(),
                ...req.body
            });
        }

        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const newUser = new Users({
                ...req.body,
                password: hashedPassword
            });
            await newUser.save();

            // Auto-login after registration
            req.login(newUser, (err) => {
                if (err) {
                    console.error('Login error:', err);
                    return res.render('user-registration', {
                        error: 'Login failed after registration',
                        ...req.body
                    });
                }
                req.session.user = newUser;
                return res.redirect('/');
            });

        } catch (error) {
            console.error(error);
            res.render('user-registration', {
                error: 'Registration failed',
                ...req.body
            });
        }
    }
);


// delete and update- we have to use them in the project


// login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await Users.findOne({ email });
        
        if (user && user.password === password) {
            req.session.user = user;  
            res.redirect('/');
        } else {
            res.render('login', { 
                error: 'Invalid credentials' 
            });
        }
    } catch (error) {
        console.error(error);
        res.render('login', { 
            error: 'Something went wrong' 
        });
    }
});

// Render login page
app.get('/login', (req, res) => {
    res.render('login');
});

// logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');  
        res.redirect('/');  
    });
});

// Show donation form
app.get('/donate-form', (req, res) => {
    if (req.session.user) {
        res.render('donate-form', {
            user: req.session.user
        });
    } else {
        res.redirect('/login');
    }
});

// Handle donation form submission
app.post('/donate', upload.single('image'), async (req, res) => {
    try {
        // Attach the image path to the donation object if the image was uploaded
        const newDonationData = {
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            pickupLocation: req.body.pickupLocation,
            imagePath: req.file ? '/uploads/' + req.file.filename : null,
            userId: req.session.user._id
        };

        const newDonation = new Donations(newDonationData);
        await newDonation.save();
        req.session.donationSuccess = 'Donation added successfully! You can view your donations on the "My Donations" page.';
        res.redirect('/mydonations');
    } catch (error) {
        console.error(error);
        res.render('donate-form', { error: 'Something went wrong' });
    }
});

// displaying donations in mydonation page

app.get('/mydonations', async (req, res) => {
    if (req.session.user) {
        try {
            const donations = await Donations.find({ userId: req.session.user._id }).lean();

            const successMessage = req.session.donationSuccess || null;
            delete req.session.donationSuccess;

            res.render('mydonations', {
                user: req.session.user,
                donations: donations,
                successMessage: successMessage,
            });
        } catch (error) {
            console.error(error);
            res.render('mydonations', { error: 'Something went wrong' });
        }
    } else {
        res.redirect('/login');
    }
});



//home
app.get('/', (req, res) => {
    if (req.session.user) {
        // For logged-in users
        res.render('index', {
            user: req.session.user,  
        });
    } else {
        // For logged-out users
        res.render('index');
    }
});


