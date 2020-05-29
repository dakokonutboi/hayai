const express = require('express')
const uniqid = require('uniqid')
const fs = require('fs')
const path = require('path')
const PORT = process.env.PORT || 5000
const cookieParser = require('cookie-parser')

let memory = []

class Room{
  constructor(password, id) {
    this.password = password
    this.id = id
    this.messages = []
  }
}

const app = express()
app.use(express.urlencoded())
app.use(cookieParser())

app.get('/', (req, res) => {
  res.redirect('/gui/index.html')
})

app.get('/gui/:ressource', (req, res) =>{
  if(fs.existsSync('ressources/'+req.params.ressource)){
    res.sendFile(path.join(__dirname + '/ressources/' + req.params.ressource))
  }else{
    res.send('<h1>404</h1>')
  }
})


app.get('/room/', (req, res) => {
  res.sendFile(path.join(__dirname + '/ressources/index.html'))
})

/*
app.get('/cookie/:name/:value', (req, res) => {
  res.cookie(req.params.name, req.params.value)
  res.send({result: 'success'})
})
*/

app.get('/api/getmessages', (req, res) => {
  if (req.query.room != undefined) {
    if (req.query.password != undefined) {
      let found = false
      let roompass = ''
      memory.forEach(element => {
        if(element.id == req.query.room){
          found = true
          roompass = element.password
        }
      })
      if(found){
        if(roompass == req.query.password){
          memory.forEach(element => {
            if(element.id == req.query.room){
              res.send({result: 'success', messages: element.messages})
            }
          })
        }else{
          res.send({result: 'failure', message: 'Wrong room password'})
        }
      }else{
        res.send({result: 'failure', message: 'Room does not exist'})
      }
    }else{
      res.send({result: 'failure', message: 'No room password'})
    }
  }else{
    res.send({result: 'failure', message: 'No room id'})
  }
})

app.get('/room/:roomid', (req, res) => {
  let found = false
  let roompass = ''
  memory.forEach(element => {
    if(element.id == req.params.roomid){
      found = true
      roompass = element.password
    }
  })
  if(found){
    if(roompass == req.query.password){
      res.cookie('room', req.params.roomid)
      res.cookie('room_password', roompass)
      if(req.cookies.username != undefined){
        res.sendFile(path.join(__dirname + '/room.html'))
      }else{
        res.sendFile(path.join(__dirname + '/username.html'))
      }
    }else{
      res.sendFile(path.join(__dirname + '/wrongpassword.html'))
    }
  }else{
    res.sendFile(path.join(__dirname + '/nosuchroom.html'))
  }
})

app.get('/interface/username', (req, res) => {
  res.sendFile(path.join(__dirname + '/username.html'))
})

app.get('/api/exit', (req, res) => {
  res.clearCookie('room')
  res.clearCookie('room_password')
  res.redirect('/')
})

app.get('/api/newmessage', (req, res) => {
  let found = false
  let roompass = ''
  memory.forEach(element => {
    if(element.id == req.cookies.room){
      found = true
      roompass = element.password
    }
  })
  if(found){
    if(roompass == req.cookies.room_password){
      memory.forEach(element => {
        if(element.id == req.cookies.room){
          element.messages.push('<span class="text-info">'+req.cookies.username.toString().split("<").join("&lt;").split(">").join("&gt;") + " : </span>" + req.query.content.toString().split("<").join("&lt;").split(">").join("&gt;"))
          res.send({result: 'success'})
        }
      })
    }else{
      res.send({result: 'failure', message: 'Wrong room password'})
    }
  }else{
    res.send({result: 'failure', message: 'Room does not exist'})
  }
})

app.post('/api/newroom', (req, res) => {
  if(req.body.roompassword != undefined && req.body.roompassword != ''){
    let roomid = uniqid()
    let roomindex = memory.push(new Room(req.body.roompassword, roomid)) - 1
    memory[roomindex].messages.push('This is the start of a new hayai chat')
    res.redirect('/room/'+roomid+"?password="+encodeURI(req.body.roompassword))
  }else{
    res.sendFile(path.join(__dirname + '/nopassword.html'))
  }
})

app.post('/api/username', (req, res) => {
  if(req.body.username != undefined && req.body.username != ''){
    res.cookie('username', req.body.username)
    res.redirect('/room/'+req.cookies.room+"?password="+encodeURI(req.cookies.room_password))
  }else{
    res.sendFile(path.join(__dirname + '/username.html'))
  }
})

app.listen(PORT, () => {
  console.log("Listening on port "+PORT)
})
