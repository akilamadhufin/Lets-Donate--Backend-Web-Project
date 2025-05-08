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
const methodOverride = require('method-override'); // for put method


const app = express();

// for external files like, css
app.use(express.static('public'));

// for handlebars
app.engine('handlebars',exphbs.engine({
    defaultLayout: 'main',
    helpers:{
        isCategorySelected: function (category, value) { // Registering helper to display the selected category in update donation form
            return category === value;
        },
        formatDate: function(date) {
            return date.toLocaleDateString('en-US');
        } 
    }

}));
app.set('view engine', 'handlebars');


app.use(express.urlencoded({extended: false}));

app.use(methodOverride('_method'));


// sessions for logins
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// for passport
app.use(passport.initialize());
app.use(passport.session());

// user session is available for handlbars
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
const Cart = require('./models/Cart');

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


// login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await Users.findOne({ email });
        
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = user;
            
            if (user.isAdmin) {
                return res.redirect('/admin');
            }
            res.redirect('/');
        } else {
            res.render('login', { error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.render('login', { error: 'Something went wrong' });
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

        // email content 
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: req.session.user.email, 
            subject: 'Donation Confirmation',
            text: `Dear ${req.session.user.firstname},\n\nThank you for your donation! Here are the details of your donation:\n\nTitle: ${req.body.title}\nDescription: ${req.body.description}\nCategory: ${req.body.category}\nPickup Location: ${req.body.pickupLocation}\n\nThank you for your generosity!\n\nBest regards,\nThe Let's Donate Team`
        };   
        // Send email
        await transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Error sending email:', err);
                return res.status(500).render('donate-form', { error: 'Error sending email' });
            }
            console.log('Email sent:', info.response);
        });             

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

// displaying user details in myaccount page
app.get('/my-account', async (req, res) => {
    if (req.session.user) {
        try {
            const user = await User.findById(req.session.user._id).lean();

            if (!user) {
                return res.status(404).render('error', { message: 'User not found' });
            }

            res.render('my-account', {
                user: user
            });
        } catch (error) {
            console.error(error);
            res.status(500).render('error', { message: 'Failed to load account details' });
        }
    } else {
        res.redirect('/login');
    }
});

// update donations

// Show update donation form
app.get('/updatedonations-form/:id', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const donation = await Donation.findById(req.params.id);

        // Optional: Check if donation belongs to the logged-in user
        if (!donation || donation.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).render('error', { message: 'Unauthorized' });
        }

        res.render('updatedonations-form', {
            user: req.session.user,
            donation: donation.toJSON()
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Failed to load donation' });
    }
});

// Handle donation update submission
app.put('/updatedonations/:id', upload.single('image'), async (req, res) => {
    try {
        const donationId = req.params.id;
        const updatedData = {
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            pickupLocation: req.body.pickupLocation,
            available: req.body.available,
            image: req.file ? '/uploads/' + req.file.filename : req.body.existingImage,
        };

        // Find and update the donation document
        const donation = await Donation.findById(donationId);

        // Optional: Check if donation belongs to the logged-in user
        if (!donation || donation.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).render('error', { message: 'Unauthorized' });
        }

        // Update donation
        await Donation.findByIdAndUpdate(donationId, updatedData);

        // Set success message
        req.session.updateSuccess = 'Donation updated successfully!';
        
        res.redirect('/mydonations');
    } catch (error) {
        console.error(error);
        res.render('updatedonations-form', { error: 'Something went wrong while updating your donation' });
    }
});

// deleting donations

app.post('/deletedonation/:id/delete', async (req, res) => {
    const donationId = req.params.id;

    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const donation = await Donation.findById(donationId);

        // Checking if the donation exists and if it belongs to the logged-in user
        if (!donation || donation.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).render('error', { message: 'Unauthorized' });
        }

        // Delete the donation
        await Donation.findByIdAndDelete(donationId);

        // Set success message
        req.session.deleteSuccess = 'Donation deleted successfully!';
        res.redirect('/mydonations');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Failed to delete donation' });
    }
});

// update user details
// getting user edit form
app.get('/edituser-form/:id', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const user = await User.findById(req.params.id);

        
        if (!user || user._id.toString() !== req.session.user._id.toString()) {
            return res.status(403).render('error', { message: 'Unauthorized' });
        }

        res.render('edituser-form', {
            user: req.session.user,
            editUser: user.toJSON()
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Failed to load user' });
    }
});

// updating user data
app.put('/edituser/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const updatedUserData = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            contactnumber: req.body.contactnumber,
            address: req.body.address
        };
        if (req.body.password) {
            updatedUserData.password = await bcrypt.hash(req.body.password, 10);
        }

        const user = await User.findByIdAndUpdate(userId, updatedUserData, { new: true });

        // Updating the session with new data
        req.session.user = user;
        req.session.save(err => {
            if (err) console.error('Session save error:', err);
            res.redirect('/my-account');
        });

    } catch (error) {
        console.error(error);
        res.render('edituser-form', { 
            error: 'Update failed. Please try again.',
            editUser: req.body
        });
    }
});

// about us page route
app.get('/about-us', (req, res) => {
    res.render('about-us', { user: req.user });
});

//booking items
// getting mycart
app.get('/mycart', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const userId = req.session.user._id;
    const bookings = await Cart.find({ userId })
    .populate('itemId', 'title pickupLocation image available')
    .lean(); // This will convert the Mongoose documents to plain JavaScript objects

// Flatten the data structure
bookings.forEach(booking => {
    booking.itemId = booking.itemId || {}; // Ensure itemId is an object if null
    booking.itemId.title = booking.itemId.title || '';
    booking.itemId.pickupLocation = booking.itemId.pickupLocation || '';
    booking.itemId.image = booking.itemId.image || '';
    booking.itemId.available = booking.itemId.available || false;
});

res.render('mycart', { bookings });
});

