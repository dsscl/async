// 分布式事件

// 2.1、PubSub（publish/subscribe）模式
// 2.1.1 EventEmitter对象
// 2.1.2 玩转自己的PubSub
// 对于支持的每种事件类型，唯一需要存储的状态值就是一个事件处理器清单
PubSub = {handlers: {}}

// 需要添加事件监听器时，只要将监听器推入数组末尾即可（这意味着总是会按照添加监听器的次序来调用监听器）
PubSub.on = function(eventType, handler) {
    if(!(eventType in this.handlers)) {
        this.handlers[eventType] = []
    }
    this.handlers[eventType].push(handler)
    return this
}

// 接着，等到触发事件的时候，再循环遍历所有的事件处理器
PubSub.emit = function(eventType) {
    var handlerArgs = Array.prototype.slice.call(arguments, 1) //截取第二个到最后一个参数
    for(var i=0; i<this.handlers[eventType].length; i++) {
        this.handlers[eventType][i].apply(this, handlerArgs)
    }
    return this
}

// 现在只实现了Node之EventEmitter对象的核心部分（还没实现的重要部分只剩下移除事件处理器及附加一次性事件处理器等功能）

// 2.1.3 同步性
// 尽管PubSub模式是一项处理异步事件的重要技术，但它内在跟异步没有任何关系
$('input[type=submit]')
.on('click', function() { console.log('foo') })
.trigger('click')
console.log('bar')
>foo
>bar
// 这证明了click事件的处理器因trigger方法而立即被激活。事实上，只要触发了jQuery事件，就会不被中断地按顺序执行其所有事件处理器
// 先明确一点，用户点击Submit按钮时，这确实是一个异步事件。点击事件的第一个处理器会从事件队列中被触发。
// 然而，事件处理器本身无法知道自己是从事件队列中还是从应用代码中运行的
// 如果事件按顺序触发了过多的处理器，就会有阻塞线程且导致浏览器不响应的风险。
// 更糟糕的是，如果事件处理器本身触发了事件，还很容易造成无限循环
$('input[type=submit]')
.on('click', function() {
    $(this).trigger('click') // 堆栈上溢！
})

// 回想本章开头提到的文字处理程序的例子。用户按键时，需要发生很多事情，其中某些事情还需要复杂的计算，。
// 全部做完这些事情之后再返回事件队列，只会制造出响应迟钝的应用
// 这个问题有一个很好的解决方案，就是对那些无需即刻发生的事情维持一个队列，并使用一个计时函数定时运行此队列中的下一项任务。
var tasks = []
setInterval(function() {
    var nextTask
    if(nextTask = tasks.shift()) {  //?
        nextTask()
    }
}, 0)
// PubSub模式简化了事件的命名、分发和堆积。任何时刻，只要直觉上认为对象会声明发生什么事情，就可以使用PubSub这种很棒的模式

// 2.2、事件化模型
// 只要对象带有PubSub接口，就可以称之为事件化对象
// 特殊情况出现在用于存储数据的对象因内容变化而发布事件时，这里用于存储数据的对象又称作模型。模型就是MVC(Model-View-Controller)的M
// MVC三层架构设计模式在最近几年里已经成为JavaScript编程中最热点的主题之一
// MVC的核心理念是应用程序应该以数据为中心，所以模型发生的事件会影响到DOM（及MVC中的视图）和服务器（通过MVC的控制器而产生影响）
// 先看看人气爆棚的Backbone.js框架，创建一个新的Model（模型）对象
style = new Backbone.Model(
    {font: 'Georgia'}
)
// model作为参数时只是代表了那个简单的可以传递的JSON对象
style.toJSON() // {"font": "Georgia"}
// 但不同于普通对象的是，这个model对象会在发生变化时发布通知
style.on('change:font',function(model, font) {
    alert('Thank you for choosing ' + font + '!')
})
// 老式的javascript依靠输入事件的处理器直接改变DOM。新式的javascript先改变模型，接着由模型触发事件而导致DOM的更新
// 在几乎所有的应用程序中，这种关注层面的分离都会带来更优雅、更直观的代码

// 2.2.1模型事件的传播
// 作为最简形式，MVC三层架构只包括相关联系的模型和视图：“如果模型是这样变化的，那么DOM就要那样变化。”
// 不过，MVC三层架构最大的利好出现在change（变化）事件冒泡上溯数据树的时候
// 不用再去订阅数据树每片叶子上发生的事件，而只需订阅数据树根和枝处发生的事件即可

// 事件化模型的set/get方法
// 如我们所知，javascript确实没有一种每当对象变化时就触发事件的机制。
// 因此请记住，事件化模型要想工作的话，必须要使用一些像Backbone.js之set/get这样的方法
style.set({font: 'Palatino'})  // 触发器警报！
style.get('font') // 结果为"Palatino"
style.font = 'Comic Sans' // 未触发任何事件
style.font // 结果为"Comic Sans"
style.get('font') // 结果仍为"Palatino"
// 将来也行无需如此，前提是名为Object.observe的ECMAscript提案已经获得广泛接纳

// 为此，Backbone的Model对象常常组织成Backbone集合的形式，其本质是事件化数组
// 我们可以监听什么时候对这些数组增减了Model对象，Backbone集合可以自动传播其内蕴Model对象所发生的事件
// 例：假设有一个spriteCollection(精灵集合)集合对象包含了上百个Model对象，这些Model对象代表了要画在canvas（画布）元素上的一些东西
// 每当任意一个精灵发生变化，都需要重新绘制画布，我们不用逐个在那些精灵上附加redraw（重绘）函数作为change时间的处理器，相反，只需要一行代码:
spritCollection.on('change', redraw)
// 注意，集合事件的这种自动传播只能下传一层。Backbone没有嵌套式集合这样的概念
// 不过，我们可以自行用Backbone的trigger方法来实现嵌套式集合的多层传播
// 有了多层传播机制后，任意的Backbone对象都可以触发任意的事件

