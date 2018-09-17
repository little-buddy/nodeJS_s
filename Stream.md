# Stream
*request to an HTTP server* / *process.stdout* 都是流的实例，流的实例意味着以下API都可以使用

All streams are instance of EventEmitter.

 - Types of Stream [4种流的类型]
 ```
  - Readable  输出流
    e.g. fs.createReadStream()
  - Writable  输入流
    e.g. fs.createWireteStream()
  - Duplex 输入输出双向流
    e.g net.Socket
  - Transform 双向流并且在读写data时可以对数据进行转换
    e.g zlib.createDeflate()
 ```

- - Object Mode
nodejs api 创建的流仅作用于 strings and Buffer(Uint8Array) 对象。
> 这里有个坑就是官方建议我们在使用别的js values的时候使用 objectMode ，但是它并没有告诉我们怎么去调换，stream的constructor也没告诉我们

- - Buffering

 Writable Readable 将会存储数据在内建的buffer对象上，这个buffer对象可以通过 writable._writableState.getBuffer() or readable._readableState.buffer 获取

 大量的数据可能被缓冲的时候，我们在构造stream的时候传要使用hightWaterMark选项，这个选项指定了字节的总数。在对象模式它指定了对象的总数

 数据通过 Readable.push(chunk) 的形式进行进行缓冲。Readable.read()是不能被调用的，直到内在的需要写入流的数据队列为空

一旦自建的读缓冲区总大小达到hightWaterMark的临界值，流就会暂时性地停止去读潜在资源的数据(意味着内建的 readable._read()方法已经填充满了流缓冲区)，直到这个被流的缓冲区部分得到释放

写缓冲区也是如此，每次写入之后，缓冲区的容量小于hightWaterMark的时候会返回true，超过了则返回false

stream.pipe() 限制了数据缓冲区的接受等级来防止过度使用内存

 - Api for Stream Consumers
```
e.g.
  http
  req -> Readable
  res -> Wirtable

  Writable 流暴露了 write 和 end 方法，将数据写入流
  Readable 流使用 EventEmitter 通过执行代码块从缓冲区读数据而使数据脱离流的缓冲区
  Writable Readable 都使用EventEmitter的多种方式来通信当前流的状态
  引用既不需要将数据写入流，也不需要从流中读取数据，是不需要直接实现stream接口的，一般也没有理由要调用 stream 模块

  req.on('end') 监听的是收到完整body时调用
```
## Wirteable Streams
Examples of Writable

  ->

  - HTTP requests on the client
  - HTTP responses on the server
  - fs write streams
  - zlib streams
  - crypto streams
  - TCP sockets
  - child process stdin
  - process.stdout,process.stderr

  有些例子通常是 Duplex 实现了 Writable interface

  Writable 实现有多种方式，但大多数都遵循这种模型
  ```
    const myStream = getWritableStreamSomehow()
    myStream.wirte('something')
    myStream.end('write end...')
  ```


```
  class Writable{
    enum Event{
      close -> 不是所有的流都能触发这个事件，一般资源关闭触发
      drain -> 调用 wirte 缓存区 boom 触发
      error -> 
      finish -> 在 stream.end() 之后触发，所有数据都被flushed
      pipe -> 将一个 writer 传入 reader.pipe() 时触发
      unpipe -> 将 writer 传入 unpipe 中触发
      // 以上方法似乎需要手动监听，stream extends EventEmitter
      // 这些继承了EventEmitter的模块，大多数时候只需要自己写监听，调用的环节它在内部逻辑已经封装掉了
    }
    cork()
      -> 这个方法是直接将数据写入内存缓冲区, uncork\end 都会flushed
    end([chunk][,encoding][,callback]) end之后无法再写入
    setDefaultEncoding(encoding)
    uncork()
      -> 调多少次cork就需要对应调多少次uncork，这种模式下推荐 uncork 写在 process.nextTick 来确保所有写入都在一个 event loop阶段
    writableHighWaterMark
      -> 返回构造stream时的 hightWaterMark
    write(chunk[,encoding][,callback])
      -> 
    destroy([error])

    // chunk string | Buffer | Uint8Array | any -> null 是invalid
  }
```

 - Readable Streams