app.post('/book/:id', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const donation = await Donation.findById(req.params.id).populate('userId');

        if (!donation) {
            return res.status(404).send('Item not found');
        }

        if (!donation.available) {
            return res.status(400).send('Item already booked');
        }

        // Update the donation
        donation.available = false;
        donation.bookedBy = req.session.user._id;
        await donation.save();

        // Create a Cart entry
        await Cart.create({
          userId: req.session.user._id,
          itemId: donation._id
        });
    // Send email to the user who booked
    const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: req.session.user.email,
        subject: 'Booking Confirmation',
        text: `Dear ${req.session.user.firstname},\n\nYou have successfully booked the item: ${donation.title}.\n\nBest regards,\nThe Let's Donate Team`
    };

    // Send email to donor
    const publisherMailOptions = {
        from: process.env.EMAIL_USER,
        to: donation.userId.email,
        subject: 'Your Item Has Been Booked',
        text: `Dear ${donation.userId.firstname},\n\nYour item: ${donation.title} has been booked by ${req.session.user.firstname}.\n\nBest regards,\nThe Let's Donate Team`
    };

        await transporter.sendMail(userMailOptions);
        await transporter.sendMail(publisherMailOptions);

        res.redirect('/mycart');
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
});

// user delete booked items
app.delete('/cart/:id', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        // Remove the cart entry
        await Cart.findOneAndDelete({
            userId: req.session.user._id,
            itemId: req.params.id // Changed from itemId to params.id
        });

        // Update donation availability
        await Donation.findByIdAndUpdate(req.params.id, {
            available: true,
            bookedBy: null
        });

        res.redirect('/mycart');
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).send('An error occurred while removing the item.');
    }
});

// admin panel
// admin middlewear
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.isAdmin) {
        return next();
    }
    res.status(403).render('login', { message: 'Admin access required' });
};

// Admin Dashboard
app.get('/admin', isAdmin, async (req, res) => {
    try {
        // Fetch counts in parallel for better performance
        const [totalUsers, totalDonations, availableDonations, bookedDonations] = await Promise.all([
            User.countDocuments(),
            Donation.countDocuments(),
            Donation.countDocuments({ available: true }),
            Donation.countDocuments({ available: false })
        ]);
        res.render('admin-dashboard', {
            stats: {
                totalUsers,
                totalDonations,
                availableDonations,
                bookedDonations
            }
        });
        
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).render('error', { message: 'Failed to load dashboard statistics' });
    }
 });

 // Admin Users List
app.get('/admin/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find().lean();
        res.render('admin-users', { users });
    } catch (error) {
        res.status(500).render('error', { message: 'Failed to load users' });
    }
});

// Admin Donations List
app.get('/admin/donations', isAdmin, async (req, res) => {
    try {
        const donations = await Donation.find().populate('userId').lean();
        res.render('admin-donations', { donations });
    } catch (error) {
        res.status(500).render('error', { message: 'Failed to load donations' });
    }
});

// creating admin account using this one time route
// creating admin account using the route
app.get('/create-admin', async (req, res) => {
    try {
        const adminUser = new User({
            firstname: 'Admin',
            lastname: 'User',
            email: 'akilakangasala@gmail.com',
            contactnumber: '+1234567890',
            address: 'Admin Address',
            password: await bcrypt.hash('admin123', 10),
            isAdmin: true
        });
        
        await adminUser.save();
        res.send('Admin user created successfully');
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).send('Error creating admin user');
    }
});

// get admin-user edit form
app.get('/admin/users/:id/update', isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).lean(); // lean () added hbs does not allow to access to User.js
        
        if (!user) {
            return res.status(404).render('error', { message: 'User not found' });
        }

        res.render('admin-useredit-form', { user });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Failed to load user edit form' });
    }
});


//Admin edit users
app.post('/admin/users/:id/update', isAdmin, async (req, res) => {
    const userId = req.params.id;
    const updatedData = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      contactnumber: req.body.contactnumber,
      address: req.body.address,
      isAdmin: req.body.isAdmin === 'true' // converting to boolean
    };
  
    try {
      await User.findByIdAndUpdate(userId, updatedData);
      res.redirect('/admin/users');
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to update user');
    }
  });

  // Admin delete user
  app.delete('/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      await User.findByIdAndDelete(userId);
      res.redirect('/admin/users');
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to delete user');
    }
  });

  //Admin manage donations
app.get('/admin/donations', isAdmin, async (req, res) => {
    try {
        const donations = await Donation.find()
            .populate('userId', 'firstname lastname email') // populate donor info
            .populate('bookedBy', 'firstname lastname email') // populate booked user info
            .lean();

        res.render('admin-donations', { 
            donations,
        });
    } catch (error) {
        res.status(500).render('error', { message: 'Failed to load donations' });
    }
});

// Admin Delete Donation
app.delete('/admin/donations/:id', isAdmin, async (req, res) => {
    try {
        await Donation.findByIdAndDelete(req.params.id);
        res.redirect('/admin/donations');
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to delete donation');
    }
});

//home
app.get('/', async(req, res) => {
    try {
        const allItems = await Donation.find();
        res.render('index', {
            title: 'All Donated Items',
            allItems: allItems.map(item => item.toJSON())
        });
    } catch (error) {
        console.log(error);
        res.status(500).render('error', { message: 'Failed to fetch items' });
    }
});

