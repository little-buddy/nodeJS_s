


const users = []
const stdin = process.stdin;
const stdout = process.stdout;
const EventEmitter = require('events')
const emitter = new EventEmitter()

let temp = null
let flow = 'username'


stdin.setEncoding('utf8')
stdout.write('输入你的_username_:')
stdin.on('data',(chunk)=>{
  emitter.emit(flow,chunk)  
})

emitter.on('username',(chunk)=>{
  const username = chunk.trim()
  if(username.length==0){
    stdout.write('输入你的_username_:') // 这就是循环不好的地方，需要重复写2遍
    return
  }
  const findFlag = users.findIndex(user => user.username === username) !== -1
  if (findFlag) {
    stdout.write('用户名已存在，请使用一个更别致的用户名 -->')
    return;
  }
  stdout.write('请输入你的_password_:')
  temp = username
  flow = 'password'
})

emitter.on('password',(chunk)=>{
  const password = chunk.trim()
  stdout.write(`${temp} -> 注册成功...\n`)
  users.push({username:temp,password})
  stdout.write('请以_username;password_的形式登陆...:')
  flow = 'login'
  temp = ''
})

emitter.on('login',(chunk)=>{
  const [username,password] = chunk.trim().split(';')
  if(users.findIndex(user=>user.username===username&&user.password===password)!==-1) {
    stdout.write(`${username} -> 登陆成功...\n`)
    setTimeout(()=>{
      stdout.write('进入下一关... -> ')
      process.exit()
    },2000)
  }else{
    stdout.write('账户名或密码有误...\n')
    stdout.write('继续登陆/y or 重新注册/n ?\n')
    flow = 'choose'
  }
})

emitter.on('choose',chunk=>{
  const flag = chunk.trim()
  if(flag==='y'){
    stdout.write('请以_username;password_的形式登陆...:')
    flow = 'login'
  }else if(flag==='n'){
    stdout.write('输入你的_username_:')
    flow = 'username'
  }else{
    stdout.write('请输入 -> y/n')
  }
})

// 首先拿到的是用户名 -> 密码 -> 登陆状态 -> 它就会进入到另一个流程




// 第一遍的时候是需要 注册用户名
// 第二遍的时候是需要 录入密码
// 2次输入问题