### Two Modes
- flowing
> 从可能的系统中自动读取数据，并且使用emitter尽可能快地提供给应用
- paused
> 一定要明确调用 stream.read 才能从流中取读取

所有的 readable流默认 paused模式，想要切换成flowing模式有以下几种方:
- adding a 'data' event handler
- call stream.resume()
- call stream.pipe()

这里我明白了，原来流的读取是会暂停的需要主动获取，设置了data相当于被动接受，因为程序比我们更快的知道什么时候有数据可以读取

开启了flowing模式，必然可以切换回paused模式啊:
- 如果没有pipe目标文件，调用 stream.pause()
- 如果有pipe目标文件，调用 stream.unpipe()

删除了data事件，stream将不会自动暂停。并且在piped destinations 模式下调用 stream.pause() 那么数据量一旦超过临界值将不会暂停

### Three States
- readable._readableState.flowing = null
- readable._readableState.flowing = false
- readable._readableState.flowing = true

  Choose One
  推荐使用 readable.pipe() 这个新型的api，当你需要更多流的控制权的时候，你可以使用 readable.pause() / readable.resume()

```
  class Readable{
    enum Evnet{
      close
      data
      end
      error
      readable -> 这个 跟 data 有什么区别。好像是第一次读和断开时触发
    }
    isPaused() 当前流是否是 paused 模式
    pause()
    pipe(destination,[,options]) 会一次性将数据推到目标文件
    readableHighWaterMark
    read([size]) 读取一定大小的数据
    resume()
    setEncoding(encoding)
    unpipe([destination])
    unshift(chunk) 不能再end事件之后调用，否则就要抛出异常
    wrap(stream) depracated oldVersion
    destroy([error])
  }
```

 - Duplex and Transform Streams

```
  Class:stream.Duplex
  Class:stream.Transform
    zlib streams
    crypto streams
```

 - Api for Stream Implements
 
 用extends实现Stream很简单

 新的流必须要实现下面的方法
 
 | Use-case | Class | Mthod(s) to implement |
 | --- | --- | --- |
 | Reading only | Readable | _read |
 | Writing only | Writable | _write,_writev,_final |
 | Reading and Writing | Duplex | _read,_wirte,_writev,_final |
 | Operate on written,then read the result | Transform | _transform,_flush,_final |

```
Writeable 的 options{
  highWaterMark:number 默认 16384(16kb)
  decodeStrings:boolean 默认 true 决定字符串是否可以写进buffers
  objectMode:boolean 默认 false 设置这个了就意味着写js value称为可能
  write:Function 实现_wirte
  writev:Function 实现_writev
  destroy:Function 实现 _destroy
  final:Function 实现 _final
}
_writev:(chunks:Array<{chunk,encoding}>,callback)=>{} 无法被应用调用

Readable 的 options{
  highWaterMark
  encoding
  objectMode
  read
  destroy
}

Duplex 的 options{
  allowHalfOpen:boolean default:true 当为false，读被关闭流就自动结束
  readableObjectMode:boolean default:false
  writableObjectMode:boolean default:false
  readableHighWaterMark:number
  writableHighWaterMark:number
}

chunk 一般是buffer类型，除非 decodeStrings:false objectMode:true
encoding 只有在 string chunk的类型下有效
callback : (err,value)=>{}
```
 - Additional Notes
 ```
  Compatibility with Older Node.js Versions
  readable.read(0)
  readable.push('')
  highWaterMark discrepancy after calling readable.setEncoding()
 ```

 [生词]
```
  rarely 彻底地
  if ever 如果曾经
  primarily 主要地
  consumer 消费者 -> consuming 沉迷于...
  fundamental 基本的
  exclusively 专门地,完全地，仅
  potentially 潜在地，可能地
  threshold 门槛、临界值
  temporarily 暂时地
  repeatedly 不停地
  overwhelm 过度使用
  generally 一般地
  abstraction 抽象概念
  destination 目的文件
  illustrated 有照片的，图解的
  underlying 表面下的
  adverse impact 负面影响
  performance 性能
  explicitly 明确地
  concept 概念
  mechanism 机制
  guarantee 维修单、维护？
  evolved 进化的
  appropriate 适当地
```
