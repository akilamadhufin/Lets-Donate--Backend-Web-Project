const express = require('express');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');
require('dotenv').config();

const app = express();
app.use(express.static('public'));
app.engine('handlebars',exphbs.engine({
    defaultLayout: 'main'

}));

app.set('view engine', 'handlebars');

app.use(express.urlencoded({extended: false}));

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
    })
    // we need schema to make the structure of our document

    //loading the schema
    const Users = require('./models/Users');
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
app.get('/user-registration', (req,res) => {
    res.render('user-registration');
}); 
app.post('/users', async (req,res) => {
    console.log('Info' + req.body);
    const newUser = new Users (req.body);
    await newUser.save();
    res.send('Added user', newUser.firstname);
});

// delete and update- we have to use them in the project
//home

app.get('/', (req,res) => {
    res.render('index');
});

