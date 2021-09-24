const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const User = require('./model/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'sdjkfh8923yhjdksbfma@#*(&@*!^#&@bhjb2qiuhesdbhjdsfg839ujkdhfjk'
var token;
var userLogged = false;
mongoose.connect('mongodb://localhost:27017/login-app-db', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	// useCreateIndex: true
})

const app = express()
app.set('view engine', 'ejs');
// app.use(bodyParser.urlencoded({ extended: true }))
app.use('/', express.static(path.join(__dirname, 'public')))
app.use(express.static(__dirname + '/views'));
//app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json())


app.get("/",function(req,res){
	if(userLogged == false){
	//if(typeof token === 'undefined' && token) {
   // do something with token
   // this will only work if the token is set in the localStorage
	 res.sendFile(__dirname+"/index.html");
 }else{
	res.sendFile(__dirname+"/logged_home.html");
}
});

app.get("/logout",function(req,res){
	userLogged=false;
	console.log("Logged out!!");
	res.redirect("/");
});

app.get("/categories/:topic", function(req,res){
  let cat = req.params.topic;

  res.render("categories", {catSelected: cat});

});


app.post('/api/login', async (req, res) => {
	const { username, password } = req.body
	const user = await User.findOne({ username }).lean()

	if (!user) {
		return res.json({ status: 'error', error: 'Invalid username/password' })
	}

	if (await bcrypt.compare(password, user.password)) {
		// the username, password combination is successful

		token = jwt.sign(
			{
				id: user._id,
				username: user.username
			},
			JWT_SECRET
		)
		userLogged = true;

		return res.json({ status: 'ok', data: token })
	}
	res.json({ status: 'error', error: 'Invalid username/password' })
});

app.post('/api/register', async (req, res) => {
  console.log(req.body);
	const {name, username, password: plainTextPassword } = req.body

	if (!username || typeof username !== 'string') {
		return res.json({ status: 'error', error: 'Invalid username' })
	}

	if (!plainTextPassword || typeof plainTextPassword !== 'string') {
		return res.json({ status: 'error', error: 'Invalid password' })
	}

	if (plainTextPassword.length < 5) {
		return res.json({
			status: 'error',
			error: 'Password too small. Should be atleast 6 characters'
		})
	}

	const password = await bcrypt.hash(plainTextPassword, 10)

	try {
		const response = await User.create({
			name,
			username,
			password
		})
		console.log('User created successfully: ', response)
		//res.sendFile(__dirname+"/index.html");
	} catch (error) {
		if (error.code === 11000) {
			// duplicate key
			return res.json({ status: 'error', error: 'Username already in use' })
		}
		throw error
	}

	res.json({ status: 'ok' })
});







app.listen(3000,function(){
  console.log("Server is running on port 3000");
});