// 2.2.2事件循环与嵌套式变化
// 从一个对象向另一个对象传播事件的过程提出了一些需要关注的问题：
// 如果每次有个对象上的事件引发了一系列事件并最终对这个对象本身触发了相同的事件，则结果就是事件循环
// 如果这种事件循环还是同步的，那就造成了堆栈上溢！

// 然而很多时候，变化事件的循环恰恰是我们想要的。最常见的情况是双向绑定——两个模型的取值会彼此关联
// 假设我们想保证X始终等于2*y
var x = new Backbone.Model({value: 0})
var y = new Backbone.Model({value: 0})
x.on('change:value', function(x, xVal) {
    y.set({value: xVal / 2})
})
y.on('change:value', function(y, yVal) {
    x.set({value: 2 * yVal})
})
// 你可能觉得当x或y的取值变化时，这段代码会导致无限循环。
// 但实际上它相当安全，这样感谢Backbone中的两道保险
// 1）当新值等于旧值时，set方法不会导致触发change事件
// 2）模型正处于自身的change事件期间时，不会再触发change事件
// 第二道保险代表了一种自保哲学。假设模型的一个变化导致同一个模型又一次变化。
// 由于第二次变化被“嵌套”在第一次变换内部，所以这次变化的发生悄无声息。外面的观察者没有机会回应这种静默的变化

// 很明显，在Backbone中维持双向数据绑定是一个挑战。而另一个重要的MVC框架，即Ember.js，采用了一种完全不同的方式：双向绑定必须作显示声明
// 一个值发生变化时，另一个值会通过延时事件作异步更新
// 于是，在触发这个异步更新事件之前，应用程序的数据将一直处于不一致的状态

// 多个事件化模型之间的数据绑定问题不存在简单的解决方案
// 在Backbone中，有一种审慎绕过这个问题的途径就是silent标志。
// 如果在set方法中添加了{silent: true}选项，则不会触发change事件
// 因此，如果多个彼此纠结的模型需要同时进行更新，一个很好的解决方法就是悄无声息地设置它们的值
// 然后，当这些模型的状态已经一致时，才调用它们的change方法以触发对应的事件

// 事件化模型为我们带来了一种将对应应用状态变化转换为事件的直观方式
// Backbone及其他MVC框架做的每件事都跟这些模型有关，这些模型的状态变化会触发DOM和服务器进行更新
// 要想掌控客户端JavaScript应用程序与日俱增的复杂度，运用事件化模型存储互斥数据是伟大长征的第一步

// 2.3jQuery自定义事件
// 自定义事件是jQuery被低估的特性之一，它简化了强大分布式事件系统向任何Web应用程序的移植，而且无需额外的库
// 在jQuery中，可以使用trigger方法基于任意DOM元素触发任何想要的事件
$('#tabby, #socks').on('meow', function() {
    console.log(this.id + ' meowed')
})
$('#tabby').trigger('meow')  // "tabby meowed"
$('#socks').trigger('meow')  // "socks meowed"
// 如果以前用过DOM事件，则肯定熟悉冒泡技术。
// 只要某个DOM元素触发了某个事件，其父元素就会接着触发这个事件，接着是父元素的父元素，以此类推，一直上溯到根元素（即document），
// 除非在这条冒泡之路的某个地方调用了时间的stopPropagation方法（如果事件返回false，jquery会替我们自动调用stopPropagation方法）
// 是否知道jquery自定义事件的冒泡技术呢？假设有个名为“soda”的span标签嵌套在名称为“bottle”的div元素中，代码如下：
$('#soda, #bottle').on('fizz', function() {
    console.log(this.id + ' emitted fizz')
})
$('#soda').trigger('fizz')
>soda emitted fizz
>bottle emitted fizz
// 这种冒泡方式并非始终受人欢迎，jquery同样提供了非冒泡式的triggerHandler方法。

// jquery自定义事件是PubSub模式的忤逆产物，因为这里由可选择的DOM元素而不是脚本中的对象来触发事件
// 事件化模型更像是一种直观表达状态相关事件的方式，
// 而jquery的自定义事件允许直接通过DOM来表达DOM相关的事件，不必再把DOM变化的状态复制到应用程序的其他地方

// 2.4小结
// PubSub作为最基本的javascript设计模式之一实现了分布式事件。如果没有订阅那些行将发布的事件，PubSub将是完全隐形的。
// 正确运用PubSub模式的关键是判定由哪些实体分发事件

// 任何对象只要简单地继承诸如Node之EventEmitter这样的原型，就可以用作PubSub实体。
// 当对象关联着一组异步任务或一系列I/O事件时，把它变成事件化对象会是个不错的想法

// 有一类特殊的事件化对象是MVC库（如Backbone.js）中的模型。这些模型即包含着应用程序的状态数据，又能声明自己发生的变化
// change事件可以触发应用程序的逻辑，引起DOM更新。并导致服务器的同步

// jquery不仅能很好地响应浏览器提供的DOM事件，而且还非常适用于那些与DOM元素变化有关的分布式事件
// 事件化的对象与DOM元素的事件可以彼此完美互补，这有助于保持应用程序状态数据与应用视图相对于彼此的封装状态

// PubSub模式尤其不适用于一次性事件，一次性事件要求对异步函数执行的一次性任务的两种结果（完成任务和任务失败）做不同的处理（AJAX就是常见的一次性事件实例）
// 用于解决一次性事件问题的工具叫做Promise

